import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDate,
  IsEnum,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MeasurementStatus } from '../schemas/indicator-history.schema';

export class RecordIndicatorValueDto {
  @ApiProperty({
    example: 850,
    description: 'The value being recorded for this indicator',
  })
  @IsNumber()
  @IsNotEmpty()
  recordedValue: number;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Date and time when this value was calculated/measured',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  calculatedAt?: Date;

  @ApiPropertyOptional({
    example: 'Field survey Q1 2024',
    description: 'Source of the recorded value',
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({
    example: 'Value verified during quarterly review',
    description: 'Additional notes about this measurement',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Person who measured this value',
  })
  @IsString()
  @IsOptional()
  measuredBy?: string;

  @ApiPropertyOptional({
    enum: MeasurementStatus,
    example: MeasurementStatus.RECORDED,
    description: 'Status of this measurement',
  })
  @IsEnum(MeasurementStatus)
  @IsOptional()
  status?: MeasurementStatus;

  @ApiPropertyOptional({
    example: {
      activity: 'Monthly Distribution',
      period: 'January 2024',
    },
    description: 'Context information about this measurement',
  })
  @IsOptional()
  context?: {
    activity?: string;
    survey?: string;
    event?: string;
    period?: string;
  };

  @ApiPropertyOptional({
    example: ['https://example.com/file1.pdf', 'https://example.com/file2.jpg'],
    description: 'URLs or paths to supporting documents',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @ApiPropertyOptional({
    example: { customField: 'customValue' },
    description: 'Additional metadata',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
