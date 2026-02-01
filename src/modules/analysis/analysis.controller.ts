import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@modules/users/schemas/user.schema';

@ApiTags('Analysis')
@ApiBearerAuth()
@Controller('analysis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('survey-responses')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Analyze survey responses with AI' })
  @ApiResponse({ status: 200, description: 'Analysis completed successfully' })
  analyzeSurveyResponses(
    @Body() payload: {
      projectId: string;
      surveyId: string;
      responses: any[];
      language?: string;
    },
  ) {
    return this.analysisService.analyzeSurveyResponses(
      payload.projectId,
      payload.surveyId,
      payload.responses,
      payload.language,
    );
  }

  @Post('impact-evaluation')
  @Roles(UserRole.ADMIN)
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
  ) {
    return this.analysisService.evaluateImpact(
      payload.projectId,
      payload.activityId,
      payload.preSurveyData,
      payload.postSurveyData,
      payload.indicators,
      payload.language,
    );
  }

  @Post('needs-topics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Extract topics from needs assessment' })
  @ApiResponse({ status: 200, description: 'Topics extracted successfully' })
  extractNeedsTopics(
    @Body() payload: {
      projectId: string;
      projectName: string;
      responses: any[];
      language?: string;
    },
  ) {
    return this.analysisService.extractNeedsTopics(
      payload.projectId,
      payload.projectName,
      payload.responses,
      payload.language,
    );
  }

  @Post('comprehensive')
  @Roles(UserRole.ADMIN)
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
  ) {
    return this.analysisService.comprehensiveProjectAnalysis(
      payload.projectId,
      payload.projectData,
      payload.allSurveyData,
      payload.indicators,
      payload.language,
    );
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all analyses for a project' })
  @ApiResponse({ status: 200, description: 'Project analysis retrieved' })
  getProjectAnalysis(@Param('projectId') projectId: string) {
    return this.analysisService.getProjectAnalysis(projectId);
  }
}
