import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Activity } from '@modules/activities/schemas/activity.schema';
import { Beneficiary } from './beneficiary.schema';

@Schema({ timestamps: true })
export class ActivityBeneficiary extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Beneficiary', required: true, index: true })
  beneficiary: Types.ObjectId | Beneficiary;

  @Prop({ type: Types.ObjectId, ref: 'Activity', required: true, index: true })
  activity: Types.ObjectId | Activity;

}

export const ActivityBeneficiarySchema = SchemaFactory.createForClass(ActivityBeneficiary);

// Unique compound index — a beneficiary can only be linked once per activity
ActivityBeneficiarySchema.index({ beneficiary: 1, activity: 1 }, { unique: true });
ActivityBeneficiarySchema.index({ activity: 1 });
ActivityBeneficiarySchema.index({ beneficiary: 1 });
