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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BeneficiariesService } from './beneficiaries.service';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';
import { CreateActivityBeneficiaryDto } from './dto/create-activity-beneficiary.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Public } from '@common/decorators/public.decorator';
import { UserRole } from '@modules/users/schemas/user.schema';
import { BeneficiaryType } from './schemas/beneficiary.schema';

@ApiTags('Beneficiaries')
@ApiBearerAuth()
@Controller('beneficiaries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BeneficiariesController {
  constructor(private readonly beneficiariesService: BeneficiariesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create new beneficiary' })
  @ApiResponse({ status: 201, description: 'Beneficiary created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input data' })
  create(@Body() createBeneficiaryDto: CreateBeneficiaryDto) {
    return this.beneficiariesService.create(createBeneficiaryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all beneficiaries' })
  @ApiResponse({ status: 200, description: 'Beneficiaries retrieved successfully' })
  @ApiQuery({ name: 'beneficiaryType', required: false, enum: BeneficiaryType, description: 'Filter by beneficiary type' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'region', required: false, description: 'Filter by region' })
  findAll(
    @Query('beneficiaryType') beneficiaryType?: string,
    @Query('city') city?: string,
    @Query('region') region?: string,
  ) {
    const filters: any = {};
    if (beneficiaryType) filters.beneficiaryType = beneficiaryType;
    if (city) filters.city = city;
    if (region) filters.region = region;

    return this.beneficiariesService.findAll(filters);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get beneficiaries statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics() {
    return this.beneficiariesService.getStatistics();
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get beneficiaries by type' })
  @ApiResponse({ status: 200, description: 'Beneficiaries retrieved successfully' })
  findByType(@Param('type') type: string) {
    return this.beneficiariesService.findByType(type);
  }

  @Get('location')
  @ApiOperation({ summary: 'Get beneficiaries by location' })
  @ApiResponse({ status: 200, description: 'Beneficiaries retrieved successfully' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'region', required: false, description: 'Filter by region' })
  findByLocation(
    @Query('city') city?: string,
    @Query('region') region?: string,
  ) {
    return this.beneficiariesService.findByLocation(city, region);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get beneficiary by ID' })
  @ApiResponse({ status: 200, description: 'Beneficiary retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Beneficiary not found' })
  findOne(@Param('id') id: string) {
    return this.beneficiariesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update beneficiary' })
  @ApiResponse({ status: 200, description: 'Beneficiary updated successfully' })
  @ApiResponse({ status: 404, description: 'Beneficiary not found' })
  update(@Param('id') id: string, @Body() updateBeneficiaryDto: UpdateBeneficiaryDto) {
    return this.beneficiariesService.update(id, updateBeneficiaryDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete beneficiary' })
  @ApiResponse({ status: 204, description: 'Beneficiary deleted successfully' })
  @ApiResponse({ status: 404, description: 'Beneficiary not found' })
  remove(@Param('id') id: string) {
    return this.beneficiariesService.remove(id);
  }

  // ── Activity-Beneficiary links ─────────────────────────────────────────────

  @Post('activity-links')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Link a beneficiary to an activity (many-to-many)' })
  @ApiResponse({ status: 201, description: 'Link created successfully' })
  @ApiResponse({ status: 409, description: 'Beneficiary already linked to this activity' })
  linkToActivity(@Body() dto: CreateActivityBeneficiaryDto) {
    return this.beneficiariesService.linkToActivity(dto);
  }

  @Delete(':id/activities/:activityId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlink a beneficiary from an activity' })
  @ApiResponse({ status: 204, description: 'Link removed successfully' })
  unlinkFromActivity(
    @Param('id') beneficiaryId: string,
    @Param('activityId') activityId: string,
  ) {
    return this.beneficiariesService.unlinkFromActivity(beneficiaryId, activityId);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get all activities for a beneficiary' })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully' })
  findActivities(@Param('id') beneficiaryId: string) {
    return this.beneficiariesService.findActivitiesOfBeneficiary(beneficiaryId);
  }

  @Patch(':id/activities/:activityId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update beneficiary-activity link ratings/notes' })
  @ApiResponse({ status: 200, description: 'Link updated successfully' })
  updateLink(
    @Param('id') beneficiaryId: string,
    @Param('activityId') activityId: string,
    @Body() body: Partial<CreateActivityBeneficiaryDto>,
  ) {
    return this.beneficiariesService.updateLink(beneficiaryId, activityId, body);
  }

  // ── Public Endpoints (no auth — used from QR survey flow) ─────────────────

  @Public()
  @Post('lookup')
  @ApiOperation({ summary: 'Look up existing beneficiary by name + phone (no auth required)' })
  @ApiResponse({ status: 200, description: 'Beneficiary found or null' })
  lookupBeneficiary(@Body() body: { name: string; phone: string }) {
    return this.beneficiariesService.lookupBeneficiary(body.name, body.phone);
  }

  @Public()
  @Post('register-public')
  @ApiOperation({ summary: 'Register a new beneficiary from public survey flow (no auth required)' })
  @ApiResponse({ status: 201, description: 'Beneficiary created' })
  registerPublic(@Body() createBeneficiaryDto: CreateBeneficiaryDto) {
    return this.beneficiariesService.create(createBeneficiaryDto);
  }
}
