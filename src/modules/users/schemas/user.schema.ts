import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: String, enum: Object.values(UserRole), default: UserRole.STAFF })
  role: UserRole;

  @Prop({ type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop()
  phone?: string;

  // Timestamps (createdAt, updatedAt) added automatically by timestamps: true
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });
