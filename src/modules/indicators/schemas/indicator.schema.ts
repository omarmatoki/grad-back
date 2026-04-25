import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum IndicatorType {
  INPUT = 'input',
  OUTPUT = 'output',
  OUTCOME = 'outcome',
  IMPACT = 'impact',
  PROCESS = 'process',
  CUSTOM = 'custom',
}

export enum MeasurementUnit {
  NUMBER = 'number',
  PERCENTAGE = 'percentage',
  CURRENCY = 'currency',
  HOURS = 'hours',
  DAYS = 'days',
  SCORE = 'score',
  RATING = 'rating',
  CUSTOM = 'custom',
}

export enum TrendDirection {
  IMPROVING = 'improving',
  STABLE = 'stable',
  DECLINING = 'declining',
  NO_DATA = 'no_data',
}

@Schema({ timestamps: true })
export class Indicator extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: IndicatorType, required: true })
  indicatorType: IndicatorType;

  @Prop({ trim: true })
  measurementMethod?: string;

  @Prop({ type: Number })
  targetValue?: number;

  @Prop({ type: Number })
  actualValue?: number;

  @Prop({ type: String, enum: MeasurementUnit })
  unit?: MeasurementUnit;

  @Prop()
  customUnit?: string;

  @Prop({ type: String })
  calculationFormula?: string;

  @Prop({ type: Number })
  baselineValue?: number;

  @Prop({
    type: String,
    enum: TrendDirection,
    default: TrendDirection.NO_DATA,
  })
  trend: TrendDirection;

  @Prop({ type: Date })
  lastCalculatedAt?: Date;

  @Prop()
  frequency?: string;

  @Prop()
  responsiblePerson?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object })
  thresholds?: {
    critical?: number;
    warning?: number;
    good?: number;
    excellent?: number;
  };

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  get achievementRate(): number | undefined {
    if (this.targetValue && this.actualValue !== undefined) {
      return (this.actualValue / this.targetValue) * 100;
    }
    return undefined;
  }
}

export const IndicatorSchema = SchemaFactory.createForClass(Indicator);

IndicatorSchema.index({ indicatorType: 1 });
IndicatorSchema.index({ isActive: 1 });
IndicatorSchema.index({ lastCalculatedAt: -1 });
IndicatorSchema.index({ name: 'text', description: 'text' });
