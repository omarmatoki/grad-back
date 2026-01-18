import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SurveyResponse } from './survey-response.schema';
import { SurveyQuestion } from './survey-question.schema';

export enum AnswerValueType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ARRAY = 'array',
  OBJECT = 'object',
}

@Schema({ timestamps: true })
export class SurveyAnswer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'SurveyResponse', required: true })
  surveyResponse: Types.ObjectId | SurveyResponse;

  @Prop({ type: Types.ObjectId, ref: 'SurveyQuestion', required: true })
  question: Types.ObjectId | SurveyQuestion;

  @Prop({ type: String, enum: AnswerValueType, required: true })
  valueType: AnswerValueType;

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

  @Prop()
  fileUrl?: string; // For file upload questions

  @Prop({ type: Number })
  timeSpent?: number; // Time spent on this specific question (seconds)

  @Prop({ type: Number })
  revisionCount?: number; // How many times answer was changed

  @Prop({ default: false })
  isSkipped: boolean;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const SurveyAnswerSchema = SchemaFactory.createForClass(SurveyAnswer);

// Indexes
SurveyAnswerSchema.index({ surveyResponse: 1 });
SurveyAnswerSchema.index({ question: 1 });
SurveyAnswerSchema.index({ surveyResponse: 1, question: 1 }, { unique: true });
SurveyAnswerSchema.index({ valueType: 1 });
