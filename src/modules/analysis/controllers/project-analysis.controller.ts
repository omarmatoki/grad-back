import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@modules/users/schemas/user.schema';
import { RequestUser } from '@common/interfaces/request-user.interface';
import { ProjectAnalysisService } from '../services/project-analysis.service';
import { N8nAiService } from '../services/n8n-ai.service';
import { ComprehensiveAnalysisDto } from '../dto/comprehensive-analysis.dto';

/**
 * Handles POST /analysis/comprehensive, GET /analysis/project/:id, GET /analysis/health
 * Orchestrates a full-project analysis by auto-fetching surveys, submissions, and indicators from DB.
 * Data flow: ComprehensiveAnalysisDto → ProjectAnalysisService → n8nAiService → MongoDB (TextAnalysis + Topics) → ComprehensiveAnalysisResult
 */
@ApiTags('Analysis – Project')
@ApiBearerAuth()
@Controller('analysis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectAnalysisController {
  constructor(
    private readonly projectAnalysisService: ProjectAnalysisService,
    private readonly n8nAiService: N8nAiService,
  ) {}

  @Get('health')
  @Public()
  @ApiOperation({
    summary: 'Diagnose n8n connectivity (no auth required)',
    description: 'Returns a detailed diagnostic report: n8n reachability, webhook status, and response sample.',
  })
  @ApiResponse({ status: 200, description: 'Diagnostic report returned' })
  diagnoseN8n() {
    return this.n8nAiService.diagnose();
  }

  @Post('comprehensive')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Run comprehensive project analysis',
    description:
      'Auto-fetches all survey submissions and KPI indicators from the database, then calls the AI engine to produce a full sentiment + topic + impact report.',
  })
  @ApiResponse({ status: 200, description: 'Comprehensive analysis completed successfully' })
  @ApiResponse({ status: 502, description: 'n8n AI engine unreachable' })
  comprehensiveAnalysis(
    @Body() dto: ComprehensiveAnalysisDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projectAnalysisService.runComprehensive(dto, user._id, user.role);
  }

  @Get('project/:projectId')
  @ApiOperation({
    summary: 'Retrieve saved analyses for a project',
    description:
      'Returns up to 10 saved TextAnalysis records, all persisted topics, and overall sentiment distribution for the given project.',
  })
  @ApiResponse({ status: 200, description: 'Saved project analysis returned' })
  getProjectAnalysis(@Param('projectId') projectId: string) {
    return this.projectAnalysisService.getSavedAnalysis(projectId);
  }
}
