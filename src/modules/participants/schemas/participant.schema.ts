import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Beneficiary } from '@modules/beneficiaries/schemas/beneficiary.schema';

export enum ParticipantStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
  PENDING = 'pending',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Participant extends Document {
  /**
   * Optional reference to a Beneficiary:
   * - If beneficiary is Area type  → multiple participants reference that area
   * - If beneficiary is Individual → participant references the individual beneficiary
   */
  @Prop({ type: Types.ObjectId, ref: 'Beneficiary', index: true })
  beneficiary?: Types.ObjectId | Beneficiary;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ trim: true, lowercase: true, index: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true, unique: true, sparse: true })
  nationalId?: string;

  @Prop({ type: Number, min: 0 })
  age?: number;

  @Prop({ type: String, enum: Gender })
  gender?: Gender;

  @Prop({ trim: true })
  city?: string;

  /** Free-text field (was enum ParticipationType) */
  @Prop({ type: String })
  participationType?: string;

  @Prop({ type: String, enum: ParticipantStatus, default: ParticipantStatus.PENDING })
  status: ParticipantStatus;
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);

// Indexes
ParticipantSchema.index({ beneficiary: 1 });
ParticipantSchema.index({ city: 1, gender: 1 });
ParticipantSchema.index({ email: 1 }, { sparse: true });
ParticipantSchema.index({ nationalId: 1 }, { unique: true, sparse: true });
ParticipantSchema.index({ createdAt: -1 });
