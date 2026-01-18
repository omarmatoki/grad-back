import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Beneficiary } from './schemas/beneficiary.schema';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';

@Injectable()
export class BeneficiariesService {
  constructor(
    @InjectModel(Beneficiary.name) private beneficiaryModel: Model<Beneficiary>,
  ) {}

  async create(createBeneficiaryDto: CreateBeneficiaryDto): Promise<Beneficiary> {
    const createdBeneficiary = new this.beneficiaryModel({
      ...createBeneficiaryDto,
      project: new Types.ObjectId(createBeneficiaryDto.project),
    });

    return createdBeneficiary.save();
  }

  async findAll(filters?: any): Promise<Beneficiary[]> {
    const query = filters || {};

    return this.beneficiaryModel
      .find(query)
      .populate('project', 'name description')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByProject(projectId: string): Promise<Beneficiary[]> {
    return this.beneficiaryModel
      .find({ project: new Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByType(beneficiaryType: string, projectId?: string): Promise<Beneficiary[]> {
    const query: any = { beneficiaryType };

    if (projectId) {
      query.project = new Types.ObjectId(projectId);
    }

    return this.beneficiaryModel
      .find(query)
      .populate('project', 'name description')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByLocation(city?: string, region?: string): Promise<Beneficiary[]> {
    const query: any = {};

    if (city) {
      query.city = city;
    }

    if (region) {
      query.region = region;
    }

    return this.beneficiaryModel
      .find(query)
      .populate('project', 'name description')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Beneficiary> {
    const beneficiary = await this.beneficiaryModel
      .findById(id)
      .populate('project', 'name description owner')
      .exec();

    if (!beneficiary) {
      throw new NotFoundException(`Beneficiary with ID ${id} not found`);
    }

    return beneficiary;
  }

  async update(id: string, updateBeneficiaryDto: UpdateBeneficiaryDto): Promise<Beneficiary> {
    const updateData: any = { ...updateBeneficiaryDto };

    // Convert project string to ObjectId if provided
    if (updateBeneficiaryDto.project) {
      updateData.project = new Types.ObjectId(updateBeneficiaryDto.project);
    }

    const updatedBeneficiary = await this.beneficiaryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('project', 'name description')
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

  async count(projectId?: string): Promise<number> {
    const query = projectId ? { project: new Types.ObjectId(projectId) } : {};
    return this.beneficiaryModel.countDocuments(query).exec();
  }

  async getStatistics(projectId?: string): Promise<any> {
    const matchStage = projectId
      ? { $match: { project: new Types.ObjectId(projectId) } }
      : { $match: {} };

    const statistics = await this.beneficiaryModel.aggregate([
      matchStage,
      {
        $group: {
          _id: '$beneficiaryType',
          count: { $sum: 1 },
          totalPopulation: { $sum: '$populationSize' },
        },
      },
    ]);

    const total = await this.count(projectId);

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
}
