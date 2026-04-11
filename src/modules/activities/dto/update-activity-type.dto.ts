import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateActivityTypeDto {
  @ApiProperty({ example: 'ورشة عمل متقدمة' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label: string;
}
