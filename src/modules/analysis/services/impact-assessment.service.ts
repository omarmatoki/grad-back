import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { N8nAiService } from './n8n-ai.service';
import { Project } from '@modules/projects/schemas/project.schema';
import { Activity } from '@modules/activities/schemas/activity.schema';
import { Survey, SurveyType } from '@modules/surveys/schemas/survey.schema';
import { SurveyQuestion, QuestionType } from '@modules/surveys/schemas/survey-question.schema';
import { SurveySubmission } from '@modules/surveys/schemas/survey-submission.schema';
import { Indicator } from '@modules/indicators/schemas/indicator.schema';
import { UserRole } from '@modules/users/schemas/user.schema';
import type { EvaluateImpactDto } from '../dto/evaluate-impact.dto';
import { buildPerformanceSummary, type IndicatorComparison } from '../utils/performance-summary.util';

export interface ImprovementItem {
  metric: string;
  preValue: number;
  postValue: number;
  improvement: number;
  improvementPercentage: number;
}

export interface ImpactAssessmentResult {
  improvements: ImprovementItem[];
  aiEvaluation?: {
    overallImpact: number;
    improvements: Array<{ indicator: string; improvement: number; significance: string }>;
    analysis: string;
  };
  recommendations: string[];
  insights: string[];
}

interface SurveyAverage {
  averageScore: number;
  responses: number;
}

const SCORE_QUESTION_TYPES = [QuestionType.RATING, QuestionType.SCALE];

@Injectable()
export class ImpactAssessmentService {
  private readonly logger = new Logger(ImpactAssessmentService.name);

  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectModel(Survey.name) private surveyModel: Model<Survey>,
    @InjectModel(SurveyQuestion.name) private surveyQuestionModel: Model<SurveyQuestion>,
    @InjectModel(SurveySubmission.name) private submissionModel: Model<SurveySubmission>,
    @InjectModel(Indicator.name) private indicatorModel: Model<Indicator>,
    private readonly n8nAiService: N8nAiService,
  ) {}

  async evaluate(
    dto: EvaluateImpactDto,
    userId?: string,
    userRole?: UserRole,
  ): Promise<ImpactAssessmentResult> {
    if (userRole === UserRole.STAFF && userId) {
      await this.assertProjectOwnership(dto.projectId, userId);
    }

    this.logger.log(`Evaluating impact for project ${dto.projectId}, activity ${dto.activityId ?? 'N/A'}`);

    const projectOid = new Types.ObjectId(dto.projectId);
    const projectDoc = await this.projectModel.findById(projectOid).lean();

    const [{ preSurveyData, postSurveyData }, indicators] = await Promise.all([
      this.fetchSurveyAverages(projectOid, dto.activityId),
      this.fetchIndicators(projectDoc?.indicators as Types.ObjectId[] | undefined),
    ]);

    const projectInfo = {
      id: dto.projectId,
      name: projectDoc?.name ?? 'Impact Evaluation',
      description: `Pre/Post comparison for ${dto.activityId ? `activity ${dto.activityId}` : 'all activities'}`,
      type: 'impact_evaluation',
    };

    const aiResponse = await this.n8nAiService.evaluateImpact(
      projectInfo,
      [preSurveyData],
      [postSurveyData],
      indicators,
      dto.language ?? 'ar',
      buildPerformanceSummary(indicators),
    );

    return {
      improvements: this.calculateImprovements(indicators),
      aiEvaluation: aiResponse.data.impactEvaluation,
      recommendations: aiResponse.data.recommendations ?? [],
      insights: aiResponse.data.insights ?? [],
    };
  }

  private async assertProjectOwnership(projectId: string, userId: string): Promise<void> {
    const project = await this.projectModel.findById(projectId).lean().exec();
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (project.user_id.toString() !== userId) {
      throw new ForbiddenException('You do not have permission on this project');
    }
  }

  // Auto-fetches pre/post survey score averages from the database — mirrors
  // ProjectAnalysisService's approach so impact evaluation reflects real data
  // instead of relying on the frontend to assemble it.
  private async fetchSurveyAverages(
    projectOid: Types.ObjectId,
    activityId?: string,
  ): Promise<{ preSurveyData: SurveyAverage; postSurveyData: SurveyAverage }> {
    const activityFilter: Record<string, unknown> = { project: projectOid };
    if (activityId) activityFilter._id = new Types.ObjectId(activityId);

    const activities = await this.activityModel.find(activityFilter).select('_id').lean();
    const activityIds = activities.map((a) => a._id);

    const surveys = await this.surveyModel
      .find({ activity: { $in: activityIds } })
      .select('_id type')
      .lean();

    const postSurveyIds = surveys
      .filter((s: any) => s.type === SurveyType.POST_EVALUATION)
      .map((s) => s._id);
    const preSurveyIds = surveys
      .filter((s: any) => s.type !== SurveyType.POST_EVALUATION)
      .map((s) => s._id);

    const scoreQuestions = await this.surveyQuestionModel
      .find({ survey: { $in: surveys.map((s) => s._id) }, type: { $in: SCORE_QUESTION_TYPES } })
      .select('_id')
      .lean();
    const scoreQuestionIds = scoreQuestions.map((q) => q._id);

    const [postSubmissions, preSubmissions] = await Promise.all([
      this.submissionModel
        .find({ survey: { $in: postSurveyIds }, question: { $in: scoreQuestionIds }, numberValue: { $exists: true } })
        .select('numberValue')
        .lean(),
      this.submissionModel
        .find({ survey: { $in: preSurveyIds }, question: { $in: scoreQuestionIds }, numberValue: { $exists: true } })
        .select('numberValue')
        .lean(),
    ]);

    const average = (subs: Array<{ numberValue?: number }>) =>
      subs.length > 0 ? subs.reduce((sum, s) => sum + (s.numberValue ?? 0), 0) / subs.length : 0;

    this.logger.log(
      `Survey averages: pre=${preSubmissions.length} responses, post=${postSubmissions.length} responses`,
    );

    return {
      preSurveyData: { averageScore: average(preSubmissions), responses: preSubmissions.length },
      postSurveyData: { averageScore: average(postSubmissions), responses: postSubmissions.length },
    };
  }

  private async fetchIndicators(indicatorIds?: Types.ObjectId[]): Promise<IndicatorComparison[]> {
    if (!indicatorIds?.length) return [];

    const fetched = await this.indicatorModel
      .find({ _id: { $in: indicatorIds }, isActive: { $ne: false } })
      .lean();

    return fetched
      .filter((ind: any) => typeof ind.targetValue === 'number' && ind.targetValue > 0)
      .map((ind: any) => ({ name: ind.name, target: ind.targetValue, actual: ind.actualValue ?? 0 }));
  }

  private calculateImprovements(indicators: IndicatorComparison[]): ImprovementItem[] {
    const results: ImprovementItem[] = [];

    for (const ind of indicators) {
      const improvement = ind.actual - ind.target;
      results.push({
        metric: ind.name,
        preValue: ind.target,
        postValue: ind.actual,
        improvement,
        improvementPercentage: ind.target > 0 ? Math.round((improvement / ind.target) * 10000) / 100 : 0,
      });
    }

    return results;
  }
}
