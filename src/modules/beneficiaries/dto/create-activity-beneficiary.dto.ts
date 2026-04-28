import { IsMongoId, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActivityBeneficiaryDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Beneficiary ID' })
  @IsMongoId()
  @IsNotEmpty()
  beneficiary: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Activity ID' })
  @IsMongoId()
  @IsNotEmpty()
  activity: string;
}
