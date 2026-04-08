import { IsMongoId, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActivityParticipantDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Participant ID' })
  @IsMongoId()
  @IsNotEmpty()
  participant: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Activity ID' })
  @IsMongoId()
  @IsNotEmpty()
  activity: string;
}
