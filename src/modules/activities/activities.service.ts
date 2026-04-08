import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity } from './schemas/activity.schema';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
  ) {}

  async create(createActivityDto: CreateActivityDto): Promise<Activity> {
    const normalizedDto: CreateActivityDto = {
      ...createActivityDto,
      endTime: createActivityDto.endTime?.trim() || undefined,
      location: createActivityDto.location?.trim() || undefined,
      startTime: createActivityDto.startTime?.trim() || undefined,
    };

    if (normalizedDto.endTime && !normalizedDto.startTime) {
      throw new BadRequestException('startTime is required when endTime is provided');
    }

    if (normalizedDto.endTime && normalizedDto.startTime) {
      this.validateTimeRange(normalizedDto.startTime, normalizedDto.endTime);
    }

    const createdActivity = new this.activityModel({
      ...normalizedDto,
      registeredCount: 0,
    });

    return createdActivity.save();
  }

  async findAll(filters?: any): Promise<Activity[]> {
    const query = filters || {};
    return this.activityModel
      .find(query)
      .populate('project', 'name description status')
      .sort({ activityDate: -1, startTime: -1 })
      .exec();
  }

  async findByProject(projectId: string): Promise<Activity[]> {
    return this.activityModel
      .find({ project: projectId })
      .populate('project', 'name description status')
      .sort({ activityDate: -1, startTime: -1 })
      .exec();
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Activity[]> {
    return this.activityModel
      .find({
        activityDate: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .populate('project', 'name description status')
      .sort({ activityDate: 1, startTime: 1 })
      .exec();
  }

  async findUpcoming(limit: number = 10): Promise<Activity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.activityModel
      .find({
        activityDate: { $gte: today },
        status: { $ne: 'cancelled' },
      })
      .populate('project', 'name description status')
      .sort({ activityDate: 1, startTime: 1 })
      .limit(limit)
      .exec();
  }

  async findOne(id: string): Promise<Activity> {
    const activity = await this.activityModel
      .findById(id)
      .populate('project', 'name description status type user_id')
      .exec();

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    return activity;
  }

  async update(id: string, updateActivityDto: UpdateActivityDto): Promise<Activity> {
    if (updateActivityDto.startTime || updateActivityDto.endTime) {
      const activity = await this.findOne(id);
      const startTime = updateActivityDto.startTime || activity.startTime;
      const endTime = updateActivityDto.endTime || activity.endTime;

      if (endTime) {
        if (!startTime) {
          throw new BadRequestException('startTime is required when endTime is provided');
        }
        this.validateTimeRange(startTime, endTime);
      }
    }

    const updatedActivity = await this.activityModel
      .findByIdAndUpdate(id, updateActivityDto, { new: true })
      .populate('project', 'name description status')
      .exec();

    if (!updatedActivity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    return updatedActivity;
  }

  async remove(id: string): Promise<void> {
    const result = await this.activityModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }
  }

  async registerParticipant(id: string): Promise<Activity> {
    const activity = await this.findOne(id);

    if (activity.capacity > 0 && activity.registeredCount >= activity.capacity) {
      throw new BadRequestException('Activity is full. No spots available.');
    }

    if (activity.status === 'cancelled') {
      throw new BadRequestException('Cannot register for cancelled activity');
    }

    const activityDateTime = new Date(activity.activityDate);
    if (activityDateTime < new Date()) {
      throw new BadRequestException('Cannot register for past activity');
    }

    activity.registeredCount += 1;
    return activity.save();
  }

  async unregisterParticipant(id: string): Promise<Activity> {
    const activity = await this.findOne(id);

    if (activity.registeredCount <= 0) {
      throw new BadRequestException('No registered participants to remove');
    }

    activity.registeredCount -= 1;
    return activity.save();
  }

  async updateCapacity(id: string, newCapacity: number): Promise<Activity> {
    const activity = await this.findOne(id);

    if (newCapacity < 0) {
      throw new BadRequestException('Capacity cannot be negative');
    }

    if (newCapacity > 0 && newCapacity < activity.registeredCount) {
      throw new BadRequestException(
        `Cannot reduce capacity below current registered count (${activity.registeredCount})`,
      );
    }

    activity.capacity = newCapacity;
    return activity.save();
  }

  async getStatistics(projectId?: string): Promise<any> {
    const matchStage = projectId ? { project: projectId } : {};

    const stats = await this.activityModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          totalRegistered: { $sum: '$registeredCount' },
          totalCapacity: { $sum: '$capacity' },
          byStatus: { $push: { status: '$status' } },
          byType: { $push: { type: '$activityType' } },
        },
      },
    ]);

    if (!stats.length) {
      return {
        totalActivities: 0,
        totalRegistered: 0,
        totalCapacity: 0,
        capacityUtilization: 0,
        byStatus: {},
        byType: {},
      };
    }

    const data = stats[0];

    const statusDistribution: Record<string, number> = {};
    data.byStatus.forEach((item: any) => {
      statusDistribution[item.status] = (statusDistribution[item.status] || 0) + 1;
    });

    const typeDistribution: Record<string, number> = {};
    data.byType.forEach((item: any) => {
      typeDistribution[item.type] = (typeDistribution[item.type] || 0) + 1;
    });

    const capacityUtilization =
      data.totalCapacity > 0
        ? (data.totalRegistered / data.totalCapacity) * 100
        : 0;

    return {
      totalActivities: data.totalActivities,
      totalRegistered: data.totalRegistered,
      totalCapacity: data.totalCapacity,
      capacityUtilization: Math.round(capacityUtilization * 100) / 100,
      byStatus: statusDistribution,
      byType: typeDistribution,
    };
  }

  async getActivityReport(id: string): Promise<any> {
    const activity = await this.findOne(id);

    const capacityUtilization =
      activity.capacity > 0
        ? (activity.registeredCount / activity.capacity) * 100
        : 0;

    return {
      activity: {
        id: activity._id,
        title: activity.title,
        description: activity.description,
        date: activity.activityDate,
        startTime: activity.startTime,
        endTime: activity.endTime,
        location: activity.location,
        type: activity.activityType,
        status: activity.status,
        tags: activity.tags,
      },
      metrics: {
        capacity: activity.capacity,
        registered: activity.registeredCount,
        availableSpots: activity.capacity > 0 ? activity.capacity - activity.registeredCount : 'Unlimited',
        capacityUtilization: Math.round(capacityUtilization * 100) / 100,
        isFull: activity.capacity > 0 && activity.registeredCount >= activity.capacity,
      },
    };
  }

  private validateTimeRange(startTime: string, endTime: string): void {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (end <= start) {
      throw new BadRequestException('End time must be after start time');
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
