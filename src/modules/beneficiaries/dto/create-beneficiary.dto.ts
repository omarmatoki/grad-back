import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, Min, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BeneficiaryType } from '../schemas/beneficiary.schema';

export class CreateBeneficiaryDto {
  @ApiProperty({
    description: 'Project ID that this beneficiary belongs to',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsNotEmpty()
  project: string;

  @ApiProperty({
    enum: BeneficiaryType,
    example: BeneficiaryType.PERSON,
    description: 'Type of beneficiary (person, area, or group)'
  })
  @IsEnum(BeneficiaryType)
  @IsNotEmpty()
  beneficiaryType: BeneficiaryType;

  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the beneficiary, area, or group'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Riyadh',
    description: 'City where the beneficiary is located'
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    example: 'Central Region',
    description: 'Region where the beneficiary is located'
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({
    example: 150,
    description: 'Population size (for areas or groups)',
    minimum: 0
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  populationSize?: number;

  @ApiPropertyOptional({
    example: 'Additional notes about the beneficiary',
    description: 'Any additional information or notes'
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
