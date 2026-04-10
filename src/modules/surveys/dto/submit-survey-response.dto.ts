import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnswerDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'SurveyQuestion ID' })
  @IsString()
  @IsNotEmpty()
  question: string;

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

  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
