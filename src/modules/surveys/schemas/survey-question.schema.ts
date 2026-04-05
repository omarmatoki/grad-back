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

  @Prop({ required: true })
  order: number;

  @Prop({ default: false })
  isRequired: boolean;

  @Prop()
  description?: string;

  @Prop()
  placeholder?: string;

  @Prop({ type: [String], default: [] })
  options: string[]; // For choice-based questions

  @Prop({ type: Object })
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    errorMessage?: string;
  };

  @Prop({ type: Object })
  ratingConfig?: {
    min: number;
    max: number;
    minLabel?: string;
    maxLabel?: string;
    step?: number;
  };

  @Prop({ type: Object })
  matrixConfig?: {
    rows: string[];
    columns: string[];
  };

  @Prop({ type: Object })
  conditional?: {
    dependsOn?: string; // Question ID
    showIf?: any; // Condition value
  };

  @Prop()
  category?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object })
  customFields?: Record<string, any>;
}

export const SurveyQuestionSchema = SchemaFactory.createForClass(SurveyQuestion);

// Indexes
SurveyQuestionSchema.index({ survey: 1, order: 1 });
SurveyQuestionSchema.index({ survey: 1 });
SurveyQuestionSchema.index({ type: 1 });
