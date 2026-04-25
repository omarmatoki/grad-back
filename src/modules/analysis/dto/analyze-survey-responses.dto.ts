import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsArray,
  IsOptional,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SurveyResponseItemDto {
  @ApiProperty({ example: 'ما رأيك في البرنامج؟', description: 'Survey question text' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'البرنامج مفيد جداً', description: 'Respondent answer' })
  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class AnalyzeSurveyResponsesDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'MongoDB Project ID' })
  @IsMongoId()
  @IsNotEmpty()
  projectId: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439022', description: 'Activity ID to scope the analysis' })
  @IsMongoId()
  @IsOptional()
  activityId?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439022', description: 'Survey ID (optional, kept for backwards compat)' })
  @IsString()
  @IsOptional()
  surveyId?: string;

  @ApiPropertyOptional({ type: [SurveyResponseItemDto], description: 'Manual responses; leave empty to auto-fetch from DB' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SurveyResponseItemDto)
  responses?: SurveyResponseItemDto[];

  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar' })
  @IsEnum(['ar', 'en'])
  @IsOptional()
  language?: 'ar' | 'en';
}
