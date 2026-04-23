/**
 * @deprecated Replaced by 4 focused controllers in ./controllers/
 *   - ActivityAnalysisController  (POST /analysis/survey-responses)
 *   - ImpactAssessmentController  (POST /analysis/impact-evaluation)
 *   - TopicExtractionController   (POST /analysis/needs-topics)
 *   - ProjectAnalysisController   (POST /analysis/comprehensive, GET /analysis/project/:id)
 * This file is no longer registered in analysis.module.ts and can be deleted.
 */
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { N8nAiService } from './services/n8n-ai.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@modules/users/schemas/user.schema';
import { RequestUser } from '@common/interfaces/request-user.interface';

@ApiTags('Analysis')
@ApiBearerAuth()
@Controller('analysis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalysisController {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly n8nAiService: N8nAiService,
  ) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Diagnose n8n connectivity and workflow status (no auth required)' })
  @ApiResponse({ status: 200, description: 'Diagnostic report' })
  diagnoseN8n() {
    return this.n8nAiService.diagnose();
  }

  @Post('survey-responses')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Analyze survey responses with AI' })
  @ApiResponse({ status: 200, description: 'Analysis completed successfully' })
  analyzeSurveyResponses(
    @Body() payload: {
      projectId: string;
      surveyId: string;
      responses: any[];
      language?: string;
    },
    @CurrentUser() user: RequestUser,
  ) {
    return this.analysisService.analyzeSurveyResponses(
      payload.projectId,
      payload.surveyId,
      payload.responses,
      payload.language,
      user._id,
      user.role,
    );
  }

  @Post('impact-evaluation')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Evaluate impact by comparing pre/post surveys' })
  @ApiResponse({ status: 200, description: 'Impact evaluation completed' })
  evaluateImpact(
    @Body() payload: {
      projectId: string;
      activityId: string;
      preSurveyData: any;
      postSurveyData: any;
      indicators: any[];
      language?: string;
    },
    @CurrentUser() user: RequestUser,
  ) {
    return this.analysisService.evaluateImpact(
      payload.projectId,
      payload.activityId,
      payload.preSurveyData,
      payload.postSurveyData,
      payload.indicators,
      payload.language,
      user._id,
      user.role,
    );
  }

  @Post('needs-topics')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Extract topics from needs assessment' })
  @ApiResponse({ status: 200, description: 'Topics extracted successfully' })
  extractNeedsTopics(
    @Body() payload: {
      projectId: string;
      projectName: string;
      responses: any[];
      language?: string;
    },
    @CurrentUser() user: RequestUser,
  ) {
    return this.analysisService.extractNeedsTopics(
      payload.projectId,
      payload.projectName,
      payload.responses,
      payload.language,
      user._id,
      user.role,
    );
  }

  @Post('comprehensive')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Run comprehensive project analysis' })
  @ApiResponse({ status: 200, description: 'Comprehensive analysis completed' })
  comprehensiveAnalysis(
    @Body() payload: {
      projectId: string;
      projectData: any;
      allSurveyData: any[];
      indicators: any[];
      language?: string;
    },
    @CurrentUser() user: RequestUser,
  ) {
    return this.analysisService.comprehensiveProjectAnalysis(
      payload.projectId,
      payload.projectData,
      payload.allSurveyData,
      payload.indicators,
      payload.language,
      user._id,
      user.role,
    );
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all analyses for a project' })
  @ApiResponse({ status: 200, description: 'Project analysis retrieved' })
  getProjectAnalysis(@Param('projectId') projectId: string) {
    return this.analysisService.getProjectAnalysis(projectId);
  }
}
