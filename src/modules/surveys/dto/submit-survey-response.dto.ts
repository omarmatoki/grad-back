import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsEnum, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubmissionValueType } from '../schemas/survey-submission.schema';

export class AnswerDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'SurveyQuestion ID' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ enum: SubmissionValueType, example: SubmissionValueType.TEXT })
  @IsEnum(SubmissionValueType)
  valueType: SubmissionValueType;

  @ApiPropertyOptional({ example: 'This is my answer' })
  @IsString()
  @IsOptional()
  textValue?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @IsOptional()
  numberValue?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  booleanValue?: boolean;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsDateString()
  @IsOptional()
  dateValue?: string;

  @ApiPropertyOptional({ example: ['Option 1', 'Option 3'] })
  @IsArray()
  @IsOptional()
  arrayValue?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  objectValue?: Record<string, any>;

  @ApiPropertyOptional({ example: 30, description: 'Time spent on this question (seconds)' })
  @IsNumber()
  @IsOptional()
  timeSpent?: number;
}

export class SubmitSurveyResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Survey ID' })
  @IsString()
  @IsNotEmpty()
  survey: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012', description: 'Beneficiary ID (if applicable)' })
  @IsString()
  @IsOptional()
  beneficiary?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439013', description: 'Participant ID (if applicable)' })
  @IsString()
  @IsOptional()
  participant?: string;

  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
