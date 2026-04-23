import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsArray,
  IsOptional,
  IsEnum,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TopicResponseItemDto {
  @ApiProperty({
    example: 'نحتاج إلى تحسين الخدمات الصحية في المنطقة',
    description: 'A single free-text response from a beneficiary',
  })
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

  @ApiProperty({
    type: [TopicResponseItemDto],
    description: 'Free-text beneficiary responses to extract topics from',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TopicResponseItemDto)
  responses: TopicResponseItemDto[];

  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar', description: 'Language of the responses' })
  @IsEnum(['ar', 'en'])
  @IsOptional()
  language?: 'ar' | 'en';
}
