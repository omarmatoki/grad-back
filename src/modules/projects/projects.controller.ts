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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateProjectTypeDto } from './dto/create-project-type.dto';
import { UpdateProjectTypeDto } from './dto/update-project-type.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@modules/users/schemas/user.schema';
import { RequestUser } from '@common/interfaces/request-user.interface';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projectsService.create(createProjectDto, user._id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  findAll(@Query() filters: any, @CurrentUser() user: RequestUser) {
    return this.projectsService.findAll(filters, user._id, user.role);
  }

  @Get('my-projects')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get current user projects' })
  @ApiResponse({ status: 200, description: 'User projects retrieved successfully' })
  findMyProjects(@CurrentUser() user: RequestUser) {
    return this.projectsService.findByUser(user._id);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get available project types' })
  @ApiResponse({ status: 200, description: 'Project types retrieved successfully' })
  getProjectTypes() {
    return this.projectsService.getProjectTypes();
  }

  @Post('types')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new project type (Admin only)' })
  @ApiResponse({ status: 201, description: 'Project type created successfully' })
  createProjectType(
    @Body() createProjectTypeDto: CreateProjectTypeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projectsService.createProjectType(createProjectTypeDto, user._id);
  }

  @Patch('types/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update project type label (Admin only)' })
  @ApiResponse({ status: 200, description: 'Project type updated successfully' })
  updateProjectType(
    @Param('id') id: string,
    @Body() updateProjectTypeDto: UpdateProjectTypeDto,
  ) {
    return this.projectsService.updateProjectType(id, updateProjectTypeDto);
  }

  @Delete('types/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete project type (Admin only)' })
  @ApiResponse({ status: 200, description: 'Project type deleted successfully' })
  removeProjectType(@Param('id') id: string) {
    return this.projectsService.removeProjectType(id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.projectsService.findOne(id, user._id, user.role);
  }

  @Get(':id/statistics')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get project statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.projectsService.getStatistics(id, user._id, user.role);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projectsService.update(id, updateProjectDto, user._id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Delete project' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.projectsService.remove(id, user._id);
  }
}
