import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Survey } from './survey.schema';
import { SurveyQuestion } from './survey-question.schema';
import { Beneficiary } from '@modules/beneficiaries/schemas/beneficiary.schema';

/**
 * Survey_Submissions — flat model representing ONE answer to ONE question
 * within a single respondent session.
 *
 * A full "response session" is identified by the combination of:
 *   (survey + beneficiary + startedAt)
 */

@Schema({ timestamps: true })
export class SurveySubmission extends Document {
  // ── Survey & Question references ────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'Survey', required: true, index: true })
  survey: Types.ObjectId | Survey;

  @Prop({ type: Types.ObjectId, ref: 'SurveyQuestion', required: true, index: true })
  question: Types.ObjectId | SurveyQuestion;

  // ── Respondent reference ─────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'Beneficiary', index: true })
  beneficiary?: Types.ObjectId | Beneficiary;

  // ── Session-level metadata ───────────────────────────────────────────────
  @Prop({ type: Date, default: Date.now })
  startedAt: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  // ── Typed answer value ───────────────────────────────────────────────────
  @Prop()
  textValue?: string;

  @Prop({ type: Number })
  numberValue?: number;

  @Prop({ type: Boolean })
  booleanValue?: boolean;

  @Prop({ type: Date })
  dateValue?: Date;

  // ── Assessment / scoring ─────────────────────────────────────────────────
  @Prop({ type: Boolean })
  isCorrect?: boolean;
}

export const SurveySubmissionSchema = SchemaFactory.createForClass(SurveySubmission);

// Indexes
SurveySubmissionSchema.index({ survey: 1, question: 1 });
SurveySubmissionSchema.index({ survey: 1, beneficiary: 1 });
SurveySubmissionSchema.index({ beneficiary: 1, survey: 1, startedAt: -1 });
