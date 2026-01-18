import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsNumber, IsDateString, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SurveyType } from '../schemas/survey.schema';

class SurveySettingsDto {
  @ApiPropertyOptional({ example: true })
  showProgressBar?: boolean;

  @ApiPropertyOptional({ example: false })
  randomizeQuestions?: boolean;

  @ApiPropertyOptional({ example: true })
  requiredCompletion?: boolean;

  @ApiPropertyOptional({ example: 'ar' })
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

  @ApiProperty({ enum: SurveyType, example: SurveyType.PRE_EVALUATION })
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
  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  endDate?: Date;

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
