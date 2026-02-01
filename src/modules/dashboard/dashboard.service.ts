import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '@modules/projects/schemas/project.schema';
import { Survey } from '@modules/surveys/schemas/survey.schema';
import { SurveyResponse } from '@modules/surveys/schemas/survey-response.schema';
import { Beneficiary } from '@modules/beneficiaries/schemas/beneficiary.schema';
import { UserRole } from '@modules/users/schemas/user.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Survey.name) private surveyModel: Model<Survey>,
    @InjectModel(SurveyResponse.name) private responseModel: Model<SurveyResponse>,
    @InjectModel(Beneficiary.name) private beneficiaryModel: Model<Beneficiary>,
  ) {}

  async getStats(userId: string, userRole: UserRole) {
    // Build query based on user role
    const projectQuery = userRole === UserRole.ADMIN
      ? {}
      : userRole === UserRole.STAFF
      ? { $or: [{ owner: userId }, { team: userId }] }
      : { team: userId };

    // Get projects stats
    const totalProjects = await this.projectModel.countDocuments(projectQuery);
    const activeProjects = await this.projectModel.countDocuments({
      ...projectQuery,
      status: 'active'
    });
    const completedProjects = await this.projectModel.countDocuments({
      ...projectQuery,
      status: 'completed'
    });

    // Get surveys stats
    const projects = await this.projectModel.find(projectQuery).select('_id');
    const projectIds = projects.map(p => p._id);

    const totalSurveys = await this.surveyModel.countDocuments({
      project: { $in: projectIds }
    });

    // Get beneficiaries stats
    const totalBeneficiaries = await this.beneficiaryModel.countDocuments({
      project: { $in: projectIds }
    });

    // Get responses stats
    const surveys = await this.surveyModel.find({ project: { $in: projectIds } }).select('_id');
    const surveyIds = surveys.map(s => s._id);

    const totalResponses = await this.responseModel.countDocuments({
      survey: { $in: surveyIds }
    });

    // Calculate completion rate
    const targetResponses = surveys.length > 0
      ? (await this.surveyModel.aggregate([
          { $match: { _id: { $in: surveyIds } } },
          { $group: { _id: null, total: { $sum: '$targetResponses' } } }
        ]))[0]?.total || 0
      : 0;

    const completionRate = targetResponses > 0
      ? Math.round((totalResponses / targetResponses) * 100)
      : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalSurveys,
      totalBeneficiaries,
      totalResponses,
      completionRate,
      impactScore: 0, // Will be calculated from analysis data
    };
  }
}
