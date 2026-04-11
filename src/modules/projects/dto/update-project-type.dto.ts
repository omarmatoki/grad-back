import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateProjectTypeDto {
  @ApiProperty({ example: 'مشاريع تمكين اقتصادي' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label: string;
}
