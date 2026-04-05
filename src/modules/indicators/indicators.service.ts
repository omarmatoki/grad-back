import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Indicator, TrendDirection } from './schemas/indicator.schema';
import { IndicatorHistory } from './schemas/indicator-history.schema';
import { CreateIndicatorDto } from './dto/create-indicator.dto';
import { UpdateIndicatorDto } from './dto/update-indicator.dto';
import { RecordIndicatorValueDto } from './dto/record-indicator-value.dto';

@Injectable()
export class IndicatorsService {
  constructor(
    @InjectModel(Indicator.name) private indicatorModel: Model<Indicator>,
    @InjectModel(IndicatorHistory.name)
    private indicatorHistoryModel: Model<IndicatorHistory>,
  ) {}

  async create(createIndicatorDto: CreateIndicatorDto): Promise<Indicator> {
    const createdIndicator = new this.indicatorModel({
      ...createIndicatorDto,
      project: new Types.ObjectId(createIndicatorDto.project),
      trend: TrendDirection.NO_DATA,
    });

    return createdIndicator.save();
  }

  async findAll(filters?: any): Promise<Indicator[]> {
    const query = filters || {};

    return this.indicatorModel
      .find(query)
      .populate('project', 'name description')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByProject(projectId: string): Promise<Indicator[]> {
    return this.indicatorModel
      .find({ project: new Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByType(indicatorType: string, projectId?: string): Promise<Indicator[]> {
    const query: any = { indicatorType };

    if (projectId) {
      query.project = new Types.ObjectId(projectId);
    }

    return this.indicatorModel
      .find(query)
      .populate('project', 'name description')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Indicator> {
    const indicator = await this.indicatorModel
      .findById(id)
      .populate('project', 'name description owner')
      .exec();

    if (!indicator) {
      throw new NotFoundException(`Indicator with ID ${id} not found`);
    }

    return indicator;
  }

  async update(id: string, updateIndicatorDto: UpdateIndicatorDto): Promise<Indicator> {
    const updateData: any = { ...updateIndicatorDto };

    // Convert project string to ObjectId if provided
    if (updateIndicatorDto.project) {
      updateData.project = new Types.ObjectId(updateIndicatorDto.project);
    }

    const updatedIndicator = await this.indicatorModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('project', 'name description')
      .exec();

    if (!updatedIndicator) {
      throw new NotFoundException(`Indicator with ID ${id} not found`);
    }

    return updatedIndicator;
  }

  async remove(id: string): Promise<void> {
    const result = await this.indicatorModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Indicator with ID ${id} not found`);
    }

    // Also delete all history entries for this indicator
    await this.indicatorHistoryModel.deleteMany({ indicator: id }).exec();
  }

  /**
   * Record a new value for an indicator and create a history entry
   * This also updates the indicator's actualValue and recalculates the trend
   */
  async recordValue(
    indicatorId: string,
    recordValueDto: RecordIndicatorValueDto,
  ): Promise<IndicatorHistory> {
    const indicator = await this.findOne(indicatorId);
    const calculatedAt = recordValueDto.calculatedAt ?? new Date();

    // Get the previous value from the most recent history entry
    const previousHistory = await this.indicatorHistoryModel
      .findOne({ indicator: indicatorId })
      .sort({ calculatedAt: -1 })
      .exec();

    const previousValue = previousHistory?.recordedValue;

    // Calculate change metrics
    let changeAmount: number | undefined;
    let changePercentage: number | undefined;

    if (previousValue !== undefined) {
      changeAmount = recordValueDto.recordedValue - previousValue;
      changePercentage = (changeAmount / previousValue) * 100;
    }

    // Create history entry
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

    // Update indicator's actual value and last calculated time
    indicator.actualValue = recordValueDto.recordedValue;
    indicator.lastCalculatedAt = calculatedAt;

    // Recalculate trend
    indicator.trend = await this.calculateTrend(indicatorId);

    await indicator.save();

    return savedHistory;
  }

  /**
   * Calculate trend based on historical values
   * Compares recent values to determine if improving, declining, or stable
   */
  async calculateTrend(indicatorId: string): Promise<TrendDirection> {
    const recentHistory = await this.indicatorHistoryModel
      .find({ indicator: indicatorId })
      .sort({ calculatedAt: -1 })
      .limit(5)
      .exec();

    if (recentHistory.length < 2) {
      return TrendDirection.NO_DATA;
    }

    // Calculate average change percentage
    const changes = recentHistory
      .filter((h) => h.changePercentage !== undefined)
      .map((h) => h.changePercentage!);

    if (changes.length === 0) {
      return TrendDirection.NO_DATA;
    }

    const avgChange = changes.reduce((sum, val) => sum + val, 0) / changes.length;

    // Thresholds for trend determination (can be customized)
    const IMPROVING_THRESHOLD = 2; // 2% average increase
    const DECLINING_THRESHOLD = -2; // 2% average decrease

    if (avgChange >= IMPROVING_THRESHOLD) {
      return TrendDirection.IMPROVING;
    } else if (avgChange <= DECLINING_THRESHOLD) {
      return TrendDirection.DECLINING;
    } else {
      return TrendDirection.STABLE;
    }
  }

  /**
   * Get history of an indicator
   */
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

    let queryBuilder = this.indicatorHistoryModel
      .find(query)
      .sort({ calculatedAt: -1 });

    if (limit) {
      queryBuilder = queryBuilder.limit(limit);
    }

    return queryBuilder.exec();
  }

  /**
   * Calculate actual value from formula if provided
   * This is a basic implementation that would need to be extended based on requirements
   */
  async calculateFromFormula(indicatorId: string): Promise<number> {
    const indicator = await this.findOne(indicatorId);

    if (!indicator.calculationFormula) {
      throw new BadRequestException(
        'Indicator does not have a calculation formula',
      );
    }

    // This is a placeholder - actual implementation would depend on formula syntax
    // You might want to use a library like mathjs or implement a custom parser
    // For now, this returns the current actual value
    throw new BadRequestException(
      'Formula calculation not yet implemented. Please implement based on your formula syntax requirements.',
    );
  }

  /**
   * Get indicator statistics
   */
  async getStatistics(projectId?: string): Promise<any> {
    const matchStage = projectId
      ? { $match: { project: new Types.ObjectId(projectId) } }
      : { $match: {} };

    const statistics = await this.indicatorModel.aggregate([
      matchStage,
      {
        $group: {
          _id: '$indicatorType',
          count: { $sum: 1 },
          avgActualValue: { $avg: '$actualValue' },
          avgTargetValue: { $avg: '$targetValue' },
          avgAchievementRate: {
            $avg: {
              $cond: [
                { $and: ['$targetValue', '$actualValue'] },
                {
                  $multiply: [
                    { $divide: ['$actualValue', '$targetValue'] },
                    100,
                  ],
                },
                null,
              ],
            },
          },
        },
      },
    ]);

    const total = await this.count(projectId);

    return {
      total,
      byType: statistics.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          avgActualValue: stat.avgActualValue || 0,
          avgTargetValue: stat.avgTargetValue || 0,
          avgAchievementRate: stat.avgAchievementRate || 0,
        };
        return acc;
      }, {}),
    };
  }

  /**
   * Count indicators
   */
  async count(projectId?: string): Promise<number> {
    const query = projectId ? { project: new Types.ObjectId(projectId) } : {};
    return this.indicatorModel.countDocuments(query).exec();
  }

  /**
   * Get indicators by trend
   */
  async findByTrend(
    trend: TrendDirection,
    projectId?: string,
  ): Promise<Indicator[]> {
    const query: any = { trend };

    if (projectId) {
      query.project = new Types.ObjectId(projectId);
    }

    return this.indicatorModel
      .find(query)
      .populate('project', 'name description')
      .sort({ lastCalculatedAt: -1 })
      .exec();
  }

  /**
   * Get indicators that are off-track (actual value significantly below target)
   */
  async findOffTrack(
    projectId?: string,
    threshold: number = 0.7, // 70% of target
  ): Promise<Indicator[]> {
    const query: any = {
      targetValue: { $exists: true, $ne: null },
      actualValue: { $exists: true, $ne: null },
    };

    if (projectId) {
      query.project = new Types.ObjectId(projectId);
    }

    const indicators = await this.indicatorModel.find(query).exec();

    return indicators.filter((indicator) => {
      const achievement = indicator.actualValue! / indicator.targetValue!;
      return achievement < threshold;
    });
  }
}
