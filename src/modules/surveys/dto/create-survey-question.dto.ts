import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType } from '../schemas/survey-question.schema';

class ConditionalDto {
  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  dependsOn?: string;

  @ApiPropertyOptional({ example: 'yes' })
  showIf?: any;
}

export class CreateSurveyQuestionDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  survey: string;

  @ApiProperty({ example: 'How satisfied are you with the program?' })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({ enum: QuestionType, example: QuestionType.RATING })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional({ example: 'Please rate from 1 to 5' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: ['Option 1', 'Option 2', 'Option 3'] })
  @IsArray()
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional({ type: ConditionalDto })
  @IsObject()
  @ValidateNested()
  @Type(() => ConditionalDto)
  @IsOptional()
  conditional?: ConditionalDto;

  @ApiPropertyOptional({ example: ['knowledge', 'baseline'] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this question is part of a quiz/assessment with a correct answer'
  })
  @IsBoolean()
  @IsOptional()
  isQuiz?: boolean;

  @ApiPropertyOptional({
    example: 'Option 2',
    description: 'The correct answer for quiz questions. Can be string, number, or boolean depending on question type'
  })
  @IsOptional()
  correctAnswer?: any;

  @ApiPropertyOptional({
    example: 10,
    description: 'Points awarded for correct answer in quiz mode'
  })
  @IsOptional()
  points?: number;
}
