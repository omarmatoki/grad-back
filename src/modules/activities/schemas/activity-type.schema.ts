import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '@modules/users/schemas/user.schema';

@Schema({ timestamps: true })
export class ActivityTypeEntity extends Document {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  value: string;

  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId | User;
}

export const ActivityTypeSchema = SchemaFactory.createForClass(ActivityTypeEntity);

ActivityTypeSchema.index({ value: 1 }, { unique: true });
ActivityTypeSchema.index({ label: 1 });
ActivityTypeSchema.index({ createdAt: -1 });
