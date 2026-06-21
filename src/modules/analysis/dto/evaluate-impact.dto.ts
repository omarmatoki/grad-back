import { IsNotEmpty, IsMongoId, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EvaluateImpactDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'MongoDB Project ID' })
  @IsMongoId()
  @IsNotEmpty()
  projectId: string;

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439033',
    description: 'MongoDB Activity ID — scopes the evaluation to one activity instead of the whole project',
  })
  @IsMongoId()
  @IsOptional()
  activityId?: string;

  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar', description: 'Analysis language' })
  @IsEnum(['ar', 'en'])
  @IsOptional()
  language?: 'ar' | 'en';
}
