import { PartialType } from '@nestjs/swagger';
import { CreateParticipantDto } from './create-participant.dto';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateParticipantDto extends PartialType(CreateParticipantDto) {
  @ApiPropertyOptional({ description: 'Number of sessions attended', example: 9 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  attendanceSessions?: number;

  @ApiPropertyOptional({ description: 'Total number of sessions', example: 10 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalSessions?: number;

  @ApiPropertyOptional({ description: 'Pre-assessment score (0-100)', example: 65 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  preAssessmentScore?: number;

  @ApiPropertyOptional({ description: 'Post-assessment score (0-100)', example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  postAssessmentScore?: number;
}
