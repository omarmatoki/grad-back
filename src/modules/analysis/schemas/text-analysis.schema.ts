import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Project } from '@modules/projects/schemas/project.schema';
import { SurveyAnswer } from '@modules/surveys/schemas/survey-answer.schema';
import { ActivityParticipant } from '@modules/participants/schemas/activity-participant.schema';

export enum SentimentType {
  VERY_NEGATIVE = 'very_negative',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  POSITIVE = 'positive',
  VERY_POSITIVE = 'very_positive',
}

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class TextAnalysis extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Project' })
  project?: Types.ObjectId | Project;

  @Prop({ type: Types.ObjectId, ref: 'SurveyAnswer' })
  surveyAnswer?: Types.ObjectId | SurveyAnswer;

  @Prop({ type: Types.ObjectId, ref: 'ActivityParticipant' })
  activityParticipant?: Types.ObjectId | ActivityParticipant;

  @Prop({ required: true })
  originalText: string;

  @Prop()
  cleanedText?: string;

  @Prop({ type: String, enum: SentimentType })
  sentiment?: SentimentType;

  @Prop({ type: Number, min: -1, max: 1 })
  sentimentScore?: number; // -1 (very negative) to 1 (very positive)

  @Prop({ type: Number, min: 0, max: 1 })
  sentimentConfidence?: number;

  @Prop({ type: [String], default: [] })
  keywords: string[];

  @Prop({ type: [String], default: [] })
  entities: string[]; // Named entities (people, places, organizations)

  @Prop({ type: [Object], default: [] })
  themes?: Array<{
    name: string;
    relevance: number;
    keywords: string[];
  }>;

  @Prop({ type: Object })
  emotions?: {
    joy?: number;
    sadness?: number;
    anger?: number;
    fear?: number;
    surprise?: number;
    trust?: number;
  };

  @Prop()
  summary?: string;

  @Prop({ type: [String], default: [] })
  actionItems: string[];

  @Prop()
  language?: string;

  @Prop({ type: Number })
  wordCount?: number;

  @Prop({ type: Number })
  characterCount?: number;

  @Prop({ type: String, enum: AnalysisStatus, default: AnalysisStatus.PENDING })
  status: AnalysisStatus;

  @Prop({ type: Date })
  analyzedAt?: Date;

  @Prop()
  errorMessage?: string;

  @Prop({ type: Object })
  n8nResponse?: Record<string, any>; // Raw response from n8n

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const TextAnalysisSchema = SchemaFactory.createForClass(TextAnalysis);

// Indexes
TextAnalysisSchema.index({ project: 1 });
TextAnalysisSchema.index({ surveyAnswer: 1 });
TextAnalysisSchema.index({ activityParticipant: 1 });
TextAnalysisSchema.index({ sentiment: 1 });
TextAnalysisSchema.index({ status: 1 });
TextAnalysisSchema.index({ analyzedAt: -1 });
