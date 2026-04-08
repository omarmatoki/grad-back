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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ParticipantsService } from './participants.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { CreateActivityParticipantDto } from './dto/create-activity-participant.dto';
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
  @Roles(UserRole.ADMIN, UserRole.STAFF)
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

  @Get('statistics')
  @ApiOperation({ summary: 'Get participants statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics() {
    return this.participantsService.getStatistics();
  }

  @Get('beneficiary/:beneficiaryId')
  @ApiOperation({ summary: 'Get participants by beneficiary ID' })
  @ApiResponse({ status: 200, description: 'Beneficiary participants retrieved successfully' })
  findByBeneficiary(@Param('beneficiaryId') beneficiaryId: string) {
    return this.participantsService.findByBeneficiary(beneficiaryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get participant by ID' })
  @ApiResponse({ status: 200, description: 'Participant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  findOne(@Param('id') id: string) {
    return this.participantsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update participant' })
  @ApiResponse({ status: 200, description: 'Participant updated successfully' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  update(@Param('id') id: string, @Body() updateParticipantDto: UpdateParticipantDto) {
    return this.participantsService.update(id, updateParticipantDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete participant' })
  @ApiResponse({ status: 204, description: 'Participant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  remove(@Param('id') id: string) {
    return this.participantsService.remove(id);
  }

  // ── Activity-Participant links ─────────────────────────────────────────────

  @Post('activity-links')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Link a participant to an activity' })
  @ApiResponse({ status: 201, description: 'Link created successfully' })
  @ApiResponse({ status: 409, description: 'Participant already linked to this activity' })
  linkToActivity(@Body() dto: CreateActivityParticipantDto) {
    return this.participantsService.linkToActivity(dto);
  }

  @Delete(':id/activities/:activityId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlink a participant from an activity' })
  @ApiResponse({ status: 204, description: 'Link removed successfully' })
  unlinkFromActivity(
    @Param('id') participantId: string,
    @Param('activityId') activityId: string,
  ) {
    return this.participantsService.unlinkFromActivity(participantId, activityId);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get all activities for a participant' })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully' })
  findActivities(@Param('id') participantId: string) {
    return this.participantsService.findActivitiesOfParticipant(participantId);
  }
}
