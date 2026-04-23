import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsArray,
  IsOptional,
  IsEnum,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ProjectMetaDto {
  @ApiProperty({ example: 'مشروع الصحة المجتمعية', description: 'Project name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'in_progress', description: 'Current project status' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ example: '2024-01-01', description: 'Project start date (ISO)' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2024-12-31', description: 'Project end date (ISO)' })
  @IsString()
  @IsNotEmpty()
  endDate: string;
}

export class SurveyDataItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439044', description: 'MongoDB Survey ID' })
  @IsMongoId()
  surveyId: string;

  @ApiProperty({ example: 30, description: 'Number of responses collected for this survey' })
  @IsNumber()
  responseCount: number;
}

export class IndicatorItemDto {
  @ApiProperty({ example: 'عدد المستفيدين', description: 'Indicator name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 100, description: 'Target value' })
  @IsNumber()
  target: number;

  @ApiProperty({ example: 85, description: 'Actual achieved value' })
  @IsNumber()
  actual: number;
}

export class ComprehensiveAnalysisDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'MongoDB Project ID' })
  @IsMongoId()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ type: ProjectMetaDto, description: 'Core project metadata' })
  @ValidateNested()
  @Type(() => ProjectMetaDto)
  projectData: ProjectMetaDto;

  @ApiPropertyOptional({
    type: [SurveyDataItemDto],
    description: 'Survey response summary (backend auto-fetches if empty)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyDataItemDto)
  @IsOptional()
  allSurveyData?: SurveyDataItemDto[];

  @ApiPropertyOptional({
    type: [IndicatorItemDto],
    description: 'KPI indicators (backend auto-fetches if empty)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndicatorItemDto)
  @IsOptional()
  indicators?: IndicatorItemDto[];

  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar', description: 'Analysis language' })
  @IsEnum(['ar', 'en'])
  @IsOptional()
  language?: 'ar' | 'en';
}
