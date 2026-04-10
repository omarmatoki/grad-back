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
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  findAll(@Query() filters: any) {
    return this.projectsService.findAll(filters);
  }

  @Get('my-projects')
  @ApiOperation({ summary: 'Get current user projects' })
  @ApiResponse({ status: 200, description: 'User projects retrieved successfully' })
  findMyProjects(@CurrentUser() user: RequestUser) {
    return this.projectsService.findByUser(user._id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get project statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics(@Param('id') id: string) {
    return this.projectsService.getStatistics(id);
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
