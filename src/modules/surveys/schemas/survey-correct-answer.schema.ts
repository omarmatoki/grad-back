import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SurveyQuestion } from './survey-question.schema';
import { SubmissionValueType } from './survey-submission.schema';

/**
 * Survey_Correct_Answers — stores the expected correct answer for a question.
 * One question can have multiple accepted answers (e.g. partial credit).
 * Extracted from the former SurveyQuestion.correctAnswer / .points fields.
 */
@Schema({ timestamps: true })
export class SurveyCorrectAnswer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'SurveyQuestion', required: true, index: true })
  question: Types.ObjectId | SurveyQuestion;

  @Prop({ type: String, enum: Object.values(SubmissionValueType), required: true })
  valueType: SubmissionValueType;

  // ── Typed correct-answer value (only one should be set per record) ───────
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

  /** Points awarded when this correct answer is matched */
  @Prop({ type: Number, min: 0, default: 1 })
  scoreWeight: number;
}

export const SurveyCorrectAnswerSchema = SchemaFactory.createForClass(SurveyCorrectAnswer);

SurveyCorrectAnswerSchema.index({ question: 1 });
