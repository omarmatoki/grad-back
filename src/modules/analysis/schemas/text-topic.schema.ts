import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TextAnalysis } from './text-analysis.schema';
import { Topic } from './topic.schema';

@Schema({ timestamps: true })
export class TextTopic extends Document {
  @Prop({ type: Types.ObjectId, ref: 'TextAnalysis', required: true })
  textAnalysis: Types.ObjectId | TextAnalysis;

  @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
  topic: Types.ObjectId | Topic;

  @Prop({ type: Number, min: 0, max: 1, required: true })
  relevance: number; // How relevant this topic is to the text (0-1)

  @Prop({ type: Number, min: 0, max: 1 })
  confidence?: number; // AI confidence in this association

  @Prop({ type: [String], default: [] })
  mentionedKeywords: string[]; // Which keywords from topic appear in text

  @Prop({ type: Number, default: 1 })
  mentionCount: number; // How many times topic is mentioned

  @Prop({ type: [Object], default: [] })
  positions?: Array<{
    start: number;
    end: number;
    context: string;
  }>;

  @Prop()
  excerpt?: string; // Sample text showing topic relevance

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const TextTopicSchema = SchemaFactory.createForClass(TextTopic);

// Compound index for uniqueness
TextTopicSchema.index({ textAnalysis: 1, topic: 1 }, { unique: true });
TextTopicSchema.index({ textAnalysis: 1 });
TextTopicSchema.index({ topic: 1 });
TextTopicSchema.index({ relevance: -1 });
