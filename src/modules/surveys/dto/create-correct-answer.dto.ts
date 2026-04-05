import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsBoolean, IsArray, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubmissionValueType } from '../schemas/survey-submission.schema';

export class CreateCorrectAnswerDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'SurveyQuestion ID' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ enum: SubmissionValueType, example: SubmissionValueType.TEXT })
  @IsEnum(SubmissionValueType)
  valueType: SubmissionValueType;

  @ApiPropertyOptional({ example: 'Paris' })
  @IsString()
  @IsOptional()
  textValue?: string;

  @ApiPropertyOptional({ example: 42 })
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

  @ApiPropertyOptional({ example: ['A', 'B'] })
  @IsArray()
  @IsOptional()
  arrayValue?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  objectValue?: Record<string, any>;

  @ApiPropertyOptional({ example: 1, description: 'Score weight for this correct answer' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  scoreWeight?: number;
}
