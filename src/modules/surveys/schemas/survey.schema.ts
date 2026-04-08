import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Activity } from '@modules/activities/schemas/activity.schema';

export enum SurveyType {
  EVALUATION = 'evaluation',
  TEST = 'test',
  SATISFACTION = 'satisfaction',
}

export enum SurveyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

@Schema({ timestamps: true })
export class Survey extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: Object.values(SurveyType), required: true })
  type: SurveyType;

  @Prop({ type: String, enum: Object.values(SurveyStatus), default: SurveyStatus.DRAFT })
  status: SurveyStatus;

  @Prop({ type: Types.ObjectId, ref: 'Activity', required: true })
  activity: Types.ObjectId | Activity;

  @Prop({ type: Date })
  startDate?: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ default: false })
  isAnonymous: boolean;

  @Prop({ default: true })
  allowMultipleResponses: boolean;

  @Prop()
  welcomeMessage?: string;

  @Prop()
  thankYouMessage?: string;

  @Prop({ type: Number, default: 0 })
  targetResponses: number;

  @Prop({ type: Number, default: 0 })
  totalResponses: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object })
  settings?: {
    showProgressBar?: boolean;
    randomizeQuestions?: boolean;
    requiredCompletion?: boolean;
    language?: string;
  };

  @Prop({ type: Object })
  customFields?: Record<string, any>;
}

export const SurveySchema = SchemaFactory.createForClass(Survey);

// Indexes
SurveySchema.index({ activity: 1 });
SurveySchema.index({ type: 1 });
SurveySchema.index({ status: 1 });
SurveySchema.index({ startDate: -1 });
