import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Survey } from './survey.schema';

export enum QuestionType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  EMAIL = 'email',
  PHONE = 'phone',
  DATE = 'date',
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  DROPDOWN = 'dropdown',
  RATING = 'rating',
  SCALE = 'scale',
  MATRIX = 'matrix',
  FILE_UPLOAD = 'file_upload',
  YES_NO = 'yes_no',
}

@Schema({ timestamps: true })
export class SurveyQuestion extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Survey', required: true })
  survey: Types.ObjectId | Survey;

  @Prop({ required: true })
  questionText: string;

  @Prop({ type: String, enum: QuestionType, required: true })
  type: QuestionType;

  @Prop({ default: false })
  isRequired: boolean;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  options: string[]; // For choice-based questions

  @Prop({ type: Object })
  conditional?: {
    dependsOn?: string; // Question ID
    showIf?: any; // Condition value
  };

  @Prop({ type: [String], default: [] })
  tags?: string[];
}

export const SurveyQuestionSchema = SchemaFactory.createForClass(SurveyQuestion);

// Indexes
SurveyQuestionSchema.index({ survey: 1 });
SurveyQuestionSchema.index({ type: 1 });
