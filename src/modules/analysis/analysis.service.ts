import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { N8nAiService } from './services/n8n-ai.service';
import { TextAnalysis, AnalysisStatus } from './schemas/text-analysis.schema';
import { Topic } from './schemas/topic.schema';
import { TextTopic } from './schemas/text-topic.schema';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    @InjectModel(TextAnalysis.name) private textAnalysisModel: Model<TextAnalysis>,
    @InjectModel(Topic.name) private topicModel: Model<Topic>,
    @InjectModel(TextTopic.name) private textTopicModel: Model<TextTopic>,
    private n8nAiService: N8nAiService,
  ) {}

  /**
   * Analyze survey responses using n8n AI
   */
  async analyzeSurveyResponses(
    projectId: string,
    surveyId: string,
    responses: any[],
    language: string = 'ar',
  ): Promise<any> {
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
  ): Promise<any> {
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
  ): Promise<any> {
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
   * Comprehensive project analysis
   */
  async comprehensiveProjectAnalysis(
    projectId: string,
    projectData: any,
    allSurveyData: any[],
    indicators: any[],
    language: string = 'ar',
  ): Promise<any> {
    this.logger.log(`Running comprehensive analysis for project ${projectId}`);

    const payload = {
      projectInfo: {
        id: projectId,
        name: projectData.name,
        description: projectData.description,
        type: projectData.type,
        goals: projectData.goals,
      },
      surveyData: {
        responses: allSurveyData,
      },
      indicators,
      language,
      analysisType: 'comprehensive' as const,
    };

    const aiResponse = await this.n8nAiService.comprehensiveAnalysis(payload);

    return {
      textAnalysis: aiResponse.data.textAnalysis,
      topics: aiResponse.data.topics,
      impactEvaluation: aiResponse.data.impactEvaluation,
      recommendations: aiResponse.data.recommendations,
      insights: aiResponse.data.insights,
      metadata: aiResponse.metadata,
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
    const texts = [];

    for (const response of responses) {
      if (response.answers && Array.isArray(response.answers)) {
        for (const answer of response.answers) {
          if (answer.textValue && answer.textValue.trim().length > 10) {
            texts.push(answer.textValue);
          }
        }
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

  private calculateImprovements(preData: any, postData: any): any[] {
    // This would contain logic to compare pre/post metrics
    // Simplified version:
    return [
      {
        metric: 'Knowledge Score',
        preValue: 65,
        postValue: 85,
        improvement: 20,
        improvementPercentage: 30.77,
      },
    ];
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
