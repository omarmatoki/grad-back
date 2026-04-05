import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Project } from '@modules/projects/schemas/project.schema';
import { SurveySubmission } from '@modules/surveys/schemas/survey-submission.schema';
import { ActivityParticipant } from '@modules/participants/schemas/activity-participant.schema';

export enum SentimentType {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
}

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class TextAnalysis extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  project: Types.ObjectId | Project;

  /**
   * FK → Survey_Submissions.submission_id
   * Replaces the old `surveyAnswer` ref (which pointed at the former SurveyAnswer collection).
   */
  @Prop({ type: Types.ObjectId, ref: 'SurveySubmission', index: true })
  surveyAnswer?: Types.ObjectId | SurveySubmission;

  /**
   * FK → Activity_Participants.id
   */
  @Prop({ type: Types.ObjectId, ref: 'ActivityParticipant', index: true })
  activityParticipant?: Types.ObjectId | ActivityParticipant;

  @Prop({ required: true })
  originalText: string;

  @Prop()
  cleanedText?: string;

  @Prop({ type: String, enum: Object.values(SentimentType) })
  sentiment?: SentimentType;

  @Prop({ type: Number, min: -1, max: 1 })
  sentimentScore?: number;

  @Prop({ type: Number, min: 0, max: 1 })
  sentimentConfidence?: number;

  @Prop({ type: [Object], default: [] })
  keywords: Array<{ word: string; frequency?: number; relevance?: number }>;

  @Prop({ type: [Object], default: [] })
  entities: Array<{ text: string; type?: string; relevance?: number }>;

  @Prop()
  summary?: string;

  @Prop({ type: String, enum: Object.values(AnalysisStatus), default: AnalysisStatus.PENDING })
  status: AnalysisStatus;

  @Prop({ type: Date })
  analyzedAt?: Date;

  @Prop()
  errorMessage?: string;

  @Prop({ type: Object })
  n8nResponse?: Record<string, any>;
}

export const TextAnalysisSchema = SchemaFactory.createForClass(TextAnalysis);

TextAnalysisSchema.index({ project: 1 });
TextAnalysisSchema.index({ surveyAnswer: 1 });
TextAnalysisSchema.index({ activityParticipant: 1 });
TextAnalysisSchema.index({ sentiment: 1 });
TextAnalysisSchema.index({ status: 1 });
TextAnalysisSchema.index({ analyzedAt: -1 });
