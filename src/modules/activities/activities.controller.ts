import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CreateActivityTypeDto } from './dto/create-activity-type.dto';
import { UpdateActivityTypeDto } from './dto/update-activity-type.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@modules/users/schemas/user.schema';
import { RequestUser } from '@common/interfaces/request-user.interface';

@ApiTags('Activities')
@ApiBearerAuth()
@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  // ─── Activity Types ──────────────────────────────────────────────────────

  @Get('types')
  @ApiOperation({ summary: 'Get available activity types' })
  @ApiResponse({ status: 200, description: 'Activity types retrieved successfully' })
  getActivityTypes() {
    return this.activitiesService.getActivityTypes();
  }

  @Post('types')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new activity type (Admin only)' })
  @ApiResponse({ status: 201, description: 'Activity type created successfully' })
  createActivityType(
    @Body() createActivityTypeDto: CreateActivityTypeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.activitiesService.createActivityType(createActivityTypeDto, user._id);
  }

  @Patch('types/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update activity type label (Admin only)' })
  @ApiResponse({ status: 200, description: 'Activity type updated successfully' })
  updateActivityType(
    @Param('id') id: string,
    @Body() updateActivityTypeDto: UpdateActivityTypeDto,
  ) {
    return this.activitiesService.updateActivityType(id, updateActivityTypeDto);
  }

  @Delete('types/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete activity type (Admin only)' })
  @ApiResponse({ status: 200, description: 'Activity type deleted successfully' })
  removeActivityType(@Param('id') id: string) {
    return this.activitiesService.removeActivityType(id);
  }

  // ─── Activities ──────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create new activity' })
  @ApiResponse({ status: 201, description: 'Activity created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createActivityDto: CreateActivityDto, @CurrentUser() user: RequestUser) {
    return this.activitiesService.create(createActivityDto, user._id, user.role);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all activities' })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'activityType', required: false, description: 'Filter by activity type' })
  @ApiQuery({ name: 'project', required: false, description: 'Filter by project ID' })
  findAll(
    @Query('status') status?: string,
    @Query('activityType') activityType?: string,
    @Query('project') project?: string,
    @CurrentUser() user?: RequestUser,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (activityType) filters.activityType = activityType;
    if (project) filters.project = project;

    return this.activitiesService.findAll(filters, user?._id, user?.role);
  }

  @Get('upcoming')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get upcoming activities' })
  @ApiResponse({ status: 200, description: 'Upcoming activities retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of activities to return', example: 10 })
  findUpcoming(@Query('limit') limit?: number, @CurrentUser() user?: RequestUser) {
    return this.activitiesService.findUpcoming(limit || 10, user?._id, user?.role);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get activities statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter statistics by project' })
  getStatistics(@Query('projectId') projectId?: string, @CurrentUser() user?: RequestUser) {
    return this.activitiesService.getStatistics(projectId, user?._id, user?.role);
  }

  @Get('project/:projectId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get activities by project' })
  @ApiResponse({ status: 200, description: 'Project activities retrieved successfully' })
  findByProject(@Param('projectId') projectId: string, @CurrentUser() user?: RequestUser) {
    return this.activitiesService.findByProject(projectId, user?._id, user?.role);
  }

  @Get('date-range')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get activities within date range' })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user?: RequestUser,
  ) {
    return this.activitiesService.findByDateRange(new Date(startDate), new Date(endDate), user?._id, user?.role);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get activity by ID' })
  @ApiResponse({ status: 200, description: 'Activity retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  findOne(@Param('id') id: string, @CurrentUser() user?: RequestUser) {
    return this.activitiesService.findOne(id, user?._id, user?.role);
  }

  @Get(':id/report')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get detailed activity report' })
  @ApiResponse({ status: 200, description: 'Activity report retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  getReport(@Param('id') id: string, @CurrentUser() user?: RequestUser) {
    return this.activitiesService.getActivityReport(id, user?._id, user?.role);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update activity' })
  @ApiResponse({ status: 200, description: 'Activity updated successfully' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  update(@Param('id') id: string, @Body() updateActivityDto: UpdateActivityDto, @CurrentUser() user: RequestUser) {
    return this.activitiesService.update(id, updateActivityDto, user._id, user.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Delete activity' })
  @ApiResponse({ status: 200, description: 'Activity deleted successfully' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.activitiesService.remove(id, user._id, user.role);
  }

  @Post(':id/register')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Register participant for activity (increment count)' })
  @ApiResponse({ status: 200, description: 'Participant registered successfully' })
  registerParticipant(@Param('id') id: string, @CurrentUser() user?: RequestUser) {
    return this.activitiesService.registerParticipant(id, user?._id, user?.role);
  }

  @Post(':id/unregister')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Unregister participant from activity (decrement count)' })
  @ApiResponse({ status: 200, description: 'Participant unregistered successfully' })
  unregisterParticipant(@Param('id') id: string, @CurrentUser() user?: RequestUser) {
    return this.activitiesService.unregisterParticipant(id, user?._id, user?.role);
  }

  @Patch(':id/capacity')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update activity capacity' })
  @ApiResponse({ status: 200, description: 'Capacity updated successfully' })
  updateCapacity(@Param('id') id: string, @Body('capacity') capacity: number, @CurrentUser() user: RequestUser) {
    return this.activitiesService.updateCapacity(id, capacity, user._id, user.role);
  }
}
