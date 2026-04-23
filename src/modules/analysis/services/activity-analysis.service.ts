import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { N8nAiService } from './n8n-ai.service';
import { TextAnalysis, AnalysisStatus } from '../schemas/text-analysis.schema';
import { Topic } from '../schemas/topic.schema';
import { TextTopic } from '../schemas/text-topic.schema';
import { Project } from '@modules/projects/schemas/project.schema';
import { UserRole } from '@modules/users/schemas/user.schema';
import type { AnalyzeSurveyResponsesDto } from '../dto/analyze-survey-responses.dto';

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
    @InjectModel(TextAnalysis.name) private textAnalysisModel: Model<TextAnalysis>,
    @InjectModel(Topic.name) private topicModel: Model<Topic>,
    @InjectModel(TextTopic.name) private textTopicModel: Model<TextTopic>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
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

    const textResponses = this.extractTextResponses(dto.responses);

    if (textResponses.length === 0) {
      return {
        analyzedResponses: 0,
        overallSentiment: { overall: 'neutral', score: 0 },
        topics: [],
        insights: [],
      };
    }

    this.logger.log(`Analyzing ${textResponses.length} survey responses for project ${dto.projectId}`);

    const aiResponse = await this.n8nAiService.analyzeText(
      dto.projectId,
      `Survey ${dto.surveyId}`,
      textResponses,
      dto.language ?? 'ar',
    );

    const savedAnalyses = await this.saveTextAnalyses(dto.projectId, textResponses, aiResponse, dto.surveyId);

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

  private async assertProjectOwnership(projectId: string, userId: string): Promise<void> {
    const project = await this.projectModel.findById(projectId).lean().exec();
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (project.user_id.toString() !== userId) {
      throw new ForbiddenException('You do not have permission on this project');
    }
  }

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
      if (typeof r.text === 'string' && r.text.trim().length > 10) texts.push(r.text.trim());
    }
    return texts;
  }

  private async saveTextAnalyses(
    projectId: string,
    texts: string[],
    aiResponse: any,
    surveyId?: string,
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
