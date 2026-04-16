import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnswerDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'SurveyQuestion ID' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({ example: 'هذه إجابتي' })
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

  @ApiPropertyOptional({ example: ['الخيار الأول', 'الخيار الثاني'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  arrayValue?: string[];
}

export class SubmitSurveySubmissionDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Survey ID' })
  @IsString()
  @IsNotEmpty()
  survey: string;

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439012',
    description: 'Beneficiary ID — اختياري للاستبيانات المجهولة',
  })
  @IsString()
  @IsOptional()
  beneficiary?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z', description: 'وقت فتح الاستبيان' })
  @IsDateString()
  @IsOptional()
  startedAt?: string;

  @ApiProperty({ type: [AnswerDto], description: 'قائمة إجابات المستفيد، إجابة واحدة لكل سؤال' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
