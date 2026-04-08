import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParticipantsService } from './participants.service';
import { ParticipantsController } from './participants.controller';
import { Participant, ParticipantSchema } from './schemas/participant.schema';
import { ActivityParticipant, ActivityParticipantSchema } from './schemas/activity-participant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Participant.name, schema: ParticipantSchema },
      { name: ActivityParticipant.name, schema: ActivityParticipantSchema },
    ]),
  ],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService, MongooseModule],
})
export class ParticipantsModule {}
