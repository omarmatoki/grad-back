import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { N8nAiService } from './n8n-ai.service';
import { Project } from '@modules/projects/schemas/project.schema';
import { UserRole } from '@modules/users/schemas/user.schema';
import type { EvaluateImpactDto } from '../dto/evaluate-impact.dto';

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

@Injectable()
export class ImpactAssessmentService {
  private readonly logger = new Logger(ImpactAssessmentService.name);

  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
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

    const projectInfo = {
      id: dto.projectId,
      name: 'Impact Evaluation',
      description: `Pre/Post comparison for activity ${dto.activityId ?? 'unknown'}`,
      type: 'impact_evaluation',
    };

    const aiResponse = await this.n8nAiService.evaluateImpact(
      projectInfo,
      [dto.preSurveyData],
      [dto.postSurveyData],
      dto.indicators,
      dto.language ?? 'ar',
    );

    return {
      improvements: this.calculateImprovements(dto.preSurveyData, dto.postSurveyData, dto.indicators),
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

  private calculateImprovements(
    preData: { averageScore: number; responses: number },
    postData: { averageScore: number; responses: number },
    indicators: Array<{ name: string; target: number; actual: number }>,
  ): ImprovementItem[] {
    const results: ImprovementItem[] = [];

    // Score-based improvement (pre vs post)
    const preScore = preData.averageScore ?? 0;
    const postScore = postData.averageScore ?? 0;

    if (preScore > 0 || postScore > 0) {
      const improvement = postScore - preScore;
      results.push({
        metric: 'Average Survey Score',
        preValue: preScore,
        postValue: postScore,
        improvement,
        improvementPercentage: preScore > 0 ? Math.round((improvement / preScore) * 10000) / 100 : 0,
      });
    }

    // Indicator-based improvements
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
