import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { N8nAiService } from './n8n-ai.service';
import { TextAnalysis, AnalysisStatus } from '../schemas/text-analysis.schema';
import { Topic } from '../schemas/topic.schema';
import { TextTopic } from '../schemas/text-topic.schema';
import { Project } from '@modules/projects/schemas/project.schema';
import { Activity } from '@modules/activities/schemas/activity.schema';
import { Survey } from '@modules/surveys/schemas/survey.schema';
import { SurveySubmission } from '@modules/surveys/schemas/survey-submission.schema';
import { Indicator } from '@modules/indicators/schemas/indicator.schema';
import { UserRole } from '@modules/users/schemas/user.schema';
import type { ComprehensiveAnalysisDto } from '../dto/comprehensive-analysis.dto';

export interface SavedProjectAnalysis {
  totalAnalyses: number;
  analyses: any[];
  topics: any[];
  sentimentDistribution: { positive: number; neutral: number; negative: number };
}

export interface ComprehensiveAnalysisResult {
  textAnalysis?: any;
  topics?: any[];
  impactEvaluation?: any;
  recommendations?: string[];
  insights?: string[];
  metadata?: {
    processingTime: number;
    model: string;
    timestamp: string;
    totalTextResponses: number;
    totalSurveys: number;
    totalIndicators: number;
  };
}

@Injectable()
export class ProjectAnalysisService {
  private readonly logger = new Logger(ProjectAnalysisService.name);

  constructor(
    @InjectModel(TextAnalysis.name) private textAnalysisModel: Model<TextAnalysis>,
    @InjectModel(Topic.name) private topicModel: Model<Topic>,
    @InjectModel(TextTopic.name) private textTopicModel: Model<TextTopic>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectModel(Survey.name) private surveyModel: Model<Survey>,
    @InjectModel(SurveySubmission.name) private submissionModel: Model<SurveySubmission>,
    @InjectModel(Indicator.name) private indicatorModel: Model<Indicator>,
    private readonly n8nAiService: N8nAiService,
  ) {}

  async runComprehensive(
    dto: ComprehensiveAnalysisDto,
    userId?: string,
    userRole?: UserRole,
  ): Promise<ComprehensiveAnalysisResult> {
    if (userRole === UserRole.STAFF && userId) {
      await this.assertProjectOwnership(dto.projectId, userId);
    }

    this.logger.log(`Running comprehensive analysis for project ${dto.projectId}`);

    const projectOid = new Types.ObjectId(dto.projectId);

    // 1. Fetch all text responses for this project from DB
    const activities = await this.activityModel.find({ project: projectOid }).select('_id').lean();
    const activityIds = activities.map((a) => a._id);

    const surveys = await this.surveyModel
      .find({ activity: { $in: activityIds } })
      .select('_id title')
      .lean();
    const surveyIds = surveys.map((s) => s._id);

    const submissions = await this.submissionModel
      .find({ survey: { $in: surveyIds }, textValue: { $exists: true, $ne: '' } })
      .select('textValue survey')
      .lean();

    const textResponses = submissions
      .map((s) => s.textValue?.trim() ?? '')
      .filter((t) => t.length > 10);

    this.logger.log(`Found ${textResponses.length} text responses across ${surveys.length} surveys`);

    // 2. Fetch project indicators via project.indicators array (not a direct field on Indicator)
    const projectDoc = await this.projectModel
      .findById(projectOid)
      .populate<{ indicators: any[] }>('indicators')
      .lean();

    const dbIndicators = (projectDoc?.indicators ?? []).filter(
      (ind: any) => ind && ind.isActive !== false,
    );

    const indicatorsPayload = dbIndicators.map((ind: any) => ({
      name: ind.name,
      currentValue: ind.actualValue ?? 0,
      targetValue: ind.targetValue ?? 0,
      category: ind.indicatorType,
    }));

    // 3. Build n8n payload and call AI
    // Sample up to 10 texts, truncated to 200 chars each — stays within 4096-token CPU context
    const textSample = textResponses
      .slice(0, 10)
      .map((t) => (t.length > 200 ? t.substring(0, 200) + '...' : t));

    const payload = {
      projectInfo: {
        id: dto.projectId,
        name: dto.projectData.name,
        description: '',
        type: 'general',
        status: dto.projectData.status,
        startDate: dto.projectData.startDate,
        endDate: dto.projectData.endDate,
      },
      textData: textSample,
      surveyData: {
        responses: textSample.map((t) => ({ text: t })),
        totalSurveys: surveys.length,
        totalSubmissions: submissions.length,
      },
      indicators: indicatorsPayload,
      language: dto.language ?? 'ar',
      analysisType: 'comprehensive' as const,
    };

    const aiResponse = await this.n8nAiService.comprehensiveAnalysis(payload);

    // 4. Persist TextAnalysis documents (save the sample that was actually analysed)
    let savedAnalyses: TextAnalysis[] = [];
    if (textSample.length > 0 && aiResponse.data.textAnalysis) {
      savedAnalyses = await this.saveTextAnalyses(dto.projectId, textSample, aiResponse);
    }

    // 5. Persist Topics
    if (aiResponse.data.topics?.length) {
      await this.saveTopics(dto.projectId, aiResponse.data.topics, savedAnalyses);
    }

    return {
      textAnalysis: aiResponse.data.textAnalysis,
      topics: aiResponse.data.topics,
      impactEvaluation: aiResponse.data.impactEvaluation,
      recommendations: aiResponse.data.recommendations,
      insights: aiResponse.data.insights,
      metadata: {
        processingTime: aiResponse.metadata?.processingTime ?? 0,
        model: aiResponse.metadata?.model ?? '',
        timestamp: aiResponse.metadata?.timestamp ?? new Date().toISOString(),
        totalTextResponses: textResponses.length,
        totalSurveys: surveys.length,
        totalIndicators: dbIndicators.length,
      },
    };
  }

  async getSavedAnalysis(projectId: string): Promise<SavedProjectAnalysis> {
    const projectOid = new Types.ObjectId(projectId);

    const analyses = await this.textAnalysisModel
      .find({ project: projectOid })
      .sort({ analyzedAt: -1 })
      .exec();

    const topics = await this.topicModel
      .find({ project: projectOid })
      .sort({ frequency: -1 })
      .exec();

    return {
      totalAnalyses: analyses.length,
      analyses: analyses.slice(0, 10),
      topics,
      sentimentDistribution: this.getSentimentDistribution(analyses),
    };
  }

  async getAllAnalysisHistory(userId?: string, userRole?: UserRole): Promise<any[]> {
    let projectFilter: any = {};

    if (userRole === UserRole.STAFF && userId) {
      const ownedProjects = await this.projectModel
        .find({ user_id: userId })
        .select('_id')
        .lean()
        .exec();
      const projectIds = ownedProjects.map((p) => p._id);
      projectFilter = { project: { $in: projectIds } };
    }

    const groups = await this.textAnalysisModel.aggregate([
      { $match: projectFilter },
      {
        $group: {
          _id: '$project',
          totalAnalyses: { $sum: 1 },
          lastAnalyzedAt: { $max: '$analyzedAt' },
          sentiments: { $push: '$sentiment' },
          recentAnalyses: {
            $push: {
              sentiment: '$sentiment',
              summary: '$summary',
              analyzedAt: '$analyzedAt',
              keywords: '$keywords',
            },
          },
        },
      },
      { $sort: { lastAnalyzedAt: -1 } },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'projectInfo',
        },
      },
      { $unwind: { path: '$projectInfo', preserveNullAndEmptyArrays: true } },
    ]);

    return groups.map((g) => {
      const sentimentDist = { positive: 0, neutral: 0, negative: 0 };
      (g.sentiments as string[]).forEach((s) => {
        if (s && s in sentimentDist) sentimentDist[s as keyof typeof sentimentDist]++;
      });

      const sorted = [...g.recentAnalyses].sort(
        (a: any, b: any) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime(),
      );

      return {
        projectId: g._id,
        projectName: g.projectInfo?.name ?? 'مشروع غير معروف',
        projectStatus: g.projectInfo?.status,
        totalAnalyses: g.totalAnalyses,
        lastAnalyzedAt: g.lastAnalyzedAt,
        sentimentDistribution: sentimentDist,
        recentAnalyses: sorted.slice(0, 5),
      };
    });
  }

  private async assertProjectOwnership(projectId: string, userId: string): Promise<void> {
    const project = await this.projectModel.findById(projectId).lean().exec();
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (project.user_id.toString() !== userId) {
      throw new ForbiddenException('You do not have permission on this project');
    }
  }

  private async saveTextAnalyses(
    projectId: string,
    texts: string[],
    aiResponse: any,
  ): Promise<TextAnalysis[]> {
    const analysis = aiResponse.data.textAnalysis;
    const analyses: TextAnalysis[] = [];
    for (const text of texts) {
      const doc = new this.textAnalysisModel({
        project: projectId,
        originalText: text,
        cleanedText: text.trim(),
        sentiment: analysis?.sentiment,
        sentimentScore: analysis?.sentimentScore,
        sentimentConfidence: analysis?.confidence,
        keywords: analysis?.keywords ?? [],
        entities: analysis?.entities ?? [],
        summary: analysis?.summary,
        status: AnalysisStatus.COMPLETED,
        analyzedAt: new Date(),
        n8nResponse: aiResponse.data,
      });
      analyses.push(await doc.save());
    }
    return analyses;
  }

  private async saveTopics(
    projectId: string,
    topicsData: any[],
    analyses: TextAnalysis[],
  ): Promise<Topic[]> {
    const saved: Topic[] = [];
    for (const topicData of topicsData) {
      let topic = await this.topicModel.findOne({ project: projectId, name: topicData.name });
      if (topic) {
        topic.frequency += 1;
        topic.keywords = [...new Set([...topic.keywords, ...(topicData.keywords ?? [])])];
        await topic.save();
      } else {
        topic = await new this.topicModel({
          project: projectId,
          name: topicData.name,
          keywords: topicData.keywords ?? [],
          frequency: 1,
          relevanceScore: topicData.relevance,
          overallSentiment: topicData.sentiment,
        }).save();
      }
      saved.push(topic);
      for (const analysis of analyses) {
        await new this.textTopicModel({
          textAnalysis: analysis._id,
          topic: topic._id,
          relevance: topicData.relevance ?? 0.5,
          confidence: 0.8,
          mentionedKeywords: topicData.keywords ?? [],
          mentionCount: 1,
        }).save();
      }
    }
    return saved;
  }

  private getSentimentDistribution(
    analyses: TextAnalysis[],
  ): { positive: number; neutral: number; negative: number } {
    const dist = { positive: 0, neutral: 0, negative: 0 };
    for (const a of analyses) {
      if (a.sentiment && a.sentiment in dist) {
        dist[a.sentiment as keyof typeof dist]++;
      }
    }
    return dist;
  }
}
