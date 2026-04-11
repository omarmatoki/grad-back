import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '@modules/users/schemas/user.schema';

@Schema({ timestamps: true })
export class ProjectTypeEntity extends Document {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  value: string;

  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId | User;
}

export const ProjectTypeSchema = SchemaFactory.createForClass(ProjectTypeEntity);

ProjectTypeSchema.index({ value: 1 }, { unique: true });
ProjectTypeSchema.index({ label: 1 });
ProjectTypeSchema.index({ createdAt: -1 });
