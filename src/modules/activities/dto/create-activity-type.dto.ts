import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateActivityTypeDto {
  @ApiProperty({ example: 'ورشة عمل' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label: string;

  @ApiPropertyOptional({ example: 'workshop' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  value?: string;
}
