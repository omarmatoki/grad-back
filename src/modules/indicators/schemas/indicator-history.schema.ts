import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Indicator } from './indicator.schema';

export enum MeasurementStatus {
  RECORDED = 'recorded',
  VERIFIED = 'verified',
  ADJUSTED = 'adjusted',
  DELETED = 'deleted',
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class IndicatorHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Indicator', required: true, index: true })
  indicator: Types.ObjectId | Indicator;

  @Prop({ type: Number, required: true })
  recordedValue: number;

  @Prop({ type: Date, required: true, index: true })
  calculatedAt: Date;

  @Prop({ trim: true })
  source?: string;

  @Prop({ type: String })
  notes?: string;

  // Additional useful fields
  @Prop()
  measuredBy?: string;

  @Prop({ type: String, enum: MeasurementStatus, default: MeasurementStatus.RECORDED })
  status: MeasurementStatus;

  @Prop({ type: Number })
  previousValue?: number;

  @Prop({ type: Number })
  changeAmount?: number; // Absolute change

  @Prop({ type: Number })
  changePercentage?: number; // Percentage change

  @Prop({ type: Object })
  context?: {
    activity?: string;
    survey?: string;
    event?: string;
    period?: string;
  };

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop()
  verifiedBy?: string;

  @Prop({ type: Date })
  verifiedAt?: Date;

  @Prop({ type: Object })
  adjustmentReason?: {
    reason: string;
    adjustedBy: string;
    adjustedAt: Date;
    originalValue: number;
  };

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const IndicatorHistorySchema = SchemaFactory.createForClass(IndicatorHistory);

// Indexes
IndicatorHistorySchema.index({ indicator: 1, calculatedAt: -1 });
IndicatorHistorySchema.index({ indicator: 1 });
IndicatorHistorySchema.index({ calculatedAt: -1 });
IndicatorHistorySchema.index({ status: 1 });
IndicatorHistorySchema.index({ createdAt: -1 });
