import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@modules/users/schemas/user.schema';
import { RequestUser } from '@common/interfaces/request-user.interface';
import { TopicExtractionService } from '../services/topic-extraction.service';
import { ExtractTopicsDto } from '../dto/extract-topics.dto';

/**
 * Handles POST /analysis/needs-topics
 * Discovers recurring themes and needs from free-text beneficiary responses.
 * Data flow: ExtractTopicsDto → TopicExtractionService → n8nAiService → MongoDB Topics → TopicExtractionResult
 */
@ApiTags('Analysis – Topics')
@ApiBearerAuth()
@Controller('analysis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TopicExtractionController {
  constructor(private readonly topicExtractionService: TopicExtractionService) {}

  @Post('needs-topics')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Extract topics from beneficiary responses',
    description:
      'Groups free-text beneficiary responses into coherent themes using AI topic modelling, persists them to MongoDB, and returns ranked topics with sentiment.',
  })
  @ApiResponse({ status: 200, description: 'Topics extracted and saved successfully' })
  @ApiResponse({ status: 502, description: 'n8n AI engine unreachable' })
  extractNeedsTopics(
    @Body() dto: ExtractTopicsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.topicExtractionService.extract(dto, user._id, user.role);
  }
}
