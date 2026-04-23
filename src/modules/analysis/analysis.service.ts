/**
 * @deprecated Replaced by 4 focused services in ./services/
 *   - ActivityAnalysisService   (survey response analysis)
 *   - ImpactAssessmentService   (pre/post impact evaluation)
 *   - TopicExtractionService    (topic modelling)
 *   - ProjectAnalysisService    (comprehensive project analysis + saved data)
 * This file is no longer registered in analysis.module.ts and can be deleted.
 */
import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { N8nAiService } from './services/n8n-ai.service';
import { TextAnalysis, AnalysisStatus } from './schemas/text-analysis.schema';
import { Topic } from './schemas/topic.schema';
import { TextTopic } from './schemas/text-topic.schema';
import { Project } from '@modules/projects/schemas/project.schema';
import { Activity } from '@modules/activities/schemas/activity.schema';
import { Survey } from '@modules/surveys/schemas/survey.schema';
import { SurveySubmission } from '@modules/surveys/schemas/survey-submission.schema';
import { Indicator } from '@modules/indicators/schemas/indicator.schema';
import { UserRole } from '@modules/users/schemas/user.schema';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    @InjectModel(TextAnalysis.name) private textAnalysisModel: Model<TextAnalysis>,
    @InjectModel(Topic.name) private topicModel: Model<Topic>,
    @InjectModel(TextTopic.name) private textTopicModel: Model<TextTopic>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectModel(Survey.name) private surveyModel: Model<Survey>,
    @InjectModel(SurveySubmission.name) private submissionModel: Model<SurveySubmission>,
    @InjectModel(Indicator.name) private indicatorModel: Model<Indicator>,
    private n8nAiService: N8nAiService,
  ) {}

  private async assertProjectOwnership(projectId: string, userId: string): Promise<void> {
    const project = await this.projectModel.findById(projectId).lean().exec();
    if (!project) throw new NotFoundException(`Project with ID ${projectId} not found`);
    if (project.user_id.toString() !== userId) {
      throw new ForbiddenException('You do not have permission on this project');
    }
  }

  /**
   * Analyze survey responses using n8n AI
   */
  async analyzeSurveyResponses(
    projectId: string,
    surveyId: string,
    responses: any[],
    language: string = 'ar',
    userId?: string,
    userRole?: UserRole,
  ): Promise<any> {
    if (userRole === UserRole.STAFF && userId) {
      await this.assertProjectOwnership(projectId, userId);
    }
    this.logger.log(`Analyzing ${responses.length} survey responses for project ${projectId}`);

    const textResponses = this.extractTextResponses(responses);

    if (textResponses.length === 0) {
      return { message: 'No text responses to analyze' };
    }

    // Send to n8n for AI analysis
    const aiResponse = await this.n8nAiService.analyzeText(
      projectId,
      `Survey ${surveyId}`,
      textResponses,
      language,
    );

    // Save analysis results
    const savedAnalyses = await this.saveTextAnalyses(
      projectId,
      textResponses,
      aiResponse,
      surveyId,
    );

    // Extract and save topics
    if (aiResponse.data.topics && aiResponse.data.topics.length > 0) {
      await this.saveTopics(projectId, aiResponse.data.topics, savedAnalyses);
    }

    return {
      analyzedResponses: savedAnalyses.length,
      topics: aiResponse.data.topics,
      overallSentiment: this.calculateOverallSentiment(savedAnalyses),
      insights: aiResponse.data.insights,
    };
  }

  /**
   * Evaluate impact by comparing pre/post surveys
   */
  async evaluateImpact(
    projectId: string,
    activityId: string,
    preSurveyData: any,
    postSurveyData: any,
    indicators: any[],
    language: string = 'ar',
    userId?: string,
    userRole?: UserRole,
  ): Promise<any> {
    if (userRole === UserRole.STAFF && userId) {
      await this.assertProjectOwnership(projectId, userId);
    }
    this.logger.log(`Evaluating impact for activity ${activityId}`);

    const projectInfo = {
      id: projectId,
      name: 'Impact Evaluation',
      description: `Pre/Post comparison for activity ${activityId}`,
      type: 'impact_evaluation',
    };

    // Send to n8n for comprehensive impact analysis
    const aiResponse = await this.n8nAiService.evaluateImpact(
      projectInfo,
      preSurveyData,
      postSurveyData,
      indicators,
      language,
    );

    // Calculate improvement metrics
    const improvements = this.calculateImprovements(preSurveyData, postSurveyData);

    return {
      improvements,
      aiEvaluation: aiResponse.data.impactEvaluation,
      recommendations: aiResponse.data.recommendations,
      insights: aiResponse.data.insights,
    };
  }

  /**
   * Extract topics from needs assessment
   */
  async extractNeedsTopics(
    projectId: string,
    projectName: string,
    responses: any[],
    language: string = 'ar',
    userId?: string,
    userRole?: UserRole,
  ): Promise<any> {
    if (userRole === UserRole.STAFF && userId) {
      await this.assertProjectOwnership(projectId, userId);
    }
    this.logger.log(`Extracting needs topics for project ${projectId}`);

    const aiResponse = await this.n8nAiService.extractTopics(
      projectId,
      projectName,
      responses,
      language,
    );

    // Save topics
    const savedTopics = await this.saveTopics(
      projectId,
      aiResponse.data.topics || [],
      [],
    );

    return {
      topics: savedTopics,
      totalTopics: savedTopics.length,
      insights: aiResponse.data.insights,
    };
  }

  /**
   * Comprehensive project analysis — fetches its own data from DB
   */
  async comprehensiveProjectAnalysis(
    projectId: string,
    projectData: any,
    _allSurveyData: any[],
    _indicators: any[],
    language: string = 'ar',
    userId?: string,
    userRole?: UserRole,
  ): Promise<any> {
    if (userRole === UserRole.STAFF && userId) {
      await this.assertProjectOwnership(projectId, userId);
    }
    this.logger.log(`Running comprehensive analysis for project ${projectId}`);

    // ── 1. Fetch all text responses for this project from DB ──────────────────
    const activities = await this.activityModel
      .find({ project: projectId })
      .select('_id')
      .lean();
    const activityIds = activities.map((a) => a._id);

    const surveys = await this.surveyModel
      .find({ activity: { $in: activityIds } })
      .select('_id title')
      .lean();
    const surveyIds = surveys.map((s) => s._id);

    const submissions = await this.submissionModel
      .find({
        survey: { $in: surveyIds },
        textValue: { $exists: true, $ne: '' },
      })
      .select('textValue survey')
      .lean();

    const textResponses: string[] = submissions
      .map((s) => s.textValue?.trim() ?? '')
      .filter((t) => t.length > 10);

    this.logger.log(
      `Found ${textResponses.length} text responses across ${surveys.length} surveys for project ${projectId}`,
    );

    // ── 2. Fetch indicators for this project from DB ──────────────────────────
    const dbIndicators = await this.indicatorModel
      .find({ project: projectId, isActive: true })
      .lean();

    const indicatorsPayload = dbIndicators.map((ind) => ({
      name: ind.name,
      currentValue: ind.actualValue ?? 0,
      targetValue: ind.targetValue ?? 0,
      category: ind.indicatorType,
    }));

    // ── 3. Build N8N payload ──────────────────────────────────────────────────
    const payload = {
      projectInfo: {
        id: projectId,
        name: projectData.name,
        description: projectData.description || '',
        type: projectData.type || 'general',
        goals: projectData.goals,
        status: projectData.status,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
      },
      textData: textResponses,
      surveyData: {
        responses: textResponses.map((t) => ({ text: t })),
        totalSurveys: surveys.length,
        totalSubmissions: submissions.length,
      },
      indicators: indicatorsPayload,
      language,
      analysisType: 'comprehensive' as const,
    };

    const aiResponse = await this.n8nAiService.comprehensiveAnalysis(payload);

    // ── 4. Save TextAnalysis documents to DB ──────────────────────────────────
    let savedAnalyses: TextAnalysis[] = [];
    if (textResponses.length > 0 && aiResponse.data.textAnalysis) {
      savedAnalyses = await this.saveTextAnalyses(projectId, textResponses, aiResponse);
    }

    // ── 5. Save Topics to DB ──────────────────────────────────────────────────
    if (aiResponse.data.topics && aiResponse.data.topics.length > 0) {
      await this.saveTopics(projectId, aiResponse.data.topics, savedAnalyses);
    }

    return {
      textAnalysis: aiResponse.data.textAnalysis,
      topics: aiResponse.data.topics,
      impactEvaluation: aiResponse.data.impactEvaluation,
      recommendations: aiResponse.data.recommendations,
      insights: aiResponse.data.insights,
      metadata: {
        ...aiResponse.metadata,
        totalTextResponses: textResponses.length,
        totalSurveys: surveys.length,
        totalIndicators: dbIndicators.length,
      },
    };
  }

  /**
   * Get analysis by project
   */
  async getProjectAnalysis(projectId: string): Promise<any> {
    const analyses = await this.textAnalysisModel
      .find({ project: projectId })
      .sort({ analyzedAt: -1 })
      .exec();

    const topics = await this.topicModel
      .find({ project: projectId })
      .sort({ frequency: -1 })
      .exec();

    return {
      totalAnalyses: analyses.length,
      analyses: analyses.slice(0, 10), // Latest 10
      topics,
      sentimentDistribution: this.getSentimentDistribution(analyses),
    };
  }

  /**
   * Private helper methods
   */
  private extractTextResponses(responses: any[]): string[] {
    const texts: string[] = [];

    for (const response of responses) {
      // Format 1 — actual DB SurveySubmission objects grouped by session: { answers: [{ textValue }] }
      if (response.answers && Array.isArray(response.answers)) {
        for (const answer of response.answers) {
          if (answer.textValue && typeof answer.textValue === 'string' && answer.textValue.trim().length > 10) {
            texts.push(answer.textValue.trim());
          }
        }
      }
      // Format 2 — frontend simplified: { question, answer }
      if (response.answer && typeof response.answer === 'string' && response.answer.trim().length > 10) {
        texts.push(response.answer.trim());
      }
      // Format 3 — needs-topics format: { text }
      if (response.text && typeof response.text === 'string' && response.text.trim().length > 10) {
        texts.push(response.text.trim());
      }
    }

    return texts;
  }

  private async saveTextAnalyses(
    projectId: string,
    texts: string[],
    aiResponse: any,
    surveyId?: string,
  ): Promise<TextAnalysis[]> {
    const analyses = [];

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const analysis = aiResponse.data.textAnalysis;

      const textAnalysis = new this.textAnalysisModel({
        project: projectId,
        originalText: text,
        cleanedText: text.trim(),
        sentiment: analysis?.sentiment,
        sentimentScore: analysis?.sentimentScore,
        sentimentConfidence: analysis?.confidence,
        keywords: analysis?.keywords || [],
        entities: analysis?.entities || [],
        summary: analysis?.summary,
        status: AnalysisStatus.COMPLETED,
        analyzedAt: new Date(),
        n8nResponse: aiResponse.data,
      });

      analyses.push(await textAnalysis.save());
    }

    return analyses;
  }

  private async saveTopics(
    projectId: string,
    topicsData: any[],
    analyses: TextAnalysis[],
  ): Promise<Topic[]> {
    const savedTopics = [];

    for (const topicData of topicsData) {
      // Check if topic already exists
      let topic = await this.topicModel.findOne({
        project: projectId,
        name: topicData.name,
      });

      if (topic) {
        // Update existing topic
        topic.frequency += 1;
        topic.keywords = [...new Set([...topic.keywords, ...topicData.keywords])];
        await topic.save();
      } else {
        // Create new topic
        topic = new this.topicModel({
          project: projectId,
          name: topicData.name,
          keywords: topicData.keywords,
          frequency: 1,
          relevanceScore: topicData.relevance,
          overallSentiment: topicData.sentiment,
        });
        await topic.save();
      }

      savedTopics.push(topic);

      // Link topic to text analyses
      for (const analysis of analyses) {
        const textTopic = new this.textTopicModel({
          textAnalysis: analysis._id,
          topic: topic._id,
          relevance: topicData.relevance || 0.5,
          confidence: 0.8,
          mentionedKeywords: topicData.keywords,
          mentionCount: 1,
        });

        await textTopic.save();
      }
    }

    return savedTopics;
  }

  private calculateOverallSentiment(analyses: TextAnalysis[]): any {
    if (analyses.length === 0) return { overall: 'neutral', score: 0 };

    const avgScore = analyses.reduce((sum, a) => sum + (a.sentimentScore || 0), 0) / analyses.length;

    let overall: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (avgScore > 0.2) overall = 'positive';
    else if (avgScore < -0.2) overall = 'negative';

    return { overall, score: avgScore };
  }

  private calculateImprovements(preData: any[], postData: any[]): any[] {
    if (!preData?.length || !postData?.length) return [];

    const results: any[] = [];

    for (let i = 0; i < Math.min(preData.length, postData.length); i++) {
      const pre = preData[i];
      const post = postData[i];
      const preScore = pre?.averageScore ?? pre?.score ?? 0;
      const postScore = post?.averageScore ?? post?.score ?? 0;

      if (preScore === 0 && postScore === 0) continue;

      const improvement = postScore - preScore;
      const improvementPercentage = preScore > 0
        ? Math.round((improvement / preScore) * 10000) / 100
        : 0;

      results.push({
        metric: pre?.name || `Indicator ${i + 1}`,
        preValue: preScore,
        postValue: postScore,
        improvement,
        improvementPercentage,
      });
    }

    return results;
  }

  private getSentimentDistribution(analyses: TextAnalysis[]): any {
    const distribution = { positive: 0, neutral: 0, negative: 0 };

    analyses.forEach(a => {
      if (a.sentiment && a.sentiment in distribution) {
        distribution[a.sentiment as keyof typeof distribution]++;
      }
    });

    return distribution;
  }
}
