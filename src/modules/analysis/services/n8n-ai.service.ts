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
      this.logger.error(`AI analysis failed: ${error.message}`);
      throw new HttpException(
        {
          message: 'AI analysis failed',
          cause: error.message,                     // full human-readable reason
          code: error.code || null,                 // e.g. ECONNREFUSED
          webhookUrl: this.webhookUrl,              // which URL was called
          responseStatus: error.responseStatus || null,
          responseBody: error.responseBody || null,
          hint: this.buildHint(error),
        },
        HttpStatus.BAD_GATEWAY,
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
      this.logger.debug(`Sending to n8n (attempt ${attempt}/${this.retryAttempts}): ${this.webhookUrl}`);

      const response = await this.axiosInstance.post(this.webhookUrl, payload);

      this.logger.debug(`n8n responded with status ${response.status}, data: ${JSON.stringify(response.data).slice(0, 200)}`);

      if (response.data && response.data.success) {
        return response.data;
      }

      // n8n responded but success:false — data was insufficient for the AI
      const cause =
        response.data?.metadata?.error ||
        'البيانات المتوفرة غير كافية لإجراء التحليل. يرجى التأكد من وجود بيانات استبيانات مسجّلة لهذا المشروع.';
      throw Object.assign(new Error(cause), { responseBody: response.data, responseStatus: response.status });
    } catch (error) {
      const isNetworkError = !error.response;
      const code = error.code || '';
      const status = error.response?.status;
      const body = error.response?.data;

      this.logger.error(
        `n8n request failed (attempt ${attempt}): [${code || status || 'NETWORK'}] ${error.message}`,
        body ? `Response body: ${JSON.stringify(body).slice(0, 300)}` : '',
      );

      if (attempt < this.retryAttempts && isNetworkError) {
        // Only retry on network errors, not on bad responses
        this.logger.warn(`Retrying in ${this.retryDelay * attempt}ms...`);
        await this.sleep(this.retryDelay * attempt);
        return this.sendToN8n(payload, attempt + 1);
      }

      // Re-throw with full context so analyzeWithAI can surface it
      const detailed = new Error(
        isNetworkError
          ? `Cannot reach n8n at ${this.webhookUrl} — ${error.code || error.message}`
          : `n8n returned HTTP ${status}: ${JSON.stringify(body).slice(0, 200)}`,
      ) as any;
      detailed.originalMessage = error.message;
      detailed.code = code;
      detailed.responseStatus = status;
      detailed.responseBody = body;
      throw detailed;
    }
  }

  /**
   * Full diagnostics — call GET /analysis/health to use this
   */
  async diagnose(): Promise<Record<string, any>> {
    const result: Record<string, any> = {
      webhookUrl: this.webhookUrl,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
    };

    // 1. Test basic TCP reach (n8n base URL)
    const baseUrl = this.webhookUrl.replace(/\/webhook.*/, '');
    try {
      const r = await this.axiosInstance.get(`${baseUrl}/healthz`, { timeout: 5000 });
      result.n8nReachable = true;
      result.n8nStatus = r.status;
    } catch (e) {
      result.n8nReachable = false;
      result.n8nError = e.code || e.message;
    }

    // 2. Test webhook with minimal payload
    try {
      const probe = await this.axiosInstance.post(
        this.webhookUrl,
        {
          analysisType: 'text_analysis',
          projectInfo: { id: 'health-check', name: 'health-check', description: '', type: 'test' },
          textData: ['اختبار الاتصال'],
          language: 'ar',
        },
        { timeout: 90000 },
      );
      result.webhookReachable = true;
      result.webhookResponseSuccess = probe.data?.success === true;
      result.webhookResponseSample = JSON.stringify(probe.data).slice(0, 400);
    } catch (e) {
      result.webhookReachable = false;
      result.webhookError = e.code || e.message;
      result.webhookResponseBody = e.response?.data;
    }

    return result;
  }

  /**
   * Health check for n8n service
   */
  async healthCheck(): Promise<boolean> {
    const diag = await this.diagnose();
    return diag.webhookReachable === true && diag.webhookResponseSuccess === true;
  }

  private buildHint(error: any): string {
    const msg: string = error.message || '';
    if (msg.includes('ECONNREFUSED'))
      return 'n8n is not running or the port is wrong. Run: docker-compose up -d';
    if (msg.includes('ETIMEDOUT') || msg.includes('timeout'))
      return 'n8n is reachable but Ollama took longer than 5 minutes. Check: ollama list — model must be running.';
    if (msg.includes('404'))
      return 'Webhook path not found. Make sure the workflow is imported and Active in n8n.';
    if (msg.includes('unexpected response'))
      return 'n8n responded but success:true is missing. Check the workflow "Parse & Format Response" node.';
    return 'Check that n8n is running, the workflow is Active, and Ollama is serving qwen2.5:3b.';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
