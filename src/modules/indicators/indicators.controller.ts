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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { IndicatorsService } from './indicators.service';
import { CreateIndicatorDto } from './dto/create-indicator.dto';
import { UpdateIndicatorDto } from './dto/update-indicator.dto';
import { RecordIndicatorValueDto } from './dto/record-indicator-value.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@modules/users/schemas/user.schema';
import { IndicatorType, TrendDirection } from './schemas/indicator.schema';

@ApiTags('Indicators')
@ApiBearerAuth()
@Controller('indicators')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new indicator' })
  @ApiResponse({ status: 201, description: 'Indicator created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  create(@Body() createIndicatorDto: CreateIndicatorDto) {
    return this.indicatorsService.create(createIndicatorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all indicators' })
  @ApiResponse({ status: 200, description: 'Indicators retrieved successfully' })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Filter by project ID',
  })
  @ApiQuery({
    name: 'indicatorType',
    required: false,
    enum: IndicatorType,
    description: 'Filter by indicator type',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
  })
  findAll(
    @Query('projectId') projectId?: string,
    @Query('indicatorType') indicatorType?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters: any = {};

    if (projectId) {
      filters.project = projectId;
    }

    if (indicatorType) {
      filters.indicatorType = indicatorType;
    }

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    return this.indicatorsService.findAll(filters);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get indicators statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Filter statistics by project ID',
  })
  getStatistics(@Query('projectId') projectId?: string) {
    return this.indicatorsService.getStatistics(projectId);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all indicators for a specific project' })
  @ApiResponse({
    status: 200,
    description: 'Project indicators retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  findByProject(@Param('projectId') projectId: string) {
    return this.indicatorsService.findByProject(projectId);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get indicators by type' })
  @ApiResponse({ status: 200, description: 'Indicators retrieved successfully' })
  @ApiParam({ name: 'type', enum: IndicatorType, description: 'Indicator type' })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Filter by project ID',
  })
  findByType(
    @Param('type') type: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.indicatorsService.findByType(type, projectId);
  }

  @Get('trend/:trend')
  @ApiOperation({ summary: 'Get indicators by trend' })
  @ApiResponse({ status: 200, description: 'Indicators retrieved successfully' })
  @ApiParam({
    name: 'trend',
    enum: TrendDirection,
    description: 'Trend direction',
  })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Filter by project ID',
  })
  findByTrend(
    @Param('trend') trend: TrendDirection,
    @Query('projectId') projectId?: string,
  ) {
    return this.indicatorsService.findByTrend(trend, projectId);
  }

  @Get('off-track')
  @ApiOperation({
    summary: 'Get indicators that are off-track (below target threshold)',
  })
  @ApiResponse({ status: 200, description: 'Off-track indicators retrieved' })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Filter by project ID',
  })
  @ApiQuery({
    name: 'threshold',
    required: false,
    description: 'Achievement threshold (default 0.7 for 70%)',
  })
  findOffTrack(
    @Query('projectId') projectId?: string,
    @Query('threshold') threshold?: number,
  ) {
    return this.indicatorsService.findOffTrack(projectId, threshold);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get total count of indicators' })
  @ApiResponse({ status: 200, description: 'Count retrieved successfully' })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Filter count by project ID',
  })
  count(@Query('projectId') projectId?: string) {
    return this.indicatorsService.count(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get indicator by ID' })
  @ApiResponse({ status: 200, description: 'Indicator retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  @ApiParam({ name: 'id', description: 'Indicator ID' })
  findOne(@Param('id') id: string) {
    return this.indicatorsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update indicator' })
  @ApiResponse({ status: 200, description: 'Indicator updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  @ApiParam({ name: 'id', description: 'Indicator ID' })
  update(
    @Param('id') id: string,
    @Body() updateIndicatorDto: UpdateIndicatorDto,
  ) {
    return this.indicatorsService.update(id, updateIndicatorDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete indicator' })
  @ApiResponse({ status: 204, description: 'Indicator deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  @ApiParam({ name: 'id', description: 'Indicator ID' })
  remove(@Param('id') id: string) {
    return this.indicatorsService.remove(id);
  }

  // ==================== HISTORY ENDPOINTS ====================

  @Post(':id/record-value')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Record a new value for an indicator',
    description:
      'Records a new value, creates a history entry, updates actual value, and recalculates trend',
  })
  @ApiResponse({
    status: 201,
    description: 'Value recorded and history entry created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  @ApiParam({ name: 'id', description: 'Indicator ID' })
  recordValue(
    @Param('id') id: string,
    @Body() recordValueDto: RecordIndicatorValueDto,
  ) {
    return this.indicatorsService.recordValue(id, recordValueDto);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get history of an indicator' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  @ApiParam({ name: 'id', description: 'Indicator ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limit number of history entries',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for filtering (ISO 8601 format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for filtering (ISO 8601 format)',
  })
  getHistory(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.indicatorsService.getHistory(id, limit, start, end);
  }

  @Post(':id/calculate-trend')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Manually recalculate trend for an indicator',
    description: 'Recalculates the trend based on recent historical values',
  })
  @ApiResponse({ status: 200, description: 'Trend recalculated successfully' })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  @ApiParam({ name: 'id', description: 'Indicator ID' })
  async calculateTrend(@Param('id') id: string) {
    const trend = await this.indicatorsService.calculateTrend(id);
    const indicator = await this.indicatorsService.findOne(id);
    indicator.trend = trend;
    await indicator.save();

    return {
      indicatorId: id,
      trend,
      message: 'Trend recalculated successfully',
    };
  }

  @Post(':id/calculate-from-formula')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Calculate indicator value from formula',
    description: 'Calculates the actual value using the provided formula',
  })
  @ApiResponse({ status: 200, description: 'Value calculated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - no formula or invalid formula',
  })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  @ApiParam({ name: 'id', description: 'Indicator ID' })
  calculateFromFormula(@Param('id') id: string) {
    return this.indicatorsService.calculateFromFormula(id);
  }
}
