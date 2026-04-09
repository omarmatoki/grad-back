import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SurveyQuestion } from './survey-question.schema';

/**
 * Survey_Correct_Answers — stores the expected correct answer for a question.
 * One question can have multiple accepted answers (e.g. partial credit).
 */
@Schema({ timestamps: true })
export class SurveyCorrectAnswer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'SurveyQuestion', required: true, index: true })
  question: Types.ObjectId | SurveyQuestion;

  // ── Typed correct-answer value (only one should be set per record) ───────
  @Prop()
  textValue?: string;

  @Prop({ type: Number })
  numberValue?: number;

  @Prop({ type: Boolean })
  booleanValue?: boolean;

  @Prop({ type: Date })
  dateValue?: Date;
}

export const SurveyCorrectAnswerSchema = SchemaFactory.createForClass(SurveyCorrectAnswer);

SurveyCorrectAnswerSchema.index({ question: 1 });
