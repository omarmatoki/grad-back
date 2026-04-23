import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@modules/users/schemas/user.schema';
import { RequestUser } from '@common/interfaces/request-user.interface';
import { ImpactAssessmentService } from '../services/impact-assessment.service';
import { EvaluateImpactDto } from '../dto/evaluate-impact.dto';

/**
 * Handles POST /analysis/impact-evaluation
 * Compares pre/post survey scores and indicator values to produce an AI-driven impact report.
 * Data flow: EvaluateImpactDto → ImpactAssessmentService → n8nAiService → ImpactAssessmentResult
 */
@ApiTags('Analysis – Impact')
@ApiBearerAuth()
@Controller('analysis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImpactAssessmentController {
  constructor(private readonly impactAssessmentService: ImpactAssessmentService) {}

  @Post('impact-evaluation')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Evaluate project impact (pre vs post)',
    description:
      'Compares pre-intervention and post-intervention survey averages along with KPI indicators to compute improvement metrics and an AI narrative.',
  })
  @ApiResponse({ status: 200, description: 'Impact evaluation completed successfully' })
  @ApiResponse({ status: 502, description: 'n8n AI engine unreachable' })
  evaluateImpact(
    @Body() dto: EvaluateImpactDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.impactAssessmentService.evaluate(dto, user._id, user.role);
  }
}
