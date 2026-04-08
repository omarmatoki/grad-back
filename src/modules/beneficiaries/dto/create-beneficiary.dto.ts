import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsEmail,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BeneficiaryType } from '../schemas/beneficiary.schema';

export class CreateBeneficiaryDto {
  @ApiProperty({
    enum: BeneficiaryType,
    example: BeneficiaryType.INDIVIDUAL,
    description: 'Type of beneficiary: individual or area',
  })
  @IsEnum(BeneficiaryType)
  @IsNotEmpty()
  beneficiaryType: BeneficiaryType;

  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the beneficiary or area',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  // ── Individual-specific ────────────────────────────────────────────────────

  @ApiPropertyOptional({ example: 28, description: 'Age (individual only)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  age?: number;

  @ApiPropertyOptional({ example: "Bachelor's Degree", description: 'Education level (individual only)' })
  @IsString()
  @IsOptional()
  educationLevel?: string;

  @ApiPropertyOptional({ example: 'Software Engineer', description: 'Profession / occupation (individual only)' })
  @IsString()
  @IsOptional()
  profession?: string;

  @ApiPropertyOptional({ example: 'male', description: 'Gender (individual only)' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: '+966501234567', description: 'Phone number (individual only)' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Email address (individual only)' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '1234567890', description: 'National ID (individual only)' })
  @IsString()
  @IsOptional()
  nationalId?: string;

  // ── Area-specific ──────────────────────────────────────────────────────────

  @ApiPropertyOptional({ example: 250, description: 'Area size in km² (area only)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  areaSize?: number;

  @ApiPropertyOptional({ example: 15000, description: 'Population count (area only)' })
  @IsInt()
  @Min(0)
  @IsOptional()
  population?: number;

  // ── Shared ─────────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ example: 'Riyadh', description: 'City' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Central Region', description: 'Region' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ example: 'Additional notes about the beneficiary' })
  @IsString()
  @IsOptional()
  notes?: string;
}
