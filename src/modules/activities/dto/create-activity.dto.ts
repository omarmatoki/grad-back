import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  IsMongoId,
  Matches,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityStatus } from '../schemas/activity.schema';

export class CreateActivityDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  project: string;

  @ApiProperty({ example: 'Leadership Skills Workshop' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Interactive workshop focused on developing essential leadership skills for young professionals' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '2024-03-15' })
  @IsDateString()
  activityDate: string;

  @ApiProperty({ example: '09:00', description: 'Start time in HH:mm format' })
  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format (e.g., 09:00)',
  })
  startTime?: string;

  @ApiPropertyOptional({ example: '12:00', description: 'End time in HH:mm format' })
  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format (e.g., 12:00)',
  })
  endTime?: string;

  @ApiPropertyOptional({ example: 'Riyadh Community Center, Hall A' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 50, description: 'Maximum number of participants (0 for unlimited)' })
  @IsInt()
  @Min(0)
  @IsOptional()
  capacity?: number;

  @ApiProperty({ example: 'workshop', description: 'Activity type value from the registered activity types' })
  @IsString()
  @IsNotEmpty()
  activityType: string;

  @ApiPropertyOptional({ enum: ActivityStatus, default: ActivityStatus.PLANNED })
  @IsEnum(ActivityStatus)
  @IsOptional()
  status?: ActivityStatus;

  @ApiPropertyOptional({ example: ['leadership', 'training', 'youth'], description: 'Tags for categorizing the activity' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
