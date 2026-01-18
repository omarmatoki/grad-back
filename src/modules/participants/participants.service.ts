import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Participant } from './schemas/participant.schema';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectModel(Participant.name) private participantModel: Model<Participant>,
  ) {}

  async create(createParticipantDto: CreateParticipantDto): Promise<Participant> {
    const createdParticipant = new this.participantModel(createParticipantDto);
    return createdParticipant.save();
  }

  async findAll(filters?: any): Promise<Participant[]> {
    return this.participantModel
      .find(filters || {})
      .populate('beneficiary', 'name beneficiaryType city region')
      .populate('project', 'name type status')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Participant> {
    const participant = await this.participantModel
      .findById(id)
      .populate('beneficiary', 'name beneficiaryType city region')
      .populate('project', 'name type status')
      .exec();

    if (!participant) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }

    return participant;
  }

  async findByProject(projectId: string): Promise<Participant[]> {
    return this.participantModel
      .find({ project: projectId })
      .populate('beneficiary', 'name beneficiaryType city region')
      .populate('project', 'name type status')
      .sort({ registrationDate: -1 })
      .exec();
  }

  async findByBeneficiary(beneficiaryId: string): Promise<Participant[]> {
    return this.participantModel
      .find({ beneficiary: beneficiaryId })
      .populate('beneficiary', 'name beneficiaryType city region')
      .populate('project', 'name type status')
      .sort({ registrationDate: -1 })
      .exec();
  }

  async update(id: string, updateParticipantDto: UpdateParticipantDto): Promise<Participant> {
    const participant = await this.participantModel.findById(id);

    if (!participant) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }

    // Update the participant fields
    Object.assign(participant, updateParticipantDto);

    // The pre-save middleware will automatically calculate attendance_rate and improvement_percentage
    return participant.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.participantModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }
  }

  // Attendance tracking methods
  async updateAttendance(
    id: string,
    attendanceSessions: number,
    totalSessions: number,
  ): Promise<Participant> {
    const participant = await this.participantModel.findById(id);

    if (!participant) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }

    if (attendanceSessions > totalSessions) {
      throw new BadRequestException('Attendance sessions cannot exceed total sessions');
    }

    participant.attendanceSessions = attendanceSessions;
    participant.totalSessions = totalSessions;

    // The pre-save middleware will automatically calculate attendance_rate
    return participant.save();
  }

  async incrementAttendance(id: string): Promise<Participant> {
    const participant = await this.participantModel.findById(id);

    if (!participant) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }

    participant.attendanceSessions += 1;

    // The pre-save middleware will automatically calculate attendance_rate
    return participant.save();
  }

  async setTotalSessions(id: string, totalSessions: number): Promise<Participant> {
    const participant = await this.participantModel.findById(id);

    if (!participant) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }

    if (totalSessions < 0) {
      throw new BadRequestException('Total sessions cannot be negative');
    }

    participant.totalSessions = totalSessions;

    // The pre-save middleware will automatically calculate attendance_rate
    return participant.save();
  }

  // Assessment score methods
  async updateAssessmentScores(
    id: string,
    preAssessmentScore?: number,
    postAssessmentScore?: number,
  ): Promise<Participant> {
    const participant = await this.participantModel.findById(id);

    if (!participant) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }

    if (preAssessmentScore !== undefined) {
      if (preAssessmentScore < 0 || preAssessmentScore > 100) {
        throw new BadRequestException('Pre-assessment score must be between 0 and 100');
      }
      participant.preAssessmentScore = preAssessmentScore;
    }

    if (postAssessmentScore !== undefined) {
      if (postAssessmentScore < 0 || postAssessmentScore > 100) {
        throw new BadRequestException('Post-assessment score must be between 0 and 100');
      }
      participant.postAssessmentScore = postAssessmentScore;
    }

    // The pre-save middleware will automatically calculate improvement_percentage
    return participant.save();
  }

  // Statistics methods
  async getParticipantStats(id: string): Promise<any> {
    const participant = await this.findOne(id);

    return {
      participant: {
        id: participant._id,
        fullName: participant.fullName,
        status: participant.status,
      },
      attendance: {
        sessions_attended: participant.attendanceSessions,
        total_sessions: participant.totalSessions,
        attendance_rate: participant.attendanceRate,
      },
      assessment: {
        pre_score: participant.preAssessmentScore,
        post_score: participant.postAssessmentScore,
        improvement_percentage: participant.improvementPercentage,
      },
      registration: {
        date: participant.registrationDate,
        participation_type: participant.participationType,
      },
    };
  }

  async getProjectParticipantsStats(projectId: string): Promise<any> {
    const participants = await this.participantModel.find({ project: projectId });

    const totalParticipants = participants.length;
    const activeParticipants = participants.filter(p => p.status === 'active').length;
    const completedParticipants = participants.filter(p => p.status === 'completed').length;

    const avgAttendanceRate =
      totalParticipants > 0
        ? participants.reduce((sum, p) => sum + p.attendanceRate, 0) / totalParticipants
        : 0;

    const participantsWithScores = participants.filter(
      p => p.preAssessmentScore !== undefined && p.postAssessmentScore !== undefined,
    );

    const avgImprovement =
      participantsWithScores.length > 0
        ? participantsWithScores.reduce((sum, p) => sum + (p.improvementPercentage || 0), 0) /
          participantsWithScores.length
        : 0;

    const avgPreScore =
      participantsWithScores.length > 0
        ? participantsWithScores.reduce((sum, p) => sum + (p.preAssessmentScore || 0), 0) /
          participantsWithScores.length
        : 0;

    const avgPostScore =
      participantsWithScores.length > 0
        ? participantsWithScores.reduce((sum, p) => sum + (p.postAssessmentScore || 0), 0) /
          participantsWithScores.length
        : 0;

    return {
      project_id: projectId,
      total_participants: totalParticipants,
      active_participants: activeParticipants,
      completed_participants: completedParticipants,
      average_attendance_rate: Number(avgAttendanceRate.toFixed(2)),
      assessment_statistics: {
        participants_assessed: participantsWithScores.length,
        average_pre_score: Number(avgPreScore.toFixed(2)),
        average_post_score: Number(avgPostScore.toFixed(2)),
        average_improvement: Number(avgImprovement.toFixed(2)),
      },
      demographics: {
        by_gender: this.getGenderDistribution(participants),
        by_city: this.getCityDistribution(participants),
        average_age: this.getAverageAge(participants),
      },
    };
  }

  private getGenderDistribution(participants: Participant[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    participants.forEach(p => {
      const gender = p.gender || 'unknown';
      distribution[gender] = (distribution[gender] || 0) + 1;
    });
    return distribution;
  }

  private getCityDistribution(participants: Participant[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    participants.forEach(p => {
      const city = p.city || 'unknown';
      distribution[city] = (distribution[city] || 0) + 1;
    });
    return distribution;
  }

  private getAverageAge(participants: Participant[]): number {
    const participantsWithAge = participants.filter(p => p.age !== undefined);
    if (participantsWithAge.length === 0) return 0;
    const totalAge = participantsWithAge.reduce((sum, p) => sum + (p.age || 0), 0);
    return Number((totalAge / participantsWithAge.length).toFixed(1));
  }

  // Bulk operations
  async bulkUpdateAttendance(updates: Array<{ id: string; attended: boolean }>): Promise<void> {
    const bulkOps = updates.map(({ id, attended }) => ({
      updateOne: {
        filter: { _id: id } as any,
        update: { $inc: { attendanceSessions: attended ? 1 : 0 } },
      },
    }));

    await this.participantModel.bulkWrite(bulkOps as any);

    // Recalculate attendance rates for updated participants
    const participantIds = updates.map(u => u.id);
    const participants = await this.participantModel.find({ _id: { $in: participantIds } });

    for (const participant of participants) {
      await participant.save(); // Triggers pre-save middleware
    }
  }
}
