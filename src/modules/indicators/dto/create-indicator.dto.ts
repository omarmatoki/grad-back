import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsMongoId,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IndicatorType, MeasurementUnit } from '../schemas/indicator.schema';

export class CreateIndicatorDto {
  @ApiProperty({
    description: 'Project ID that this indicator belongs to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsNotEmpty()
  project: string;

  @ApiProperty({
    enum: IndicatorType,
    example: IndicatorType.OUTPUT,
    description: 'Type of indicator',
  })
  @IsEnum(IndicatorType)
  @IsNotEmpty()
  indicatorType: IndicatorType;

  @ApiProperty({
    example: 'Number of beneficiaries reached',
    description: 'Name of the indicator',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Total number of individuals who received direct assistance',
    description: 'Description of the indicator',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    example: 'Survey and direct counting',
    description: 'Method used to measure this indicator',
  })
  @IsString()
  @IsOptional()
  measurementMethod?: string;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Target value for this indicator',
  })
  @IsNumber()
  @IsOptional()
  targetValue?: number;

  @ApiPropertyOptional({
    example: 750,
    description: 'Current actual value of the indicator',
  })
  @IsNumber()
  @IsOptional()
  actualValue?: number;

  @ApiPropertyOptional({
    enum: MeasurementUnit,
    example: MeasurementUnit.NUMBER,
    description: 'Unit of measurement',
  })
  @IsEnum(MeasurementUnit)
  @IsOptional()
  unit?: MeasurementUnit;

  @ApiPropertyOptional({
    example: 'households',
    description: 'Custom unit when unit is set to CUSTOM',
  })
  @IsString()
  @IsOptional()
  customUnit?: string;

  @ApiPropertyOptional({
    example: 'SUM(field1, field2) / COUNT(field3)',
    description: 'Formula for calculating composite indicators',
  })
  @IsString()
  @IsOptional()
  calculationFormula?: string;

  @ApiPropertyOptional({
    example: 'Project database and field surveys',
    description: 'Source of data for this indicator',
  })
  @IsString()
  @IsOptional()
  dataSource?: string;

  @ApiPropertyOptional({
    example: 500,
    description: 'Baseline value at the start of measurement',
  })
  @IsNumber()
  @IsOptional()
  baselineValue?: number;

  @ApiPropertyOptional({
    example: 'monthly',
    description: 'Frequency of measurement (e.g., daily, weekly, monthly)',
  })
  @IsString()
  @IsOptional()
  frequency?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Person responsible for this indicator',
  })
  @IsString()
  @IsOptional()
  responsiblePerson?: string;

  @ApiPropertyOptional({
    example: ['education', 'literacy'],
    description: 'Tags for categorizing the indicator',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    example: { critical: 300, warning: 500, good: 800, excellent: 1000 },
    description: 'Performance thresholds for the indicator',
  })
  @IsOptional()
  thresholds?: {
    critical?: number;
    warning?: number;
    good?: number;
    excellent?: number;
  };

  @ApiPropertyOptional({
    example: { customField: 'customValue' },
    description: 'Additional metadata',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
