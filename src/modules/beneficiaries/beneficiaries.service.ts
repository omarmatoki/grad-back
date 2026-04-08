import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Beneficiary } from './schemas/beneficiary.schema';
import { ActivityBeneficiary } from './schemas/activity-beneficiary.schema';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';
import { CreateActivityBeneficiaryDto } from './dto/create-activity-beneficiary.dto';

@Injectable()
export class BeneficiariesService {
  constructor(
    @InjectModel(Beneficiary.name) private beneficiaryModel: Model<Beneficiary>,
    @InjectModel(ActivityBeneficiary.name) private activityBeneficiaryModel: Model<ActivityBeneficiary>,
  ) {}

  // ── Beneficiary CRUD ──────────────────────────────────────────────────────

  async create(createBeneficiaryDto: CreateBeneficiaryDto): Promise<Beneficiary> {
    const createdBeneficiary = new this.beneficiaryModel(createBeneficiaryDto);
    return createdBeneficiary.save();
  }

  async findAll(filters?: any): Promise<Beneficiary[]> {
    const query = filters || {};
    return this.beneficiaryModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByType(beneficiaryType: string): Promise<Beneficiary[]> {
    return this.beneficiaryModel
      .find({ beneficiaryType })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByLocation(city?: string, region?: string): Promise<Beneficiary[]> {
    const query: any = {};
    if (city) query.city = city;
    if (region) query.region = region;

    return this.beneficiaryModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Beneficiary> {
    const beneficiary = await this.beneficiaryModel.findById(id).exec();

    if (!beneficiary) {
      throw new NotFoundException(`Beneficiary with ID ${id} not found`);
    }

    return beneficiary;
  }

  async update(id: string, updateBeneficiaryDto: UpdateBeneficiaryDto): Promise<Beneficiary> {
    const updatedBeneficiary = await this.beneficiaryModel
      .findByIdAndUpdate(id, updateBeneficiaryDto, { new: true })
      .exec();

    if (!updatedBeneficiary) {
      throw new NotFoundException(`Beneficiary with ID ${id} not found`);
    }

    return updatedBeneficiary;
  }

  async remove(id: string): Promise<void> {
    const result = await this.beneficiaryModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Beneficiary with ID ${id} not found`);
    }
  }

  async count(filters?: any): Promise<number> {
    return this.beneficiaryModel.countDocuments(filters || {}).exec();
  }

  async getStatistics(): Promise<any> {
    const statistics = await this.beneficiaryModel.aggregate([
      {
        $group: {
          _id: '$beneficiaryType',
          count: { $sum: 1 },
          totalPopulation: { $sum: '$population' },
        },
      },
    ]);

    const total = await this.count();

    return {
      total,
      byType: statistics.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          totalPopulation: stat.totalPopulation || 0,
        };
        return acc;
      }, {}),
    };
  }

  // ── Activity-Beneficiary junction ─────────────────────────────────────────

  async linkToActivity(dto: CreateActivityBeneficiaryDto): Promise<ActivityBeneficiary> {
    // Verify beneficiary exists
    await this.findOne(dto.beneficiary);

    const existing = await this.activityBeneficiaryModel.findOne({
      beneficiary: new Types.ObjectId(dto.beneficiary),
      activity: new Types.ObjectId(dto.activity),
    });

    if (existing) {
      throw new ConflictException('Beneficiary is already linked to this activity');
    }

    const link = new this.activityBeneficiaryModel({
      beneficiary: new Types.ObjectId(dto.beneficiary),
      activity: new Types.ObjectId(dto.activity),
      interactionLevel: dto.interactionLevel,
      participationDegree: dto.participationDegree,
      satisfactionRating: dto.satisfactionRating,
      notes: dto.notes,
    });

    return link.save();
  }

  async unlinkFromActivity(beneficiaryId: string, activityId: string): Promise<void> {
    const result = await this.activityBeneficiaryModel.findOneAndDelete({
      beneficiary: new Types.ObjectId(beneficiaryId),
      activity: new Types.ObjectId(activityId),
    });

    if (!result) {
      throw new NotFoundException('Link between beneficiary and activity not found');
    }
  }

  async findByActivity(activityId: string): Promise<ActivityBeneficiary[]> {
    return this.activityBeneficiaryModel
      .find({ activity: new Types.ObjectId(activityId) })
      .populate('beneficiary')
      .exec();
  }

  async findActivitiesOfBeneficiary(beneficiaryId: string): Promise<ActivityBeneficiary[]> {
    return this.activityBeneficiaryModel
      .find({ beneficiary: new Types.ObjectId(beneficiaryId) })
      .populate('activity', 'title activityDate status activityType')
      .exec();
  }

  async updateLink(
    beneficiaryId: string,
    activityId: string,
    updates: Partial<CreateActivityBeneficiaryDto>,
  ): Promise<ActivityBeneficiary> {
    const link = await this.activityBeneficiaryModel.findOneAndUpdate(
      {
        beneficiary: new Types.ObjectId(beneficiaryId),
        activity: new Types.ObjectId(activityId),
      },
      updates,
      { new: true },
    );

    if (!link) {
      throw new NotFoundException('Link between beneficiary and activity not found');
    }

    return link;
  }
}
