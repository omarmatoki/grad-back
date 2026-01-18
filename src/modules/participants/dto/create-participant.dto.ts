import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsEmail,
  IsNumber,
  IsDateString,
  Min,
  Max,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParticipationType, Gender, ParticipantStatus } from '../schemas/participant.schema';

export class CreateParticipantDto {
  @ApiProperty({ description: 'Beneficiary ID reference', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  beneficiary: string;

  @ApiProperty({ description: 'Project ID reference', example: '507f1f77bcf86cd799439012' })
  @IsMongoId()
  @IsNotEmpty()
  project: string;

  @ApiProperty({ description: 'Full name of the participant', example: 'Ahmed Mohammed Ali' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'ahmed.ali@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+966501234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'National ID number', example: '1234567890' })
  @IsString()
  @IsOptional()
  nationalId?: string;

  @ApiPropertyOptional({ description: 'Age of the participant', example: 25 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  age?: number;

  @ApiPropertyOptional({ enum: Gender, description: 'Gender of the participant', example: Gender.MALE })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Education level', example: 'Bachelor Degree' })
  @IsString()
  @IsOptional()
  educationLevel?: string;

  @ApiPropertyOptional({ description: 'Occupation', example: 'Software Developer' })
  @IsString()
  @IsOptional()
  occupation?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Riyadh' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    enum: ParticipationType,
    description: 'Type of participation',
    example: ParticipationType.FULL_TIME,
  })
  @IsEnum(ParticipationType)
  @IsOptional()
  participationType?: ParticipationType;

  @ApiPropertyOptional({ description: 'Registration date', example: '2024-01-15T10:00:00Z' })
  @IsDateString()
  @IsOptional()
  registrationDate?: Date;

  @ApiPropertyOptional({ description: 'Number of sessions attended', example: 8, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  attendanceSessions?: number;

  @ApiPropertyOptional({ description: 'Total number of sessions', example: 10, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalSessions?: number;

  @ApiPropertyOptional({ description: 'Pre-assessment score (0-100)', example: 65, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  preAssessmentScore?: number;

  @ApiPropertyOptional({ description: 'Post-assessment score (0-100)', example: 85, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  postAssessmentScore?: number;

  @ApiPropertyOptional({
    enum: ParticipantStatus,
    description: 'Status of the participant',
    example: ParticipantStatus.ACTIVE,
  })
  @IsEnum(ParticipantStatus)
  @IsOptional()
  status?: ParticipantStatus;
}
