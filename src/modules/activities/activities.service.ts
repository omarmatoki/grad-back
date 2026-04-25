import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activity } from './schemas/activity.schema';
import { ActivityTypeEntity } from './schemas/activity-type.schema';
import { Project } from '@modules/projects/schemas/project.schema';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CreateActivityTypeDto } from './dto/create-activity-type.dto';
import { UpdateActivityTypeDto } from './dto/update-activity-type.dto';
import { UserRole } from '@modules/users/schemas/user.schema';

const DEFAULT_ACTIVITY_TYPES = [
  { value: 'training', label: 'تدريب' },
  { value: 'workshop', label: 'ورشة عمل' },
  { value: 'seminar', label: 'ندوة' },
  { value: 'consultation', label: 'استشارة' },
  { value: 'field_visit', label: 'زيارة ميدانية' },
  { value: 'awareness_campaign', label: 'حملة توعوية' },
  { value: 'service_delivery', label: 'تقديم خدمة' },
  { value: 'other', label: 'أخرى' },
];

@Injectable()
export class ActivitiesService implements OnModuleInit {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectModel(ActivityTypeEntity.name) private activityTypeModel: Model<ActivityTypeEntity>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
  ) {}

  async onModuleInit() {
    const count = await this.activityTypeModel.countDocuments().exec();
    if (count === 0) {
      await this.activityTypeModel.insertMany(DEFAULT_ACTIVITY_TYPES);
    }
  }

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

  async create(createActivityDto: CreateActivityDto, userId: string, userRole: UserRole): Promise<Activity> {
    if (userRole === UserRole.STAFF) {
      await this.assertProjectOwnership(createActivityDto.project, userId);
    }

    const normalizedDto: CreateActivityDto = {
      ...createActivityDto,
      endTime: createActivityDto.endTime?.trim() || undefined,
      location: createActivityDto.location?.trim() || undefined,
      startTime: createActivityDto.startTime?.trim() || undefined,
    };

    // Validate activity date/time is not in the past
    this.validateNotInPast(normalizedDto.activityDate, normalizedDto.startTime);

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

  async findAll(filters?: any, userId?: string, userRole?: UserRole): Promise<Activity[]> {
    const query: any = {};

    // Cast project string → ObjectId so MongoDB matches correctly
    if (filters?.project) {
      try {
        query.project = new Types.ObjectId(filters.project);
      } catch {
        query.project = filters.project;
      }
    }
    if (filters?.status) query.status = filters.status;
    if (filters?.activityType) query.activityType = filters.activityType;

    if (userRole === UserRole.STAFF && userId) {
      const ownedIds = await this.getOwnedProjectIds(userId);
      const ownedObjectIds = ownedIds.map((id) => new Types.ObjectId(id));

      if (query.project) {
        // Keep only if user owns this specific project
        const owns = ownedIds.includes(query.project.toString());
        query.project = owns ? query.project : new Types.ObjectId('000000000000000000000000');
      } else {
        query.project = { $in: ownedObjectIds };
      }
    }

    return this.activityModel
      .find(query)
      .populate('project', 'name description status')
      .sort({ activityDate: -1, startTime: -1 })
      .exec();
  }

  async findByProject(projectId: string, userId?: string, userRole?: UserRole): Promise<Activity[]> {
    if (userRole === UserRole.STAFF && userId) {
      await this.assertProjectOwnership(projectId, userId);
    }

    return this.activityModel
      .find({ project: new Types.ObjectId(projectId) })
      .populate('project', 'name description status')
      .sort({ activityDate: -1, startTime: -1 })
      .exec();
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    userId?: string,
    userRole?: UserRole,
  ): Promise<Activity[]> {
    const query: any = {
      activityDate: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (userRole === UserRole.STAFF && userId) {
      const ownedProjectIds = await this.getOwnedProjectIds(userId);
      query.project = { $in: ownedProjectIds };
    }

    return this.activityModel
      .find(query)
      .populate('project', 'name description status')
      .sort({ activityDate: 1, startTime: 1 })
      .exec();
  }

  async findUpcoming(limit: number = 10, userId?: string, userRole?: UserRole): Promise<Activity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query: any = {
      activityDate: { $gte: today },
      status: { $ne: 'cancelled' },
    };

    if (userRole === UserRole.STAFF && userId) {
      const ownedProjectIds = await this.getOwnedProjectIds(userId);
      query.project = { $in: ownedProjectIds };
    }

    return this.activityModel
      .find(query)
      .populate('project', 'name description status')
      .sort({ activityDate: 1, startTime: 1 })
      .limit(limit)
      .exec();
  }

  async findOne(id: string, userId?: string, userRole?: UserRole): Promise<Activity> {
    const activity = await this.activityModel
      .findById(id)
      .populate('project', 'name description status type user_id')
      .exec();

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    if (userRole === UserRole.STAFF && userId) {
      const projectUserId = (activity.project as any)?.user_id?.toString?.() ?? '';
      if (projectUserId !== userId) {
        throw new ForbiddenException('You do not have permission on this project');
      }
    }

    return activity;
  }

  async update(id: string, updateActivityDto: UpdateActivityDto, userId: string, userRole: UserRole): Promise<Activity> {
    if (userRole === UserRole.STAFF) {
      const activity = await this.activityModel.findById(id).lean().exec();
      if (!activity) throw new NotFoundException(`Activity with ID ${id} not found`);
      await this.assertProjectOwnership(activity.project.toString(), userId);
    }

    // If activityDate is being updated, validate it is not in the past
    if (updateActivityDto.activityDate) {
      const startTime = updateActivityDto.startTime ?? (await this.activityModel.findById(id).lean().exec())?.startTime;
      this.validateNotInPast(updateActivityDto.activityDate, startTime);
    }

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

  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    if (userRole === UserRole.STAFF) {
      const activity = await this.activityModel.findById(id).lean().exec();
      if (!activity) throw new NotFoundException(`Activity with ID ${id} not found`);
      await this.assertProjectOwnership(activity.project.toString(), userId);
    }

    const result = await this.activityModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }
  }

  async registerParticipant(id: string, userId?: string, userRole?: UserRole): Promise<Activity> {
    const activity = await this.findOne(id, userId, userRole);

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

  async unregisterParticipant(id: string, userId?: string, userRole?: UserRole): Promise<Activity> {
    const activity = await this.findOne(id, userId, userRole);

    if (activity.registeredCount <= 0) {
      throw new BadRequestException('No registered participants to remove');
    }

    activity.registeredCount -= 1;
    return activity.save();
  }

  async updateCapacity(id: string, newCapacity: number, userId: string, userRole: UserRole): Promise<Activity> {
    if (userRole === UserRole.STAFF) {
      const activity = await this.activityModel.findById(id).lean().exec();
      if (!activity) throw new NotFoundException(`Activity with ID ${id} not found`);
      await this.assertProjectOwnership(activity.project.toString(), userId);
    }

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

  async getStatistics(projectId?: string, userId?: string, userRole?: UserRole): Promise<any> {
    const matchStage: any = {};

    if (projectId) {
      if (userRole === UserRole.STAFF && userId) {
        await this.assertProjectOwnership(projectId, userId);
      }
      matchStage.project = new Types.ObjectId(projectId);
    } else if (userRole === UserRole.STAFF && userId) {
      const ownedProjectIds = await this.getOwnedProjectIds(userId);
      matchStage.project = { $in: ownedProjectIds.map((id) => new Types.ObjectId(id)) };
    }

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

  async getActivityReport(id: string, userId?: string, userRole?: UserRole): Promise<any> {
    const activity = await this.findOne(id, userId, userRole);

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

  private validateNotInPast(activityDate: string, startTime?: string): void {
    const now = new Date();
    const activityDatetime = new Date(activityDate);

    if (startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      activityDatetime.setHours(hours, minutes, 0, 0);
    } else {
      // If no start time, check if the whole day is in the past (use end of day)
      activityDatetime.setHours(23, 59, 59, 999);
    }

    if (activityDatetime < now) {
      throw new BadRequestException('لا يمكن إنشاء نشاط في تاريخ أو وقت مضى');
    }
  }

  private normalizeActivityTypeValue(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w\u0600-\u06FF-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  // ─── Activity Types ────────────────────────────────────────────────────────

  async getActivityTypes(): Promise<ActivityTypeEntity[]> {
    return this.activityTypeModel
      .find()
      .sort({ createdAt: 1, label: 1 })
      .exec();
  }

  async createActivityType(
    dto: CreateActivityTypeDto,
    userId: string,
  ): Promise<ActivityTypeEntity> {
    const value = this.normalizeActivityTypeValue(dto.value || dto.label);

    const existing = await this.activityTypeModel.findOne({ value }).lean().exec();
    if (existing) {
      throw new ConflictException(`نوع النشاط "${value}" موجود مسبقاً`);
    }

    const activityType = new this.activityTypeModel({ value, label: dto.label, createdBy: userId });
    return activityType.save();
  }

  async updateActivityType(id: string, dto: UpdateActivityTypeDto): Promise<ActivityTypeEntity> {
    const updated = await this.activityTypeModel
      .findByIdAndUpdate(id, { label: dto.label }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`نوع النشاط غير موجود`);
    }

    return updated;
  }

  async removeActivityType(id: string): Promise<void> {
    const activityType = await this.activityTypeModel.findById(id).lean().exec();
    if (!activityType) {
      throw new NotFoundException(`نوع النشاط غير موجود`);
    }

    // Check if any activity uses this type
    const linked = await this.activityModel
      .findOne({ activityType: activityType.value })
      .lean()
      .exec();

    if (linked) {
      throw new ConflictException(
        'لا يمكن حذف هذا النوع لأنه مرتبط بنشاط موجود',
      );
    }

    await this.activityTypeModel.findByIdAndDelete(id).exec();
  }
}
