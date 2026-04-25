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
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@modules/users/schemas/user.schema';
import { RequestUser } from '@common/interfaces/request-user.interface';
import { IndicatorType, TrendDirection } from './schemas/indicator.schema';

@ApiTags('Indicators')
@ApiBearerAuth()
@Controller('indicators')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create new indicator' })
  create(@Body() createIndicatorDto: CreateIndicatorDto) {
    return this.indicatorsService.create(createIndicatorDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all indicators' })
  @ApiQuery({ name: 'indicatorType', required: false, enum: IndicatorType })
  @ApiQuery({ name: 'isActive', required: false })
  findAll(
    @Query('indicatorType') indicatorType?: string,
    @Query('isActive') isActive?: string,
    @CurrentUser() user?: RequestUser,
  ) {
    const filters: any = {};
    if (indicatorType) filters.indicatorType = indicatorType;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    return this.indicatorsService.findAll(filters, user?._id, user?.role);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get indicators statistics' })
  getStatistics(@CurrentUser() user?: RequestUser) {
    return this.indicatorsService.getStatistics(user?._id, user?.role);
  }

  @Get('project/:projectId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get indicators assigned to a project' })
  @ApiParam({ name: 'projectId' })
  findByProject(@Param('projectId') projectId: string, @CurrentUser() user?: RequestUser) {
    return this.indicatorsService.findByProject(projectId, user?._id, user?.role);
  }

  @Get('type/:type')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get indicators by type' })
  @ApiParam({ name: 'type', enum: IndicatorType })
  findByType(@Param('type') type: string, @CurrentUser() user?: RequestUser) {
    return this.indicatorsService.findByType(type, user?._id, user?.role);
  }

  @Get('trend/:trend')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get indicators by trend' })
  @ApiParam({ name: 'trend', enum: TrendDirection })
  findByTrend(@Param('trend') trend: TrendDirection, @CurrentUser() user?: RequestUser) {
    return this.indicatorsService.findByTrend(trend, user?._id, user?.role);
  }

  @Get('off-track')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get off-track indicators' })
  @ApiQuery({ name: 'threshold', required: false })
  findOffTrack(@Query('threshold') threshold?: number, @CurrentUser() user?: RequestUser) {
    return this.indicatorsService.findOffTrack(threshold, user?._id, user?.role);
  }

  @Get('count')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get count of indicators' })
  count(@CurrentUser() user?: RequestUser) {
    return this.indicatorsService.count(user?._id, user?.role);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get indicator by ID' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.indicatorsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update indicator' })
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() updateIndicatorDto: UpdateIndicatorDto) {
    return this.indicatorsService.update(id, updateIndicatorDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete indicator' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string) {
    return this.indicatorsService.remove(id);
  }

  @Post(':id/record-value')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Record a new value for an indicator' })
  @ApiParam({ name: 'id' })
  recordValue(@Param('id') id: string, @Body() recordValueDto: RecordIndicatorValueDto) {
    return this.indicatorsService.recordValue(id, recordValueDto);
  }

  @Get(':id/history')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get indicator history' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getHistory(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.indicatorsService.getHistory(
      id,
      limit,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Post(':id/calculate-trend')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Recalculate trend for an indicator' })
  @ApiParam({ name: 'id' })
  async calculateTrend(@Param('id') id: string) {
    const trend = await this.indicatorsService.calculateTrend(id);
    const indicator = await this.indicatorsService.findOne(id);
    indicator.trend = trend;
    await indicator.save();
    return { indicatorId: id, trend };
  }

  @Post(':id/calculate-from-formula')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Calculate indicator value from formula' })
  @ApiParam({ name: 'id' })
  calculateFromFormula(@Param('id') id: string) {
    return this.indicatorsService.calculateFromFormula(id);
  }
}
