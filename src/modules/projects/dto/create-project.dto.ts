import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectType, ProjectStatus } from '../schemas/project.schema';

class BudgetDto {
  @ApiProperty({ example: 100000 })
  total: number;

  @ApiProperty({ example: 'SAR' })
  currency: string;

  @ApiPropertyOptional({ example: 25000 })
  spent?: number;
}

class GoalsDto {
  @ApiPropertyOptional({ example: ['Increase awareness by 30%'] })
  short_term?: string[];

  @ApiPropertyOptional({ example: ['Achieve sustainable impact in community'] })
  long_term?: string[];
}

export class CreateProjectDto {
  @ApiProperty({ example: 'Youth Empowerment Initiative' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'A comprehensive program to empower youth through education and skills training' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ProjectType, example: ProjectType.INTERVENTION })
  @IsEnum(ProjectType)
  type: ProjectType;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.DRAFT })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  startDate: Date;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({ example: 'Riyadh, Saudi Arabia' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: ['Youth 18-25', 'Unemployed individuals'] })
  @IsArray()
  @IsOptional()
  targetGroups?: string[];

  @ApiPropertyOptional({ type: BudgetDto })
  @IsObject()
  @ValidateNested()
  @Type(() => BudgetDto)
  @IsOptional()
  budget?: BudgetDto;

  @ApiPropertyOptional({ type: GoalsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => GoalsDto)
  @IsOptional()
  goals?: GoalsDto;

  @ApiPropertyOptional({ example: ['education', 'employment', 'youth'] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
