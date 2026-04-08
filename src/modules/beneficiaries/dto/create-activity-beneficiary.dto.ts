import { IsMongoId, IsNotEmpty, IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActivityBeneficiaryDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Beneficiary ID' })
  @IsMongoId()
  @IsNotEmpty()
  beneficiary: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Activity ID' })
  @IsMongoId()
  @IsNotEmpty()
  activity: string;

  @ApiPropertyOptional({ example: 3, description: 'Interaction level from 1 (minimal) to 5 (intensive)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  interactionLevel?: number;

  @ApiPropertyOptional({ example: 4, description: 'Participation degree from 1 (passive) to 5 (fully active)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  participationDegree?: number;

  @ApiPropertyOptional({ example: 5, description: 'Satisfaction rating from 1 (very dissatisfied) to 5 (very satisfied)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  satisfactionRating?: number;

  @ApiPropertyOptional({ example: 'Very engaged beneficiary, showed great enthusiasm' })
  @IsString()
  @IsOptional()
  notes?: string;
}
