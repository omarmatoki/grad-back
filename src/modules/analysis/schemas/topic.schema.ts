import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Project } from '@modules/projects/schemas/project.schema';

@Schema({ timestamps: true })
export class Topic extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  project: Types.ObjectId | Project;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  keywords: string[];

  @Prop({ type: Number, default: 0 })
  frequency: number; // How many times this topic appears

  @Prop({ type: Number, min: 0, max: 1 })
  relevanceScore?: number;

  @Prop()
  category?: string;

  @Prop({ type: [String], default: [] })
  relatedTopics: string[];

  @Prop({ type: String, enum: ['positive', 'negative', 'neutral', 'mixed'] })
  overallSentiment?: string;

  @Prop({ type: Number, min: -1, max: 1 })
  averageSentiment?: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  statistics?: {
    totalMentions: number;
    uniqueSources: number;
    firstSeenAt?: Date;
    lastSeenAt?: Date;
  };

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);

// Indexes
TopicSchema.index({ project: 1 });
TopicSchema.index({ name: 1 });
TopicSchema.index({ frequency: -1 });
TopicSchema.index({ relevanceScore: -1 });
TopicSchema.index({ project: 1, name: 1 }, { unique: true });
