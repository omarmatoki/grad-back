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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ParticipantsService } from './participants.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@modules/users/schemas/user.schema';

@ApiTags('Participants')
@ApiBearerAuth()
@Controller('participants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create new participant' })
  @ApiResponse({ status: 201, description: 'Participant created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createParticipantDto: CreateParticipantDto) {
    return this.participantsService.create(createParticipantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all participants' })
  @ApiResponse({ status: 200, description: 'Participants retrieved successfully' })
  findAll(@Query() filters: any) {
    return this.participantsService.findAll(filters);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get participants by project ID' })
  @ApiResponse({ status: 200, description: 'Project participants retrieved successfully' })
  findByProject(@Param('projectId') projectId: string) {
    return this.participantsService.findByProject(projectId);
  }

  @Get('beneficiary/:beneficiaryId')
  @ApiOperation({ summary: 'Get participants by beneficiary ID' })
  @ApiResponse({ status: 200, description: 'Beneficiary participants retrieved successfully' })
  findByBeneficiary(@Param('beneficiaryId') beneficiaryId: string) {
    return this.participantsService.findByBeneficiary(beneficiaryId);
  }

  @Get('project/:projectId/stats')
  @ApiOperation({ summary: 'Get project participants statistics' })
  @ApiResponse({ status: 200, description: 'Project statistics retrieved successfully' })
  getProjectStats(@Param('projectId') projectId: string) {
    return this.participantsService.getProjectParticipantsStats(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get participant by ID' })
  @ApiResponse({ status: 200, description: 'Participant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  findOne(@Param('id') id: string) {
    return this.participantsService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get participant statistics' })
  @ApiResponse({ status: 200, description: 'Participant statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  getParticipantStats(@Param('id') id: string) {
    return this.participantsService.getParticipantStats(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update participant' })
  @ApiResponse({ status: 200, description: 'Participant updated successfully' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  update(@Param('id') id: string, @Body() updateParticipantDto: UpdateParticipantDto) {
    return this.participantsService.update(id, updateParticipantDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete participant' })
  @ApiResponse({ status: 200, description: 'Participant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  remove(@Param('id') id: string) {
    return this.participantsService.remove(id);
  }

  @Patch(':id/attendance')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update participant attendance' })
  @ApiResponse({ status: 200, description: 'Attendance updated successfully' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        attendanceSessions: { type: 'number', example: 8 },
        totalSessions: { type: 'number', example: 10 },
      },
    },
  })
  updateAttendance(
    @Param('id') id: string,
    @Body() body: { attendanceSessions: number; totalSessions: number },
  ) {
    return this.participantsService.updateAttendance(
      id,
      body.attendanceSessions,
      body.totalSessions,
    );
  }

  @Post(':id/attendance/increment')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Increment participant attendance by 1' })
  @ApiResponse({ status: 200, description: 'Attendance incremented successfully' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  incrementAttendance(@Param('id') id: string) {
    return this.participantsService.incrementAttendance(id);
  }

  @Patch(':id/total-sessions')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Set total sessions for participant' })
  @ApiResponse({ status: 200, description: 'Total sessions updated successfully' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        totalSessions: { type: 'number', example: 10 },
      },
    },
  })
  setTotalSessions(@Param('id') id: string, @Body() body: { totalSessions: number }) {
    return this.participantsService.setTotalSessions(id, body.totalSessions);
  }

  @Patch(':id/assessment-scores')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update participant assessment scores' })
  @ApiResponse({ status: 200, description: 'Assessment scores updated successfully' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        preAssessmentScore: { type: 'number', example: 65, minimum: 0, maximum: 100 },
        postAssessmentScore: { type: 'number', example: 85, minimum: 0, maximum: 100 },
      },
    },
  })
  updateAssessmentScores(
    @Param('id') id: string,
    @Body() body: { preAssessmentScore?: number; postAssessmentScore?: number },
  ) {
    return this.participantsService.updateAssessmentScores(
      id,
      body.preAssessmentScore,
      body.postAssessmentScore,
    );
  }

  @Post('attendance/bulk-update')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Bulk update attendance for multiple participants' })
  @ApiResponse({ status: 200, description: 'Bulk attendance updated successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              attended: { type: 'boolean' },
            },
          },
          example: [
            { id: '507f1f77bcf86cd799439011', attended: true },
            { id: '507f1f77bcf86cd799439012', attended: false },
          ],
        },
      },
    },
  })
  bulkUpdateAttendance(@Body() body: { updates: Array<{ id: string; attended: boolean }> }) {
    return this.participantsService.bulkUpdateAttendance(body.updates);
  }
}
