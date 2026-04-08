import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User, UserRole } from '@modules/users/schemas/user.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
    const createdProject = new this.projectModel({
      ...createProjectDto,
      user_id: userId,
      team: [userId],
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
      .populate('team', 'name email phone role status')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUser(userId: string): Promise<Project[]> {
    return this.projectModel
      .find({
        $or: [{ user_id: userId }, { team: userId }],
      })
      .populate('user_id', 'name email phone role status')
      .populate('team', 'name email phone role status')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectModel
      .findById(id)
      .populate('user_id', 'name email phone role status')
      .populate('team', 'name email phone role status')
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
    const isTeamMember = project.team.some((member: any) => member.toString() === userId);

    if (!isAdmin && !isOwner && !isTeamMember) {
      throw new ForbiddenException('You do not have permission to update this project');
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

  async addTeamMember(projectId: string, userId: string, memberToAdd: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId).lean().exec();

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const currentUser = await this.userModel.findById(userId);
    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isOwner = project.user_id.toString() === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Only project owner or admin can add team members');
    }

    if (project.team.some((member: any) => member.toString() === memberToAdd)) {
      throw new ForbiddenException('User is already a team member');
    }

    await this.projectModel.findByIdAndUpdate(
      projectId,
      { $addToSet: { team: memberToAdd } },
      { new: true },
    ).exec();

    return this.findOne(projectId);
  }

  async removeTeamMember(projectId: string, userId: string, memberToRemove: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId).lean().exec();

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const currentUser = await this.userModel.findById(userId);
    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isOwner = project.user_id.toString() === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Only project owner or admin can remove team members');
    }

    await this.projectModel.findByIdAndUpdate(
      projectId,
      { $pull: { team: memberToRemove } },
      { new: true },
    ).exec();

    return this.findOne(projectId);
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
