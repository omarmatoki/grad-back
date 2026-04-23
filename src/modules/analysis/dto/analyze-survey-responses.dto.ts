import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsArray,
  IsOptional,
  IsEnum,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SurveyResponseItemDto {
  @ApiProperty({ example: 'ما رأيك في البرنامج؟', description: 'Survey question text' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'البرنامج مفيد جداً وأحببته كثيراً', description: 'Respondent answer' })
  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class AnalyzeSurveyResponsesDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'MongoDB Project ID' })
  @IsMongoId()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439022', description: 'MongoDB Survey ID' })
  @IsMongoId()
  @IsNotEmpty()
  surveyId: string;

  @ApiProperty({ type: [SurveyResponseItemDto], description: 'List of question-answer pairs' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SurveyResponseItemDto)
  responses: SurveyResponseItemDto[];

  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar', description: 'Analysis language' })
  @IsEnum(['ar', 'en'])
  @IsOptional()
  language?: 'ar' | 'en';
}
