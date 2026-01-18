import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface N8nAnalysisPayload {
  projectInfo: {
    id: string;
    name: string;
    description: string;
    type: string;
    goals?: any;
  };
  surveyData?: {
    preSurvey?: any[];
    postSurvey?: any[];
    responses: any[];
  };
  textData?: string[];
  indicators?: Array<{
    name: string;
    currentValue: number;
    targetValue: number;
    category: string;
  }>;
  language?: string;
  analysisType: 'text_analysis' | 'impact_evaluation' | 'sentiment_analysis' | 'topic_extraction' | 'comprehensive';
}

export interface N8nAnalysisResponse {
  success: boolean;
  data: {
    textAnalysis?: {
      sentiment: string;
      sentimentScore: number;
      confidence: number;
      keywords: string[];
      entities: string[];
      summary?: string;
      emotions?: Record<string, number>;
    };
    topics?: Array<{
      name: string;
      keywords: string[];
      relevance: number;
      sentiment?: string;
    }>;
    impactEvaluation?: {
      overallImpact: number;
      improvements: Array<{
        indicator: string;
        improvement: number;
        significance: string;
      }>;
      analysis: string;
    };
    recommendations?: string[];
    insights?: string[];
  };
  metadata?: {
    processingTime: number;
    model: string;
    timestamp: string;
  };
}

@Injectable()
export class N8nAiService {
  private readonly logger = new Logger(N8nAiService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly webhookUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;

  constructor(private configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>('n8n.webhookUrl') || 'http://localhost:5678/webhook/analyze-impact';
    this.apiKey = this.configService.get<string>('n8n.apiKey') || '';
    this.timeout = this.configService.get<number>('n8n.timeout') || 60000;
    this.retryAttempts = this.configService.get<number>('n8n.retryAttempts') || 3;
    this.retryDelay = this.configService.get<number>('n8n.retryDelay') || 1000;

    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-N8N-API-KEY': this.apiKey }),
      },
    });
  }

  /**
   * Main method to analyze data using n8n webhook
   */
  async analyzeWithAI(payload: N8nAnalysisPayload): Promise<N8nAnalysisResponse> {
    this.logger.log(`Starting AI analysis for project: ${payload.projectInfo.name}`);

    const startTime = Date.now();

    try {
      const response = await this.sendToN8n(payload);

      const processingTime = Date.now() - startTime;
      this.logger.log(`AI analysis completed in ${processingTime}ms`);

      return response;
    } catch (error) {
      this.logger.error(`AI analysis failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'AI analysis failed',
          error: error.message,
          details: error.response?.data,
        },
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Analyze text with sentiment, keywords, and topics
   */
  async analyzeText(
    projectId: string,
    projectName: string,
    texts: string[],
    language: string = 'ar',
  ): Promise<N8nAnalysisResponse> {
    const payload: N8nAnalysisPayload = {
      projectInfo: {
        id: projectId,
        name: projectName,
        description: '',
        type: 'text_analysis',
      },
      textData: texts,
      language,
      analysisType: 'text_analysis',
    };

    return this.analyzeWithAI(payload);
  }

  /**
   * Extract topics from survey responses
   */
  async extractTopics(
    projectId: string,
    projectName: string,
    responses: any[],
    language: string = 'ar',
  ): Promise<N8nAnalysisResponse> {
    const payload: N8nAnalysisPayload = {
      projectInfo: {
        id: projectId,
        name: projectName,
        description: '',
        type: 'topic_extraction',
      },
      surveyData: { responses },
      language,
      analysisType: 'topic_extraction',
    };

    return this.analyzeWithAI(payload);
  }

  /**
   * Evaluate impact by comparing pre/post surveys
   */
  async evaluateImpact(
    projectInfo: any,
    preSurveyData: any[],
    postSurveyData: any[],
    indicators: any[],
    language: string = 'ar',
  ): Promise<N8nAnalysisResponse> {
    const payload: N8nAnalysisPayload = {
      projectInfo,
      surveyData: {
        preSurvey: preSurveyData,
        postSurvey: postSurveyData,
        responses: [],
      },
      indicators,
      language,
      analysisType: 'impact_evaluation',
    };

    return this.analyzeWithAI(payload);
  }

  /**
   * Comprehensive analysis including all aspects
   */
  async comprehensiveAnalysis(payload: N8nAnalysisPayload): Promise<N8nAnalysisResponse> {
    return this.analyzeWithAI({
      ...payload,
      analysisType: 'comprehensive',
    });
  }

  /**
   * Send request to n8n webhook with retry logic
   */
  private async sendToN8n(
    payload: N8nAnalysisPayload,
    attempt: number = 1,
  ): Promise<N8nAnalysisResponse> {
    try {
      this.logger.debug(`Sending request to n8n (attempt ${attempt}/${this.retryAttempts})`);

      const response = await this.axiosInstance.post(this.webhookUrl, payload);

      if (response.data && response.data.success) {
        return response.data;
      }

      throw new Error('Invalid response from n8n webhook');
    } catch (error) {
      if (attempt < this.retryAttempts) {
        this.logger.warn(`Retry attempt ${attempt} failed, retrying...`);
        await this.sleep(this.retryDelay * attempt);
        return this.sendToN8n(payload, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Health check for n8n service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get(this.webhookUrl.replace('/webhook/', '/health'));
      return response.status === 200;
    } catch (error) {
      this.logger.error('n8n health check failed', error);
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
