import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
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
    return this.projectModel
      .find(filters || {})
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

    // Check if user is owner or in team
    if (
      project.owner.toString() !== userId &&
      !project.team.some((member: any) => member.toString() === userId)
    ) {
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

    // Only owner can delete
    if (project.owner.toString() !== userId) {
      throw new ForbiddenException('Only project owner can delete the project');
    }

    await this.projectModel.findByIdAndDelete(id).exec();
  }

  async addTeamMember(projectId: string, userId: string, memberToAdd: string): Promise<Project> {
    const project = await this.findOne(projectId);

    if (project.owner.toString() !== userId) {
      throw new ForbiddenException('Only project owner can add team members');
    }

    if (project.team.some((member: any) => member.toString() === memberToAdd)) {
      throw new ForbiddenException('User is already a team member');
    }

    project.team.push(memberToAdd as any);
    return project.save();
  }

  async removeTeamMember(projectId: string, userId: string, memberToRemove: string): Promise<Project> {
    const project = await this.findOne(projectId);

    if (project.owner.toString() !== userId) {
      throw new ForbiddenException('Only project owner can remove team members');
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
