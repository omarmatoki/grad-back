import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsArray,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SurveyAverageDto {
  @ApiProperty({ example: 3.5, description: 'Average score across all survey responses' })
  @IsNumber()
  @Min(0)
  averageScore: number;

  @ApiProperty({ example: 45, description: 'Total number of responses' })
  @IsNumber()
  @Min(0)
  responses: number;
}

export class IndicatorComparisonDto {
  @ApiProperty({ example: 'عدد المستفيدين المتدربين', description: 'Indicator name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 100, description: 'Target value set for this indicator' })
  @IsNumber()
  target: number;

  @ApiProperty({ example: 85, description: 'Actual measured value' })
  @IsNumber()
  actual: number;
}

export class EvaluateImpactDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'MongoDB Project ID' })
  @IsMongoId()
  @IsNotEmpty()
  projectId: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439033', description: 'MongoDB Activity ID' })
  @IsMongoId()
  @IsOptional()
  activityId?: string;

  @ApiProperty({ type: SurveyAverageDto, description: 'Pre-intervention survey data' })
  @ValidateNested()
  @Type(() => SurveyAverageDto)
  preSurveyData: SurveyAverageDto;

  @ApiProperty({ type: SurveyAverageDto, description: 'Post-intervention survey data' })
  @ValidateNested()
  @Type(() => SurveyAverageDto)
  postSurveyData: SurveyAverageDto;

  @ApiProperty({ type: [IndicatorComparisonDto], description: 'KPI indicators for comparison' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndicatorComparisonDto)
  indicators: IndicatorComparisonDto[];

  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar', description: 'Analysis language' })
  @IsEnum(['ar', 'en'])
  @IsOptional()
  language?: 'ar' | 'en';
}
