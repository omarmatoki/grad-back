import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SurveyType } from '../schemas/survey.schema';

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

  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Activity ID this survey belongs to' })
  @IsMongoId()
  @IsNotEmpty()
  activity: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;

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

}
