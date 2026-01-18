import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Beneficiary } from '@modules/beneficiaries/schemas/beneficiary.schema';
import { Project } from '@modules/projects/schemas/project.schema';

export enum ParticipantStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
  PENDING = 'pending',
}

export enum ParticipationType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  ONLINE = 'online',
  IN_PERSON = 'in_person',
  HYBRID = 'hybrid',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Participant extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Beneficiary', required: true, index: true })
  beneficiary: Types.ObjectId | Beneficiary;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  project: Types.ObjectId | Project;

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
  educationLevel?: string;

  @Prop({ trim: true })
  occupation?: string;

  @Prop({ trim: true, index: true })
  city?: string;

  @Prop({ type: String, enum: ParticipationType })
  participationType?: ParticipationType;

  @Prop({ type: Date, default: Date.now })
  registrationDate: Date;

  @Prop({ type: Number, default: 0, min: 0 })
  attendanceSessions: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalSessions: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  attendanceRate: number;

  @Prop({ type: Number, min: 0, max: 100 })
  preAssessmentScore?: number;

  @Prop({ type: Number, min: 0, max: 100 })
  postAssessmentScore?: number;

  @Prop({ type: Number })
  improvementPercentage?: number;

  @Prop({ type: String, enum: ParticipantStatus, default: ParticipantStatus.PENDING })
  status: ParticipantStatus;
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);

// Compound Indexes
ParticipantSchema.index({ project: 1, status: 1 });
ParticipantSchema.index({ beneficiary: 1, project: 1 });
ParticipantSchema.index({ city: 1, gender: 1 });
ParticipantSchema.index({ registrationDate: -1 });
ParticipantSchema.index({ email: 1 }, { sparse: true });
ParticipantSchema.index({ nationalId: 1 }, { unique: true, sparse: true });

// Virtual field for full attendance stats
ParticipantSchema.virtual('attendanceStats').get(function() {
  return {
    attended: this.attendanceSessions,
    total: this.totalSessions,
    rate: this.attendanceRate,
  };
});

// Pre-save middleware to calculate attendance rate
ParticipantSchema.pre('save', function(next) {
  if (this.totalSessions > 0) {
    this.attendanceRate = Number(((this.attendanceSessions / this.totalSessions) * 100).toFixed(2));
  } else {
    this.attendanceRate = 0;
  }
  next();
});

// Pre-save middleware to calculate improvement percentage
ParticipantSchema.pre('save', function(next) {
  if (this.preAssessmentScore !== undefined && this.postAssessmentScore !== undefined) {
    if (this.preAssessmentScore === 0) {
      this.improvementPercentage = this.postAssessmentScore;
    } else {
      this.improvementPercentage = Number(
        (((this.postAssessmentScore - this.preAssessmentScore) / this.preAssessmentScore) * 100).toFixed(2)
      );
    }
  }
  next();
});
