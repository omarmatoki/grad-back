import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Activity } from '@modules/activities/schemas/activity.schema';
import { Participant } from './participant.schema';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  EXCUSED = 'excused',
  LATE = 'late',
}

export enum EngagementLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

@Schema({ timestamps: true })
export class ActivityParticipant extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Activity', required: true })
  activity: Types.ObjectId | Activity;

  @Prop({ type: Types.ObjectId, ref: 'Participant', required: true })
  participant: Types.ObjectId | Participant;

  @Prop({ type: String, enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  attendanceStatus: AttendanceStatus;

  @Prop({ type: Date })
  checkInTime?: Date;

  @Prop({ type: Date })
  checkOutTime?: Date;

  @Prop({ type: String, enum: EngagementLevel })
  engagementLevel?: EngagementLevel;

  @Prop({ type: Number, min: 0, max: 100 })
  participationScore?: number;

  @Prop()
  feedback?: string;

  @Prop({ type: Number, min: 1, max: 5 })
  satisfactionRating?: number;

  @Prop({ type: [String], default: [] })
  completedTasks: string[];

  @Prop({ type: Number, min: 0, max: 100 })
  preAssessmentScore?: number;

  @Prop({ type: Number, min: 0, max: 100 })
  postAssessmentScore?: number;

  @Prop()
  certificate?: string; // URL to certificate if issued

  @Prop({ type: Object })
  customData?: Record<string, any>;

  @Prop()
  notes?: string;
}

export const ActivityParticipantSchema = SchemaFactory.createForClass(ActivityParticipant);

// Compound indexes
ActivityParticipantSchema.index({ activity: 1, participant: 1 }, { unique: true });
ActivityParticipantSchema.index({ activity: 1 });
ActivityParticipantSchema.index({ participant: 1 });
ActivityParticipantSchema.index({ attendanceStatus: 1 });
