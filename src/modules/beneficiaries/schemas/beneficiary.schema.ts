import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum BeneficiaryType {
  INDIVIDUAL = 'individual',
  AREA = 'area',
}

@Schema({ timestamps: true })
export class Beneficiary extends Document {
  @Prop({
    type: String,
    enum: Object.values(BeneficiaryType),
    required: true,
    index: true,
  })
  beneficiaryType: BeneficiaryType;

  @Prop({ required: true, trim: true })
  name: string;

  // ── Individual-specific fields ──────────────────────────────────────────────
  @Prop({ type: Number, min: 0 })
  age?: number;

  @Prop({ trim: true })
  educationLevel?: string;

  @Prop({ trim: true })
  profession?: string;

  @Prop({ type: String })
  gender?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  nationalId?: string;

  // ── Area-specific fields ────────────────────────────────────────────────────
  @Prop({ type: Number, min: 0 })
  areaSize?: number; // in km² or relevant unit

  @Prop({ type: Number, min: 0 })
  population?: number;

  // ── Shared location fields ──────────────────────────────────────────────────
  @Prop({ trim: true, index: true })
  city?: string;

  @Prop({ trim: true, index: true })
  region?: string;

  @Prop({ type: String })
  notes?: string;
}

export const BeneficiarySchema = SchemaFactory.createForClass(Beneficiary);

// Compound Indexes
BeneficiarySchema.index({ beneficiaryType: 1 });
BeneficiarySchema.index({ city: 1, region: 1 });
BeneficiarySchema.index({ createdAt: -1 });
