import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { N8nAiService } from './n8n-ai.service';
import { TextAnalysis, AnalysisStatus, SentimentType } from '../schemas/text-analysis.schema';
import { Topic } from '../schemas/topic.schema';
import { TextTopic } from '../schemas/text-topic.schema';
import { Project } from '@modules/projects/schemas/project.schema';
import { Activity } from '@modules/activities/schemas/activity.schema';
import { Survey } from '@modules/surveys/schemas/survey.schema';
import { SurveySubmission } from '@modules/surveys/schemas/survey-submission.schema';
import { Indicator } from '@modules/indicators/schemas/indicator.schema';
import { UserRole } from '@modules/users/schemas/user.schema';
import type { AnalyzeSurveyResponsesDto } from '../dto/analyze-survey-responses.dto';
import { buildPerformanceSummary, type IndicatorComparison } from '../utils/performance-summary.util';

export interface ActivityAnalysisResult {
  analyzedResponses: number;
  overallSentiment: { overall: string; score: number };
  topics: Array<{ name: string; keywords: string[]; relevance: number; sentiment?: string }>;
  insights: string[];
}

@Injectable()
export class ActivityAnalysisService {
  private readonly logger = new Logger(ActivityAnalysisService.name);

  constructor(
    @InjectModel(TextAnalysis.name)    private textAnalysisModel:    Model<TextAnalysis>,
    @InjectModel(Topic.name)           private topicModel:            Model<Topic>,
    @InjectModel(TextTopic.name)       private textTopicModel:        Model<TextTopic>,
    @InjectModel(Project.name)         private projectModel:          Model<Project>,
    @InjectModel(Activity.name)        private activityModel:         Model<Activity>,
    @InjectModel(Survey.name)          private surveyModel:           Model<Survey>,
    @InjectModel(SurveySubmission.name) private submissionModel:      Model<SurveySubmission>,
    @InjectModel(Indicator.name)        private indicatorModel:       Model<Indicator>,
    private readonly n8nAiService: N8nAiService,
  ) {}

  async analyze(
    dto: AnalyzeSurveyResponsesDto,
    userId?: string,
    userRole?: UserRole,
  ): Promise<ActivityAnalysisResult> {
    if (userRole === UserRole.STAFF && userId) {
      await this.assertProjectOwnership(dto.projectId, userId);
    }

    // Prefer manually supplied responses; otherwise auto-fetch from DB
    let textResponses = this.extractTextResponses(dto.responses ?? []);
    if (textResponses.length === 0) {
      textResponses = await this.fetchTextFromDb(dto.projectId, dto.activityId);
    }

    if (textResponses.length === 0) {
      throw new BadRequestException(
        'لا توجد بيانات نصية كافية لتحليل هذا المشروع. يرجى التأكد من وجود إجابات مسجّلة في الاستبيانات.',
      );
    }

    this.logger.log(`Analyzing ${textResponses.length} responses for project ${dto.projectId}`);

    // Anchor projectScore to the project's real KPI achievement — without this the LLM
    // scores the text in isolation and can call a genuinely bad project "positive".
    const indicators = await this.fetchIndicators(dto.projectId);
    const performanceSummary = buildPerformanceSummary(indicators);

    const aiResponse = await this.n8nAiService.analyzeText(
      dto.projectId,
      `Project ${dto.projectId}`,
      textResponses,
      dto.language ?? 'ar',
      undefined,
      performanceSummary,
    );

    const savedAnalyses = await this.saveTextAnalyses(dto.projectId, textResponses, aiResponse, dto.activityId);

    if (aiResponse.data.topics?.length) {
      await this.saveTopics(dto.projectId, aiResponse.data.topics, savedAnalyses);
    }

    return {
      analyzedResponses: savedAnalyses.length,
      overallSentiment: this.calculateOverallSentiment(savedAnalyses),
      topics: aiResponse.data.topics ?? [],
      insights: aiResponse.data.insights ?? [],
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async fetchIndicators(projectId: string): Promise<IndicatorComparison[]> {
    const projectDoc = await this.projectModel.findById(projectId).select('indicators').lean();
    const indicatorIds = (projectDoc?.indicators ?? []) as Types.ObjectId[];
    if (!indicatorIds.length) return [];

    const fetched = await this.indicatorModel
      .find({ _id: { $in: indicatorIds }, isActive: { $ne: false } })
      .lean();

    return fetched
      .filter((ind: any) => typeof ind.targetValue === 'number' && ind.targetValue > 0)
      .map((ind: any) => ({ name: ind.name, target: ind.targetValue, actual: ind.actualValue ?? 0 }));
  }

  /** Fetch text answers from SurveySubmissions linked to this project (optionally scoped to one activity) */
  private async fetchTextFromDb(projectId: string, activityId?: string): Promise<string[]> {
    try {
      // 1. Resolve activity IDs in scope
      let activityIds: Types.ObjectId[];
      if (activityId) {
        activityIds = [new Types.ObjectId(activityId)];
      } else {
        const activities = await this.activityModel
          .find({ project: new Types.ObjectId(projectId) }, '_id')
          .lean()
          .exec();
        activityIds = activities.map((a) => a._id as Types.ObjectId);
      }

      if (!activityIds.length) return [];

      // 2. Find surveys for those activities
      const surveys = await this.surveyModel
        .find({ activity: { $in: activityIds } }, '_id')
        .lean()
        .exec();
      const surveyIds = surveys.map((s) => s._id);

      if (!surveyIds.length) return [];

      // 3. Fetch text submissions
      const submissions = await this.submissionModel
        .find(
          { survey: { $in: surveyIds }, textValue: { $exists: true, $ne: '' } },
          'textValue',
        )
        .limit(200)
        .lean()
        .exec();

      return submissions
        .map((s) => (s.textValue ?? '').trim())
        .filter((t) => t.length >= 10);
    } catch {
      return [];
    }
  }

  private assertProjectOwnership = async (projectId: string, userId: string): Promise<void> => {
    const project = await this.projectModel.findById(projectId).lean().exec();
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (project.user_id.toString() !== userId) {
      throw new ForbiddenException('You do not have permission on this project');
    }
  };

  private extractTextResponses(responses: any[]): string[] {
    const texts: string[] = [];
    for (const r of responses) {
      if (r.answers?.length) {
        for (const a of r.answers) {
          if (typeof a.textValue === 'string' && a.textValue.trim().length > 10) {
            texts.push(a.textValue.trim());
          }
        }
      }
      if (typeof r.answer === 'string' && r.answer.trim().length > 10) texts.push(r.answer.trim());
      if (typeof r.text  === 'string' && r.text.trim().length  > 10) texts.push(r.text.trim());
    }
    return texts;
  }

  private async saveTextAnalyses(
    projectId: string,
    texts: string[],
    aiResponse: any,
    activityId?: string,
  ): Promise<TextAnalysis[]> {
    const analysis = aiResponse.data.textAnalysis;
    // n8n no longer returns sentiment/sentimentScore directly — it returns a single
    // projectScore (0-100) reflecting text quality. Derive sentiment from that instead
    // (same mapping as ProjectAnalysisService), otherwise these fields stay undefined
    // and overall sentiment always reads as "neutral" regardless of actual quality.
    const score = aiResponse.data.projectScore ?? 50;
    const derivedSentiment = score >= 60 ? SentimentType.POSITIVE : score >= 35 ? SentimentType.NEUTRAL : SentimentType.NEGATIVE;
    const derivedSentimentScore = (score - 50) / 50; // map 0-100 → -1 to +1

    const runId = randomUUID();
    const analyzedAt = new Date();
    const analyses: TextAnalysis[] = [];
    for (const text of texts) {
      const doc = new this.textAnalysisModel({
        project: projectId,
        originalText: text,
        cleanedText: text.trim(),
        sentiment: derivedSentiment,
        sentimentScore: derivedSentimentScore,
        sentimentConfidence: 0.8,
        keywords: analysis?.keywords ?? [],
        entities: analysis?.entities ?? [],
        summary: analysis?.summary,
        status: AnalysisStatus.COMPLETED,
        analyzedAt,
        n8nResponse: aiResponse.data,
        runId,
        analysisType: 'activity',
      });
      analyses.push(await doc.save());
    }
    return analyses;
  }

  private async saveTopics(projectId: string, topicsData: any[], analyses: TextAnalysis[]): Promise<Topic[]> {
    const saved: Topic[] = [];
    for (const topicData of topicsData) {
      let topic = await this.topicModel.findOne({ project: projectId, name: topicData.name });
      if (topic) {
        topic.frequency += 1;
        topic.keywords = [...new Set([...topic.keywords, ...topicData.keywords])];
        await topic.save();
      } else {
        topic = await new this.topicModel({
          project: projectId,
          name: topicData.name,
          keywords: topicData.keywords,
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
          mentionedKeywords: topicData.keywords,
          mentionCount: 1,
        }).save();
      }
    }
    return saved;
  }

  private calculateOverallSentiment(analyses: TextAnalysis[]): { overall: string; score: number } {
    if (!analyses.length) return { overall: 'neutral', score: 0 };
    const avg = analyses.reduce((s, a) => s + (a.sentimentScore ?? 0), 0) / analyses.length;
    return {
      overall: avg > 0.2 ? 'positive' : avg < -0.2 ? 'negative' : 'neutral',
      score: avg,
    };
  }
}
