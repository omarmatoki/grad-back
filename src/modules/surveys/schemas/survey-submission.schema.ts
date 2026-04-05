import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Survey } from './survey.schema';
import { SurveyQuestion } from './survey-question.schema';
import { Beneficiary } from '@modules/beneficiaries/schemas/beneficiary.schema';
import { Participant } from '@modules/participants/schemas/participant.schema';

/**
 * Survey_Submissions — flat model representing ONE answer to ONE question
 * within a single respondent session.
 *
 * A full "response session" is identified by the combination of:
 *   (survey + participant/beneficiary + startedAt)
 *
 * This merges the former SurveyResponse + SurveyAnswer collections into a
 * single document, matching the new relational schema spec.
 */

export enum SubmissionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

export enum SubmissionValueType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ARRAY = 'array',
  OBJECT = 'object',
}

@Schema({ timestamps: true })
export class SurveySubmission extends Document {
  // ── Survey & Question references ────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'Survey', required: true, index: true })
  survey: Types.ObjectId | Survey;

  @Prop({ type: Types.ObjectId, ref: 'SurveyQuestion', required: true, index: true })
  question: Types.ObjectId | SurveyQuestion;

  // ── Respondent references (at least one should be set) ──────────────────
  @Prop({ type: Types.ObjectId, ref: 'Beneficiary', index: true })
  beneficiary?: Types.ObjectId | Beneficiary;

  @Prop({ type: Types.ObjectId, ref: 'Participant', index: true })
  participant?: Types.ObjectId | Participant;

  // ── Session-level metadata (repeated per question row) ──────────────────
  @Prop({ type: String, enum: Object.values(SubmissionStatus), default: SubmissionStatus.IN_PROGRESS })
  status: SubmissionStatus;

  @Prop({ type: Date, default: Date.now })
  startedAt: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  /** Time spent on THIS specific question in seconds */
  @Prop({ type: Number, min: 0 })
  timeSpent?: number;

  /** Overall completion % of the parent session (0–100) */
  @Prop({ type: Number, min: 0, max: 100 })
  completionPercentage?: number;

  // ── Typed answer value ───────────────────────────────────────────────────
  @Prop({ type: String, enum: Object.values(SubmissionValueType), required: true })
  valueType: SubmissionValueType;

  @Prop()
  textValue?: string;

  @Prop({ type: Number })
  numberValue?: number;

  @Prop({ type: Boolean })
  booleanValue?: boolean;

  @Prop({ type: Date })
  dateValue?: Date;

  @Prop({ type: [String] })
  arrayValue?: string[];

  @Prop({ type: Object })
  objectValue?: Record<string, any>;

  // ── Assessment / scoring ─────────────────────────────────────────────────
  @Prop({ default: false })
  isSkipped: boolean;

  @Prop({ type: Boolean })
  isCorrect?: boolean;

  @Prop({ type: Number, min: 0 })
  scoreAwarded?: number;
}

export const SurveySubmissionSchema = SchemaFactory.createForClass(SurveySubmission);

// Indexes
SurveySubmissionSchema.index({ survey: 1, question: 1 });
SurveySubmissionSchema.index({ survey: 1, participant: 1 });
SurveySubmissionSchema.index({ survey: 1, beneficiary: 1 });
SurveySubmissionSchema.index({ participant: 1, survey: 1, startedAt: -1 });
SurveySubmissionSchema.index({ status: 1 });
SurveySubmissionSchema.index({ completedAt: -1 });
