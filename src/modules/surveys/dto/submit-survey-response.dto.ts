import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnswerValueType } from '../schemas/survey-answer.schema';

export class AnswerDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ enum: AnswerValueType, example: AnswerValueType.TEXT })
  @IsEnum(AnswerValueType)
  valueType: AnswerValueType;

  @ApiPropertyOptional({ example: 'This is my answer' })
  @IsString()
  @IsOptional()
  textValue?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  numberValue?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  booleanValue?: boolean;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  dateValue?: Date;

  @ApiPropertyOptional({ example: ['Option 1', 'Option 3'] })
  @IsArray()
  @IsOptional()
  arrayValue?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  objectValue?: Record<string, any>;

  @ApiPropertyOptional({ example: 'https://storage.example.com/file.pdf' })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  timeSpent?: number;
}

export class SubmitSurveyResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  survey: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012' })
  @IsString()
  @IsOptional()
  beneficiary?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439013' })
  @IsString()
  @IsOptional()
  participant?: string;

  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @ApiPropertyOptional({ example: 'ar' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}
