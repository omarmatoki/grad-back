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
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  create(@Body() createBeneficiaryDto: CreateBeneficiaryDto) {
    return this.beneficiariesService.create(createBeneficiaryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all beneficiaries' })
  @ApiResponse({ status: 200, description: 'Beneficiaries retrieved successfully' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project ID' })
  @ApiQuery({ name: 'beneficiaryType', required: false, enum: BeneficiaryType, description: 'Filter by beneficiary type' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'region', required: false, description: 'Filter by region' })
  findAll(
    @Query('projectId') projectId?: string,
    @Query('beneficiaryType') beneficiaryType?: string,
    @Query('city') city?: string,
    @Query('region') region?: string,
  ) {
    const filters: any = {};

    if (projectId) {
      filters.project = projectId;
    }

    if (beneficiaryType) {
      filters.beneficiaryType = beneficiaryType;
    }

    if (city) {
      filters.city = city;
    }

    if (region) {
      filters.region = region;
    }

    return this.beneficiariesService.findAll(filters);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get beneficiaries statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter statistics by project ID' })
  getStatistics(@Query('projectId') projectId?: string) {
    return this.beneficiariesService.getStatistics(projectId);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all beneficiaries for a specific project' })
  @ApiResponse({ status: 200, description: 'Project beneficiaries retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findByProject(@Param('projectId') projectId: string) {
    return this.beneficiariesService.findByProject(projectId);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get beneficiaries by type' })
  @ApiResponse({ status: 200, description: 'Beneficiaries retrieved successfully' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project ID' })
  findByType(
    @Param('type') type: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.beneficiariesService.findByType(type, projectId);
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

  @Get('count')
  @ApiOperation({ summary: 'Get total count of beneficiaries' })
  @ApiResponse({ status: 200, description: 'Count retrieved successfully' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter count by project ID' })
  count(@Query('projectId') projectId?: string) {
    return this.beneficiariesService.count(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get beneficiary by ID' })
  @ApiResponse({ status: 200, description: 'Beneficiary retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Beneficiary not found' })
  findOne(@Param('id') id: string) {
    return this.beneficiariesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update beneficiary' })
  @ApiResponse({ status: 200, description: 'Beneficiary updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Beneficiary not found' })
  update(
    @Param('id') id: string,
    @Body() updateBeneficiaryDto: UpdateBeneficiaryDto,
  ) {
    return this.beneficiariesService.update(id, updateBeneficiaryDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete beneficiary' })
  @ApiResponse({ status: 204, description: 'Beneficiary deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Beneficiary not found' })
  remove(@Param('id') id: string) {
    return this.beneficiariesService.remove(id);
  }
}
