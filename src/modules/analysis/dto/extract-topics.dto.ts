import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsArray,
  IsOptional,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TopicResponseItemDto {
  @ApiProperty({ example: 'نحتاج إلى تحسين الخدمات الصحية', description: 'A single free-text response' })
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class ExtractTopicsDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'MongoDB Project ID' })
  @IsMongoId()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ example: 'مشروع الصحة المجتمعية', description: 'Human-readable project name' })
  @IsString()
  @IsNotEmpty()
  projectName: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439022', description: 'Activity ID to scope the extraction' })
  @IsMongoId()
  @IsOptional()
  activityId?: string;

  @ApiPropertyOptional({ type: [TopicResponseItemDto], description: 'Manual responses; leave empty to auto-fetch from DB' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TopicResponseItemDto)
  responses?: TopicResponseItemDto[];

  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar' })
  @IsEnum(['ar', 'en'])
  @IsOptional()
  language?: 'ar' | 'en';
}
