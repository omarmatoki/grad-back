import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IndicatorType, MeasurementUnit } from '../schemas/indicator.schema';

export class CreateIndicatorDto {
  @ApiProperty({ enum: IndicatorType, example: IndicatorType.OUTPUT })
  @IsEnum(IndicatorType)
  @IsNotEmpty()
  indicatorType: IndicatorType;

  @ApiProperty({ example: 'عدد المستفيدين المدربين' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'إجمالي عدد الأفراد الذين أكملوا البرنامج التدريبي' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'الاستبيان والعدّ المباشر' })
  @IsString()
  @IsOptional()
  measurementMethod?: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsNumber()
  @IsOptional()
  targetValue?: number;

  @ApiPropertyOptional({ example: 750 })
  @IsNumber()
  @IsOptional()
  actualValue?: number;

  @ApiPropertyOptional({ enum: MeasurementUnit, example: MeasurementUnit.NUMBER })
  @IsEnum(MeasurementUnit)
  @IsOptional()
  unit?: MeasurementUnit;

  @ApiPropertyOptional({ example: 'أسرة' })
  @IsString()
  @IsOptional()
  customUnit?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  calculationFormula?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @IsOptional()
  baselineValue?: number;

  @ApiPropertyOptional({ example: 'monthly' })
  @IsString()
  @IsOptional()
  frequency?: string;

  @ApiPropertyOptional({ example: 'أحمد محمد' })
  @IsString()
  @IsOptional()
  responsiblePerson?: string;

  @ApiPropertyOptional({ example: ['تعليم', 'تدريب'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  thresholds?: {
    critical?: number;
    warning?: number;
    good?: number;
    excellent?: number;
  };

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
