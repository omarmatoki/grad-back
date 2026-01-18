import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
    // Validate time range if both start and end times are provided
    if (createActivityDto.endTime) {
      this.validateTimeRange(createActivityDto.startTime, createActivityDto.endTime);
    }

    const createdActivity = new this.activityModel({
      ...createActivityDto,
      registeredCount: 0,
      attendedCount: 0,
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
      .populate('project', 'name description status type owner')
      .exec();

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    return activity;
  }

  async update(
    id: string,
    updateActivityDto: UpdateActivityDto,
  ): Promise<Activity> {
    // Validate time range if updating times
    if (updateActivityDto.startTime || updateActivityDto.endTime) {
      const activity = await this.findOne(id);
      const startTime = updateActivityDto.startTime || activity.startTime;
      const endTime = updateActivityDto.endTime || activity.endTime;

      if (endTime) {
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

    // Check if activity is full
    if (activity.capacity > 0 && activity.registeredCount >= activity.capacity) {
      throw new BadRequestException('Activity is full. No spots available.');
    }

    // Check if activity is cancelled
    if (activity.status === 'cancelled') {
      throw new BadRequestException('Cannot register for cancelled activity');
    }

    // Check if activity date has passed
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

  async markAttendance(id: string, attendeeCount: number): Promise<Activity> {
    const activity = await this.findOne(id);

    if (attendeeCount < 0) {
      throw new BadRequestException('Attendance count cannot be negative');
    }

    if (attendeeCount > activity.registeredCount) {
      throw new BadRequestException(
        'Attendance count cannot exceed registered count',
      );
    }

    activity.attendedCount = attendeeCount;
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
          totalAttended: { $sum: '$attendedCount' },
          totalCapacity: { $sum: '$capacity' },
          byStatus: {
            $push: {
              status: '$status',
              count: 1,
            },
          },
          byType: {
            $push: {
              type: '$activityType',
              count: 1,
            },
          },
        },
      },
    ]);

    if (!stats.length) {
      return {
        totalActivities: 0,
        totalRegistered: 0,
        totalAttended: 0,
        totalCapacity: 0,
        attendanceRate: 0,
        capacityUtilization: 0,
        byStatus: {},
        byType: {},
      };
    }

    const data = stats[0];

    // Calculate status distribution
    const statusDistribution: Record<string, number> = {};
    data.byStatus.forEach((item: any) => {
      statusDistribution[item.status] = (statusDistribution[item.status] || 0) + 1;
    });

    // Calculate type distribution
    const typeDistribution: Record<string, number> = {};
    data.byType.forEach((item: any) => {
      typeDistribution[item.type] = (typeDistribution[item.type] || 0) + 1;
    });

    const attendanceRate =
      data.totalRegistered > 0
        ? (data.totalAttended / data.totalRegistered) * 100
        : 0;

    const capacityUtilization =
      data.totalCapacity > 0
        ? (data.totalRegistered / data.totalCapacity) * 100
        : 0;

    return {
      totalActivities: data.totalActivities,
      totalRegistered: data.totalRegistered,
      totalAttended: data.totalAttended,
      totalCapacity: data.totalCapacity,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      capacityUtilization: Math.round(capacityUtilization * 100) / 100,
      byStatus: statusDistribution,
      byType: typeDistribution,
    };
  }

  async getActivityReport(id: string): Promise<any> {
    const activity = await this.findOne(id);

    const attendanceRate =
      activity.registeredCount > 0
        ? (activity.attendedCount / activity.registeredCount) * 100
        : 0;

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
        speaker: activity.speaker,
        type: activity.activityType,
        status: activity.status,
      },
      metrics: {
        capacity: activity.capacity,
        registered: activity.registeredCount,
        attended: activity.attendedCount,
        availableSpots: activity.capacity > 0 ? activity.capacity - activity.registeredCount : 'Unlimited',
        attendanceRate: Math.round(attendanceRate * 100) / 100,
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
