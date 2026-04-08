import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Project } from '@modules/projects/schemas/project.schema';

export enum ActivityStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ActivityType {
  TRAINING = 'training',
  WORKSHOP = 'workshop',
  SEMINAR = 'seminar',
  CONSULTATION = 'consultation',
  FIELD_VISIT = 'field_visit',
  AWARENESS_CAMPAIGN = 'awareness_campaign',
  SERVICE_DELIVERY = 'service_delivery',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Activity extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  project: Types.ObjectId | Project;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Date, required: true })
  activityDate: Date;

  @Prop({ type: String, default: '00:00' })
  startTime?: string; // Format: HH:mm

  @Prop({ type: String })
  endTime?: string; // Format: HH:mm

  @Prop()
  location?: string;

  @Prop({ type: Number, default: 0 })
  capacity: number;

  @Prop({ type: Number, default: 0 })
  registeredCount: number;

  @Prop({ type: String, enum: ActivityType, required: true })
  activityType: ActivityType;

  @Prop({ type: String, enum: ActivityStatus, default: ActivityStatus.PLANNED })
  status: ActivityStatus;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

// Compound indexes for efficient queries
ActivitySchema.index({ project: 1, status: 1 });
ActivitySchema.index({ activityDate: -1 });
ActivitySchema.index({ project: 1, activityDate: -1 });
ActivitySchema.index({ status: 1 });
ActivitySchema.index({ activityType: 1 });
ActivitySchema.index({ title: 'text', description: 'text' });

// Virtual for checking if activity is full
ActivitySchema.virtual('isFull').get(function() {
  return this.capacity > 0 && this.registeredCount >= this.capacity;
});

// Virtual for available spots
ActivitySchema.virtual('availableSpots').get(function() {
  if (this.capacity === 0) return Infinity;
  return Math.max(0, this.capacity - this.registeredCount);
});

// Ensure virtuals are included in JSON output
ActivitySchema.set('toJSON', { virtuals: true });
ActivitySchema.set('toObject', { virtuals: true });
