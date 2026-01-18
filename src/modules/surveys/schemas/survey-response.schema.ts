import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Survey } from './survey.schema';
import { Beneficiary } from '@modules/beneficiaries/schemas/beneficiary.schema';
import { Participant } from '@modules/participants/schemas/participant.schema';

export enum ResponseStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

@Schema({ timestamps: true })
export class SurveyResponse extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Survey', required: true })
  survey: Types.ObjectId | Survey;

  @Prop({ type: Types.ObjectId, ref: 'Beneficiary' })
  beneficiary?: Types.ObjectId | Beneficiary;

  @Prop({ type: Types.ObjectId, ref: 'Participant' })
  participant?: Types.ObjectId | Participant;

  @Prop({ type: String, enum: ResponseStatus, default: ResponseStatus.IN_PROGRESS })
  status: ResponseStatus;

  @Prop({ type: Date })
  startedAt?: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: Number })
  timeSpent?: number; // in seconds

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  location?: string;

  @Prop({ type: Number, min: 0, max: 100 })
  completionPercentage?: number;

  @Prop({ type: Object })
  metadata?: {
    deviceType?: string;
    browser?: string;
    os?: string;
    language?: string;
  };

  @Prop({ type: Object })
  customFields?: Record<string, any>;
}

export const SurveyResponseSchema = SchemaFactory.createForClass(SurveyResponse);

// Indexes
SurveyResponseSchema.index({ survey: 1 });
SurveyResponseSchema.index({ beneficiary: 1 });
SurveyResponseSchema.index({ participant: 1 });
SurveyResponseSchema.index({ status: 1 });
SurveyResponseSchema.index({ completedAt: -1 });
