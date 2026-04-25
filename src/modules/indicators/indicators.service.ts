import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Indicator, TrendDirection } from './schemas/indicator.schema';
import { IndicatorHistory } from './schemas/indicator-history.schema';
import { Project } from '@modules/projects/schemas/project.schema';
import { CreateIndicatorDto } from './dto/create-indicator.dto';
import { UpdateIndicatorDto } from './dto/update-indicator.dto';
import { RecordIndicatorValueDto } from './dto/record-indicator-value.dto';
import { UserRole } from '@modules/users/schemas/user.schema';

@Injectable()
export class IndicatorsService {
  constructor(
    @InjectModel(Indicator.name) private indicatorModel: Model<Indicator>,
    @InjectModel(IndicatorHistory.name) private indicatorHistoryModel: Model<IndicatorHistory>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
  ) {}

  private async getAccessibleIndicatorIds(userId: string): Promise<Types.ObjectId[]> {
    const projects = await this.projectModel
      .find({ user_id: userId })
      .select('indicators')
      .lean()
      .exec();
    const ids = projects.flatMap((p) => ((p as any).indicators ?? []) as Types.ObjectId[]);
    return ids.map((id) => new Types.ObjectId(id.toString()));
  }

  async create(createIndicatorDto: CreateIndicatorDto): Promise<Indicator> {
    return new this.indicatorModel({
      ...createIndicatorDto,
      trend: TrendDirection.NO_DATA,
    }).save();
  }

  async findAll(filters?: any, userId?: string, userRole?: UserRole): Promise<Indicator[]> {
    const query: any = {};
    if (filters?.indicatorType) query.indicatorType = filters.indicatorType;
    if (filters?.isActive !== undefined) query.isActive = filters.isActive;

    if (userRole === UserRole.STAFF && userId) {
      const allowedIds = await this.getAccessibleIndicatorIds(userId);
      query._id = { $in: allowedIds };
    }

    return this.indicatorModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findByProject(projectId: string, userId?: string, userRole?: UserRole): Promise<Indicator[]> {
    const project = await this.projectModel.findById(projectId).select('indicators user_id').lean().exec();
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    if (userRole === UserRole.STAFF && userId && project.user_id.toString() !== userId) {
      return [];
    }

    const indicatorIds: Types.ObjectId[] = ((project as any).indicators ?? []).map(
      (id: any) => new Types.ObjectId(id.toString()),
    );
    if (!indicatorIds.length) return [];

    return this.indicatorModel.find({ _id: { $in: indicatorIds } }).sort({ createdAt: -1 }).exec();
  }

  async findByType(
    indicatorType: string,
    userId?: string,
    userRole?: UserRole,
  ): Promise<Indicator[]> {
    const query: any = { indicatorType };

    if (userRole === UserRole.STAFF && userId) {
      const allowedIds = await this.getAccessibleIndicatorIds(userId);
      query._id = { $in: allowedIds };
    }

    return this.indicatorModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Indicator> {
    const indicator = await this.indicatorModel.findById(id).exec();
    if (!indicator) throw new NotFoundException(`Indicator ${id} not found`);
    return indicator;
  }

  async update(id: string, updateIndicatorDto: UpdateIndicatorDto): Promise<Indicator> {
    const updated = await this.indicatorModel
      .findByIdAndUpdate(id, updateIndicatorDto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException(`Indicator ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.indicatorModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Indicator ${id} not found`);
    await this.indicatorHistoryModel.deleteMany({ indicator: id }).exec();
  }

  async recordValue(
    indicatorId: string,
    recordValueDto: RecordIndicatorValueDto,
  ): Promise<IndicatorHistory> {
    const indicator = await this.findOne(indicatorId);
    const calculatedAt = recordValueDto.calculatedAt ?? new Date();

    const previousHistory = await this.indicatorHistoryModel
      .findOne({ indicator: indicatorId })
      .sort({ calculatedAt: -1 })
      .exec();

    const previousValue = previousHistory?.recordedValue;
    let changeAmount: number | undefined;
    let changePercentage: number | undefined;

    if (previousValue !== undefined) {
      changeAmount = recordValueDto.recordedValue - previousValue;
      changePercentage = (changeAmount / previousValue) * 100;
    }

    const historyEntry = new this.indicatorHistoryModel({
      indicator: new Types.ObjectId(indicatorId),
      recordedValue: recordValueDto.recordedValue,
      calculatedAt,
      source: recordValueDto.source,
      notes: recordValueDto.notes,
      measuredBy: recordValueDto.measuredBy,
      status: recordValueDto.status,
      context: recordValueDto.context,
      attachments: recordValueDto.attachments,
      metadata: recordValueDto.metadata,
      previousValue,
      changeAmount,
      changePercentage,
    });

    const savedHistory = await historyEntry.save();

    indicator.actualValue = recordValueDto.recordedValue;
    indicator.lastCalculatedAt = calculatedAt;
    indicator.trend = await this.calculateTrend(indicatorId);
    await indicator.save();

    return savedHistory;
  }

  async calculateTrend(indicatorId: string): Promise<TrendDirection> {
    const recentHistory = await this.indicatorHistoryModel
      .find({ indicator: indicatorId })
      .sort({ calculatedAt: -1 })
      .limit(5)
      .exec();

    if (recentHistory.length < 2) return TrendDirection.NO_DATA;

    const changes = recentHistory
      .filter((h) => h.changePercentage !== undefined)
      .map((h) => h.changePercentage!);

    if (!changes.length) return TrendDirection.NO_DATA;

    const avg = changes.reduce((s, v) => s + v, 0) / changes.length;
    if (avg >= 2) return TrendDirection.IMPROVING;
    if (avg <= -2) return TrendDirection.DECLINING;
    return TrendDirection.STABLE;
  }

  async getHistory(
    indicatorId: string,
    limit?: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<IndicatorHistory[]> {
    const query: any = { indicator: new Types.ObjectId(indicatorId) };
    if (startDate || endDate) {
      query.calculatedAt = {};
      if (startDate) query.calculatedAt.$gte = startDate;
      if (endDate) query.calculatedAt.$lte = endDate;
    }

    let q = this.indicatorHistoryModel.find(query).sort({ calculatedAt: -1 });
    if (limit) q = q.limit(limit);
    return q.exec();
  }

  async calculateFromFormula(indicatorId: string): Promise<number> {
    const indicator = await this.findOne(indicatorId);
    if (!indicator.calculationFormula) {
      throw new BadRequestException('Indicator does not have a calculation formula');
    }
    throw new BadRequestException('Formula calculation not yet implemented.');
  }

  async getStatistics(userId?: string, userRole?: UserRole): Promise<any> {
    const query: any = {};
    if (userRole === UserRole.STAFF && userId) {
      const allowedIds = await this.getAccessibleIndicatorIds(userId);
      query._id = { $in: allowedIds };
    }

    const total = await this.indicatorModel.countDocuments(query).exec();
    const active = await this.indicatorModel.countDocuments({ ...query, isActive: true }).exec();

    const allIndicators = await this.indicatorModel.find(query).select('actualValue targetValue').lean().exec();
    let onTrack = 0;
    let offTrack = 0;
    for (const ind of allIndicators) {
      const t = (ind as any).targetValue;
      const a = (ind as any).actualValue;
      if (t && a !== undefined) {
        if (a / t >= 0.7) onTrack++;
        else offTrack++;
      }
    }

    return { total, active, onTrack, offTrack };
  }

  async count(userId?: string, userRole?: UserRole): Promise<number> {
    const query: any = {};
    if (userRole === UserRole.STAFF && userId) {
      const allowedIds = await this.getAccessibleIndicatorIds(userId);
      query._id = { $in: allowedIds };
    }
    return this.indicatorModel.countDocuments(query).exec();
  }

  async findByTrend(
    trend: TrendDirection,
    userId?: string,
    userRole?: UserRole,
  ): Promise<Indicator[]> {
    const query: any = { trend };
    if (userRole === UserRole.STAFF && userId) {
      const allowedIds = await this.getAccessibleIndicatorIds(userId);
      query._id = { $in: allowedIds };
    }
    return this.indicatorModel.find(query).sort({ lastCalculatedAt: -1 }).exec();
  }

  async findOffTrack(threshold = 0.7, userId?: string, userRole?: UserRole): Promise<Indicator[]> {
    const query: any = {
      targetValue: { $exists: true, $ne: null },
      actualValue: { $exists: true, $ne: null },
    };
    if (userRole === UserRole.STAFF && userId) {
      const allowedIds = await this.getAccessibleIndicatorIds(userId);
      query._id = { $in: allowedIds };
    }
    const indicators = await this.indicatorModel.find(query).exec();
    return indicators.filter((ind) => ind.actualValue! / ind.targetValue! < threshold);
  }
}
