import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsEmail,
  IsNumber,
  Min,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, ParticipantStatus } from '../schemas/participant.schema';

export class CreateParticipantDto {
  @ApiPropertyOptional({
    description: 'Beneficiary ID reference (optional – area or individual beneficiary)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsOptional()
  beneficiary?: string;

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

  @ApiPropertyOptional({ description: 'City', example: 'Riyadh' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Type of participation (free text, e.g. full_time, part_time, online)',
    example: 'full_time',
  })
  @IsString()
  @IsOptional()
  participationType?: string;

  @ApiPropertyOptional({
    enum: ParticipantStatus,
    description: 'Status of the participant',
    example: ParticipantStatus.ACTIVE,
  })
  @IsEnum(ParticipantStatus)
  @IsOptional()
  status?: ParticipantStatus;
}
