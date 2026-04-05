import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectStatus } from '@modules/projects/schemas/project.schema';
import { Survey } from '@modules/surveys/schemas/survey.schema';
import { SurveySubmission, SubmissionStatus } from '@modules/surveys/schemas/survey-submission.schema';
import { Beneficiary } from '@modules/beneficiaries/schemas/beneficiary.schema';
import { UserRole } from '@modules/users/schemas/user.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Survey.name) private surveyModel: Model<Survey>,
    @InjectModel(SurveySubmission.name) private submissionModel: Model<SurveySubmission>,
    @InjectModel(Beneficiary.name) private beneficiaryModel: Model<Beneficiary>,
  ) {}

  async getStats(userId: string, userRole: UserRole) {
    const projectQuery = userRole === UserRole.ADMIN
      ? {}
      : userRole === UserRole.STAFF
      ? { $or: [{ owner: userId }, { team: userId }] }
      : { team: userId };

    const totalProjects = await this.projectModel.countDocuments(projectQuery);

    const inProgressProjects = await this.projectModel.countDocuments({
      ...projectQuery,
      status: ProjectStatus.IN_PROGRESS,
    });

    const completedProjects = await this.projectModel.countDocuments({
      ...projectQuery,
      status: ProjectStatus.COMPLETED,
    });

    const projects = await this.projectModel.find(projectQuery).select('_id');
    const projectIds = projects.map(p => p._id);

    const totalSurveys = await this.surveyModel.countDocuments({
      project: { $in: projectIds },
    });

    const totalBeneficiaries = await this.beneficiaryModel.countDocuments({
      project: { $in: projectIds },
    });

    const surveys = await this.surveyModel.find({ project: { $in: projectIds } }).select('_id');
    const surveyIds = surveys.map(s => s._id);

    // Count unique sessions (distinct survey+participant+startedAt combos)
    const totalResponses = await this.submissionModel.countDocuments({
      survey: { $in: surveyIds },
      status: SubmissionStatus.COMPLETED,
    });

    const targetResponses = surveys.length > 0
      ? (await this.surveyModel.aggregate([
          { $match: { _id: { $in: surveyIds } } },
          { $group: { _id: null, total: { $sum: '$targetResponses' } } },
        ]))[0]?.total || 0
      : 0;

    const completionRate = targetResponses > 0
      ? Math.round((totalResponses / targetResponses) * 100)
      : 0;

    return {
      totalProjects,
      inProgressProjects,
      completedProjects,
      totalSurveys,
      totalBeneficiaries,
      totalResponses,
      completionRate,
      impactScore: 0,
    };
  }
}
