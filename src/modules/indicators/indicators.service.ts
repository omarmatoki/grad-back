import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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

  private async assertProjectOwnership(projectId: string, userId: string): Promise<void> {
    const project = await this.projectModel.findById(projectId).lean().exec();
    if (!project) throw new NotFoundException(`Project with ID ${projectId} not found`);
    if (project.user_id.toString() !== userId) {
      throw new ForbiddenException('You do not have permission on this project');
    }
  }

  private async getOwnedProjectIds(userId: string): Promise<string[]> {
    const projects = await this.projectModel.find({ user_id: userId }).select('_id').lean().exec();
    return projects.map((project) => project._id.toString());
  }

  async create(createIndicatorDto: CreateIndicatorDto, userId: string, userRole: UserRole): Promise<Indicator> {
    if (userRole === UserRole.STAFF) {
      await this.assertProjectOwnership(createIndicatorDto.project, userId);
    }

    const createdIndicator = new this.indicatorModel({
      ...createIndicatorDto,
      project: new Types.ObjectId(createIndicatorDto.project),
      trend: TrendDirection.NO_DATA,
    });

    return createdIndicator.save();
  }

  async findAll(filters?: any, userId?: string, userRole?: UserRole): Promise<Indicator[]> {
    const query: any = { ...(filters || {}) };

    if (userRole === UserRole.STAFF && userId) {
      const ownedProjectIds = await this.getOwnedProjectIds(userId);

      if (query.project) {
        const requestedProjectId = query.project.toString();
        if (!ownedProjectIds.includes(requestedProjectId)) {
          return [];
        }
      } else {
        query.project = { $in: ownedProjectIds };
      }
    }

    return this.indicatorModel
      .find(query)
      .populate('project', 'name description')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByProject(projectId: string, userId?: string, userRole?: UserRole): Promise<Indicator[]> {
    if (userRole === UserRole.STAFF && userId) {
      await this.assertProjectOwnership(projectId, userId);
    }

    return this.indicatorModel
      .find({ project: new Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByType(
    indicatorType: string,
    projectId?: string,
    userId?: string,
    userRole?: UserRole,
  ): Promise<Indicator[]> {
    const query: any = { indicatorType };

    if (projectId) {
      if (userRole === UserRole.STAFF && userId) {
        await this.assertProjectOwnership(projectId, userId);
      }
      query.project = new Types.ObjectId(projectId);
    } else if (userRole === UserRole.STAFF && userId) {
      const ownedProjectIds = await this.getOwnedProjectIds(userId);
      query.project = { $in: ownedProjectIds };
    }

    return this.indicatorModel
      .find(query)
      .populate('project', 'name description')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, userId?: string, userRole?: UserRole): Promise<Indicator> {
    const indicator = await this.indicatorModel
      .findById(id)
      .populate('project', 'name description owner')
      .exec();

    if (!indicator) {
      throw new NotFoundException(`Indicator with ID ${id} not found`);
    }

    if (userRole === UserRole.STAFF && userId) {
      const projectId = (indicator.project as any)?._id?.toString?.();
      if (!projectId) {
        throw new ForbiddenException('You do not have permission on this project');
      }
      await this.assertProjectOwnership(projectId, userId);
    }

    return indicator;
  }

  async update(id: string, updateIndicatorDto: UpdateIndicatorDto, userId: string, userRole: UserRole): Promise<Indicator> {
    if (userRole === UserRole.STAFF) {
      const indicator = await this.indicatorModel.findById(id).lean().exec();
      if (!indicator) throw new NotFoundException(`Indicator with ID ${id} not found`);
      await this.assertProjectOwnership(indicator.project.toString(), userId);
    }
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

  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    if (userRole === UserRole.STAFF) {
      const indicator = await this.indicatorModel.findById(id).lean().exec();
      if (!indicator) throw new NotFoundException(`Indicator with ID ${id} not found`);
      await this.assertProjectOwnership(indicator.project.toString(), userId);
    }

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
    userId: string,
    userRole: UserRole,
  ): Promise<IndicatorHistory> {
    if (userRole === UserRole.STAFF) {
      const indicator = await this.indicatorModel.findById(indicatorId).lean().exec();
      if (!indicator) throw new NotFoundException(`Indicator with ID ${indicatorId} not found`);
      await this.assertProjectOwnership(indicator.project.toString(), userId);
    }
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
    userId?: string,
    userRole?: UserRole,
  ): Promise<IndicatorHistory[]> {
    if (userRole === UserRole.STAFF && userId) {
      await this.findOne(indicatorId, userId, userRole);
    }

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
  async calculateFromFormula(indicatorId: string, userId?: string, userRole?: UserRole): Promise<number> {
    const indicator = await this.findOne(indicatorId, userId, userRole);

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
  async getStatistics(projectId?: string, userId?: string, userRole?: UserRole): Promise<any> {
    if (projectId && userRole === UserRole.STAFF && userId) {
      await this.assertProjectOwnership(projectId, userId);
    }

    const staffOwnedProjectIds = userRole === UserRole.STAFF && userId
      ? await this.getOwnedProjectIds(userId)
      : [];

    const matchStage = projectId
      ? { $match: { project: new Types.ObjectId(projectId) } }
      : userRole === UserRole.STAFF && userId
        ? { $match: { project: { $in: staffOwnedProjectIds } } }
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

    const total = await this.count(projectId, userId, userRole);

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
  async count(projectId?: string, userId?: string, userRole?: UserRole): Promise<number> {
    const query: any = projectId ? { project: new Types.ObjectId(projectId) } : {};

    if (userRole === UserRole.STAFF && userId) {
      if (projectId) {
        await this.assertProjectOwnership(projectId, userId);
      } else {
        const ownedProjectIds = await this.getOwnedProjectIds(userId);
        query.project = { $in: ownedProjectIds };
      }
    }

    return this.indicatorModel.countDocuments(query).exec();
  }

  /**
   * Get indicators by trend
   */
  async findByTrend(
    trend: TrendDirection,
    projectId?: string,
    userId?: string,
    userRole?: UserRole,
  ): Promise<Indicator[]> {
    const query: any = { trend };

    if (projectId) {
      if (userRole === UserRole.STAFF && userId) {
        await this.assertProjectOwnership(projectId, userId);
      }
      query.project = new Types.ObjectId(projectId);
    } else if (userRole === UserRole.STAFF && userId) {
      const ownedProjectIds = await this.getOwnedProjectIds(userId);
      query.project = { $in: ownedProjectIds };
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
    userId?: string,
    userRole?: UserRole,
  ): Promise<Indicator[]> {
    const query: any = {
      targetValue: { $exists: true, $ne: null },
      actualValue: { $exists: true, $ne: null },
    };

    if (projectId) {
      if (userRole === UserRole.STAFF && userId) {
        await this.assertProjectOwnership(projectId, userId);
      }
      query.project = new Types.ObjectId(projectId);
    } else if (userRole === UserRole.STAFF && userId) {
      const ownedProjectIds = await this.getOwnedProjectIds(userId);
      query.project = { $in: ownedProjectIds };
    }

    const indicators = await this.indicatorModel.find(query).exec();

    return indicators.filter((indicator) => {
      const achievement = indicator.actualValue! / indicator.targetValue!;
      return achievement < threshold;
    });
  }
}
