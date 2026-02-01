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
      owner: userId,
      team: [userId],
    });

    return createdProject.save();
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
      .populate('owner', 'name email')
      .populate('team', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUser(userId: string): Promise<Project[]> {
    return this.projectModel
      .find({
        $or: [{ owner: userId }, { team: userId }],
      })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectModel
      .findById(id)
      .populate('owner', 'name email')
      .populate('team', 'name email')
      .exec();

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
  ): Promise<Project> {
    const project = await this.findOne(id);

    // Get current user to check role
    const currentUser = await this.userModel.findById(userId);
    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    // Allow if user is ADMIN, owner, or in team
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isOwner = project.owner.toString() === userId;
    const isTeamMember = project.team.some((member: any) => member.toString() === userId);

    if (!isAdmin && !isOwner && !isTeamMember) {
      throw new ForbiddenException('You do not have permission to update this project');
    }

    const updatedProject = await this.projectModel
      .findByIdAndUpdate(id, updateProjectDto, { new: true })
      .populate('owner', 'name email')
      .populate('team', 'name email')
      .exec();

    if (!updatedProject) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return updatedProject;
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.findOne(id);

    // Get current user to check role
    const currentUser = await this.userModel.findById(userId);
    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    // Allow if user is ADMIN or project owner
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isOwner = project.owner.toString() === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Only project owner or admin can delete the project');
    }

    await this.projectModel.findByIdAndDelete(id).exec();
  }

  async addTeamMember(projectId: string, userId: string, memberToAdd: string): Promise<Project> {
    const project = await this.findOne(projectId);

    // Get current user to check role
    const currentUser = await this.userModel.findById(userId);
    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    // Allow if user is ADMIN or project owner
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isOwner = project.owner.toString() === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Only project owner or admin can add team members');
    }

    if (project.team.some((member: any) => member.toString() === memberToAdd)) {
      throw new ForbiddenException('User is already a team member');
    }

    project.team.push(memberToAdd as any);
    return project.save();
  }

  async removeTeamMember(projectId: string, userId: string, memberToRemove: string): Promise<Project> {
    const project = await this.findOne(projectId);

    // Get current user to check role
    const currentUser = await this.userModel.findById(userId);
    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    // Allow if user is ADMIN or project owner
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isOwner = project.owner.toString() === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Only project owner or admin can remove team members');
    }

    project.team = project.team.filter((member: any) => member.toString() !== memberToRemove) as any;
    return project.save();
  }

  async getStatistics(projectId: string): Promise<any> {
    const project = await this.findOne(projectId);

    // This would be expanded to include actual statistics from related collections
    return {
      project: {
        id: project._id,
        name: project.name,
        status: project.status,
      },
      statistics: {
        totalBeneficiaries: 0, // To be calculated
        totalActivities: 0,
        totalSurveys: 0,
        completionRate: 0,
      },
    };
  }
}
