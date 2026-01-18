import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '@modules/users/schemas/user.schema';

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum ProjectType {
  NEEDS_ASSESSMENT = 'needs_assessment',
  INTERVENTION = 'intervention',
  EVALUATION = 'evaluation',
  MIXED = 'mixed',
}

@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: ProjectType, required: true })
  type: ProjectType;

  @Prop({ type: String, enum: ProjectStatus, default: ProjectStatus.DRAFT })
  status: ProjectStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId | User;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  team: Types.ObjectId[] | User[];

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop()
  location?: string;

  @Prop({ type: [String], default: [] })
  targetGroups: string[];

  @Prop({ type: Object })
  budget?: {
    total: number;
    currency: string;
    spent?: number;
  };

  @Prop({ type: Object })
  goals?: {
    short_term: string[];
    long_term: string[];
  };

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Indexes
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ type: 1 });
ProjectSchema.index({ startDate: -1 });
ProjectSchema.index({ name: 'text', description: 'text' });
