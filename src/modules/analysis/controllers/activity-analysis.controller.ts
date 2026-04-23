import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@modules/users/schemas/user.schema';
import { RequestUser } from '@common/interfaces/request-user.interface';
import { ActivityAnalysisService } from '../services/activity-analysis.service';
import { AnalyzeSurveyResponsesDto } from '../dto/analyze-survey-responses.dto';

/**
 * Handles POST /analysis/survey-responses
 * Runs AI sentiment + keyword + topic extraction on open-ended survey answers.
 * Data flow: AnalyzeSurveyResponsesDto → ActivityAnalysisService → n8nAiService → MongoDB
 */
@ApiTags('Analysis – Activity')
@ApiBearerAuth()
@Controller('analysis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityAnalysisController {
  constructor(private readonly activityAnalysisService: ActivityAnalysisService) {}

  @Post('survey-responses')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Analyze survey text responses',
    description:
      'Sends open-ended survey answers to the AI engine and returns sentiment scores, keywords, extracted topics, and insights.',
  })
  @ApiResponse({ status: 200, description: 'Activity analysis completed successfully' })
  @ApiResponse({ status: 502, description: 'n8n AI engine unreachable' })
  analyzeSurveyResponses(
    @Body() dto: AnalyzeSurveyResponsesDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.activityAnalysisService.analyze(dto, user._id, user.role);
  }
}
