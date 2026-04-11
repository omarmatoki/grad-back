import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjectTypeDto {
  @ApiProperty({ example: 'مبادرات تقنية' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label: string;

  @ApiPropertyOptional({ example: 'tech_initiatives' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  value?: string;
}
