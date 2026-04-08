import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Activity } from '@modules/activities/schemas/activity.schema';
import { Participant } from './participant.schema';

@Schema({ timestamps: true })
export class ActivityParticipant extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Activity', required: true, index: true })
  activity: Types.ObjectId | Activity;

  @Prop({ type: Types.ObjectId, ref: 'Participant', required: true, index: true })
  participant: Types.ObjectId | Participant;
}

export const ActivityParticipantSchema = SchemaFactory.createForClass(ActivityParticipant);

// Unique compound index — a participant can only be linked once per activity
ActivityParticipantSchema.index({ activity: 1, participant: 1 }, { unique: true });
ActivityParticipantSchema.index({ participant: 1 });
