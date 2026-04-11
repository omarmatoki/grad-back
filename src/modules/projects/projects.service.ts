import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from './schemas/project.schema';
import { ProjectTypeEntity } from './schemas/project-type.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateProjectTypeDto } from './dto/create-project-type.dto';
import { UpdateProjectTypeDto } from './dto/update-project-type.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User, UserRole } from '@modules/users/schemas/user.schema';

const DEFAULT_PROJECT_TYPES: Array<{ value: string; label: string }> = [
  { value: 'educational', label: 'تعليمي' },
  { value: 'health', label: 'صحي' },
  { value: 'training', label: 'تدريبي' },
  { value: 'intervention', label: 'تدخل' },
  { value: 'evaluation', label: 'تقييم' },
  { value: 'mixed', label: 'مختلط' },
];

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(ProjectTypeEntity.name) private projectTypeModel: Model<ProjectTypeEntity>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  private normalizeProjectTypeValue(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w\u0600-\u06FF-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private async seedDefaultProjectTypes(): Promise<void> {
    await Promise.all(
      DEFAULT_PROJECT_TYPES.map((projectType) =>
        this.projectTypeModel.updateOne(
          { value: projectType.value },
          {
            $setOnInsert: {
              value: projectType.value,
              label: projectType.label,
            },
          },
          { upsert: true },
        ),
      ),
    );
  }

  private async assertProjectTypeExists(type: string): Promise<void> {
    const normalizedType = this.normalizeProjectTypeValue(type);
    await this.seedDefaultProjectTypes();

    const exists = await this.projectTypeModel.exists({ value: normalizedType });
    if (!exists) {
      throw new BadRequestException('Project type is not registered');
    }
  }

  async getProjectTypes(): Promise<ProjectTypeEntity[]> {
    await this.seedDefaultProjectTypes();

    return this.projectTypeModel
      .find()
      .sort({ createdAt: 1, label: 1 })
      .exec();
  }

  async createProjectType(
    createProjectTypeDto: CreateProjectTypeDto,
    userId: string,
  ): Promise<ProjectTypeEntity> {
    await this.seedDefaultProjectTypes();

    const value = this.normalizeProjectTypeValue(
      createProjectTypeDto.value || createProjectTypeDto.label,
    );
    const label = createProjectTypeDto.label.trim();

    if (!value) {
      throw new BadRequestException('Project type value cannot be empty');
    }

    const existingByValue = await this.projectTypeModel.findOne({ value }).exec();
    if (existingByValue) {
      throw new BadRequestException('Project type already exists');
    }

    const existingByLabel = await this.projectTypeModel
      .findOne({ label: { $regex: `^${escapeRegExp(label)}$`, $options: 'i' } })
      .exec();
    if (existingByLabel) {
      throw new BadRequestException('Project type already exists');
    }

    const created = await this.projectTypeModel.create({
      value,
      label,
      createdBy: userId,
    });

    return created;
  }

  async updateProjectType(
    id: string,
    updateProjectTypeDto: UpdateProjectTypeDto,
  ): Promise<ProjectTypeEntity> {
    await this.seedDefaultProjectTypes();

    const projectType = await this.projectTypeModel.findById(id).exec();
    if (!projectType) {
      throw new NotFoundException(`Project type with ID ${id} not found`);
    }

    const nextLabel = updateProjectTypeDto.label.trim();
    if (!nextLabel) {
      throw new BadRequestException('Project type label cannot be empty');
    }

    const duplicateByLabel = await this.projectTypeModel
      .findOne({
        _id: { $ne: id },
        label: { $regex: `^${escapeRegExp(nextLabel)}$`, $options: 'i' },
      })
      .exec();

    if (duplicateByLabel) {
      throw new BadRequestException('Project type already exists');
    }

    projectType.label = nextLabel;
    await projectType.save();

    return projectType;
  }

  async removeProjectType(id: string): Promise<{ message: string }> {
    await this.seedDefaultProjectTypes();

    const projectType = await this.projectTypeModel.findById(id).exec();
    if (!projectType) {
      throw new NotFoundException('نوع المشروع غير موجود');
    }

    const linkedProjectsCount = await this.projectModel.countDocuments({
      type: projectType.value,
    });

    if (linkedProjectsCount > 0) {
      throw new BadRequestException(
        'لا يمكن حذف نوع المشروع لوجود مشاريع مرتبطة بهذا النوع',
      );
    }

    await this.projectTypeModel.findByIdAndDelete(id).exec();

    return { message: 'تم حذف نوع المشروع بنجاح' };
  }

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
    const normalizedType = this.normalizeProjectTypeValue(createProjectDto.type);
    await this.assertProjectTypeExists(normalizedType);

    const createdProject = new this.projectModel({
      ...createProjectDto,
      type: normalizedType,
      user_id: userId,
    });

    const saved = await createdProject.save();
    return this.findOne(saved._id.toString());
  }

  async findAll(filters?: any): Promise<Project[]> {
    const query: any = {};

    if (filters?.search) {
      query.name = { $regex: filters.search, $options: 'i' };
    }
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.type) {
      query.type = filters.type;
    }
    if (filters?.startDate) {
      query.startDate = { $gte: new Date(filters.startDate) };
    }
    if (filters?.endDate) {
      query.endDate = { $lte: new Date(filters.endDate) };
    }

    return this.projectModel
      .find(query)
      .populate('user_id', 'name email phone role status')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUser(userId: string): Promise<Project[]> {
    return this.projectModel
      .find({ user_id: userId })
      .populate('user_id', 'name email phone role status')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectModel
      .findById(id)
      .populate('user_id', 'name email phone role status')
      .exec();

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<Project> {
    const project = await this.projectModel.findById(id).lean().exec();

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const currentUser = await this.userModel.findById(userId);
    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isOwner = project.user_id.toString() === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You do not have permission to update this project');
    }

    if (updateProjectDto.type) {
      const normalizedType = this.normalizeProjectTypeValue(updateProjectDto.type);
      await this.assertProjectTypeExists(normalizedType);
      updateProjectDto.type = normalizedType;
    }

    await this.projectModel.findByIdAndUpdate(id, updateProjectDto, { new: true }).exec();
    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.findOne(id);

    const currentUser = await this.userModel.findById(userId);
    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isOwner = project.user_id.toString() === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Only project owner or admin can delete the project');
    }

    await this.projectModel.findByIdAndDelete(id).exec();
  }

  async getStatistics(projectId: string): Promise<any> {
    const project = await this.findOne(projectId);

    return {
      project: {
        id: project._id,
        name: project.name,
        status: project.status,
      },
      statistics: {
        totalActivities: 0,
        totalSurveys: 0,
        completionRate: 0,
      },
    };
  }
}
