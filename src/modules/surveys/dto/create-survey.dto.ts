import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsNumber, IsISO8601, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SurveyType } from '../schemas/survey.schema';

class SurveySettingsDto {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  showProgressBar?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  randomizeQuestions?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  requiredCompletion?: boolean;

  @ApiPropertyOptional({ example: 'ar' })
  @IsString()
  @IsOptional()
  language?: string;
}

export class CreateSurveyDto {
  @ApiProperty({ example: 'Pre-Activity Assessment Survey' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'This survey assesses participants knowledge before the activity' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: SurveyType, example: SurveyType.EVALUATION })
  @IsEnum(SurveyType)
  type: SurveyType;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsOptional()
  project?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012' })
  @IsString()
  @IsOptional()
  activity?: string;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  @IsISO8601()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsISO8601()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  allowMultipleResponses?: boolean;

  @ApiPropertyOptional({ example: 'Welcome! Please answer all questions honestly.' })
  @IsString()
  @IsOptional()
  welcomeMessage?: string;

  @ApiPropertyOptional({ example: 'Thank you for your participation!' })
  @IsString()
  @IsOptional()
  thankYouMessage?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsNumber()
  @IsOptional()
  targetResponses?: number;

  @ApiPropertyOptional({ example: ['assessment', 'baseline'] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ type: SurveySettingsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => SurveySettingsDto)
  @IsOptional()
  settings?: SurveySettingsDto;
}
