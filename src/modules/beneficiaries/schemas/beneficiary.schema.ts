import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Project } from '../../projects/schemas/project.schema';

export enum BeneficiaryType {
  PERSON = 'person',
  AREA = 'area',
  GROUP = 'group',
}

@Schema({ timestamps: true })
export class Beneficiary extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  project: Types.ObjectId | Project;

  @Prop({
    type: String,
    enum: BeneficiaryType,
    required: true,
    index: true,
  })
  beneficiaryType: BeneficiaryType;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, index: true })
  city?: string;

  @Prop({ trim: true, index: true })
  region?: string;

  @Prop({ type: Number, min: 0 })
  populationSize?: number;

  @Prop({ type: String })
  notes?: string;
}

export const BeneficiarySchema = SchemaFactory.createForClass(Beneficiary);

// Compound Indexes
BeneficiarySchema.index({ project: 1, beneficiaryType: 1 });
BeneficiarySchema.index({ city: 1, region: 1 });
BeneficiarySchema.index({ createdAt: -1 });
