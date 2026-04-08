import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Participant } from './schemas/participant.schema';
import { ActivityParticipant } from './schemas/activity-participant.schema';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { CreateActivityParticipantDto } from './dto/create-activity-participant.dto';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectModel(Participant.name) private participantModel: Model<Participant>,
    @InjectModel(ActivityParticipant.name) private activityParticipantModel: Model<ActivityParticipant>,
  ) {}

  // ── Participant CRUD ──────────────────────────────────────────────────────

  async create(createParticipantDto: CreateParticipantDto): Promise<Participant> {
    const createdParticipant = new this.participantModel(createParticipantDto);
    return createdParticipant.save();
  }

  async findAll(filters?: any): Promise<Participant[]> {
    return this.participantModel
      .find(filters || {})
      .populate('beneficiary', 'name beneficiaryType city region')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Participant> {
    const participant = await this.participantModel
      .findById(id)
      .populate('beneficiary', 'name beneficiaryType city region')
      .exec();

    if (!participant) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }

    return participant;
  }

  async findByBeneficiary(beneficiaryId: string): Promise<Participant[]> {
    return this.participantModel
      .find({ beneficiary: beneficiaryId })
      .populate('beneficiary', 'name beneficiaryType city region')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, updateParticipantDto: UpdateParticipantDto): Promise<Participant> {
    const updated = await this.participantModel
      .findByIdAndUpdate(id, updateParticipantDto, { new: true })
      .populate('beneficiary', 'name beneficiaryType city region')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.participantModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }
  }

  // ── Activity-Participant junction ─────────────────────────────────────────

  async linkToActivity(dto: CreateActivityParticipantDto): Promise<ActivityParticipant> {
    // Verify participant exists
    await this.findOne(dto.participant);

    const existing = await this.activityParticipantModel.findOne({
      participant: new Types.ObjectId(dto.participant),
      activity: new Types.ObjectId(dto.activity),
    });

    if (existing) {
      throw new ConflictException('Participant is already linked to this activity');
    }

    const link = new this.activityParticipantModel({
      participant: new Types.ObjectId(dto.participant),
      activity: new Types.ObjectId(dto.activity),
    });

    return link.save();
  }

  async unlinkFromActivity(participantId: string, activityId: string): Promise<void> {
    const result = await this.activityParticipantModel.findOneAndDelete({
      participant: new Types.ObjectId(participantId),
      activity: new Types.ObjectId(activityId),
    });

    if (!result) {
      throw new NotFoundException('Link between participant and activity not found');
    }
  }

  async findByActivity(activityId: string): Promise<ActivityParticipant[]> {
    return this.activityParticipantModel
      .find({ activity: new Types.ObjectId(activityId) })
      .populate('participant')
      .exec();
  }

  async findActivitiesOfParticipant(participantId: string): Promise<ActivityParticipant[]> {
    return this.activityParticipantModel
      .find({ participant: new Types.ObjectId(participantId) })
      .populate('activity', 'title activityDate status activityType')
      .exec();
  }

  async getStatistics(): Promise<any> {
    const total = await this.participantModel.countDocuments();
    const byStatus = await this.participantModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byGender = await this.participantModel.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } },
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, s) => { acc[s._id || 'unknown'] = s.count; return acc; }, {}),
      byGender: byGender.reduce((acc, g) => { acc[g._id || 'unknown'] = g.count; return acc; }, {}),
    };
  }
}
