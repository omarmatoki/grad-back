import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as QRCode from 'qrcode';
import { Survey, SurveyStatus } from './schemas/survey.schema';
import { SurveyQuestion } from './schemas/survey-question.schema';
import { SurveySubmission } from './schemas/survey-submission.schema';
import { SurveyCorrectAnswer } from './schemas/survey-correct-answer.schema';
import { Activity } from '@modules/activities/schemas/activity.schema';
import { Project } from '@modules/projects/schemas/project.schema';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { CreateSurveyQuestionDto } from './dto/create-survey-question.dto';
import { SubmitSurveySubmissionDto } from './dto/submit-survey-submission.dto';
import { CreateCorrectAnswerDto } from './dto/create-correct-answer.dto';
import { UserRole } from '@modules/users/schemas/user.schema';

@Injectable()
export class SurveysService {
  constructor(
    @InjectModel(Survey.name) private surveyModel: Model<Survey>,
    @InjectModel(SurveyQuestion.name) private questionModel: Model<SurveyQuestion>,
    @InjectModel(SurveySubmission.name) private submissionModel: Model<SurveySubmission>,
    @InjectModel(SurveyCorrectAnswer.name) private correctAnswerModel: Model<SurveyCorrectAnswer>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
  ) {}

  // Check ownership via survey → activity → project
  private async assertSurveyProjectOwnership(surveyId: string, userId: string): Promise<void> {
    const survey = await this.surveyModel.findById(surveyId).lean().exec();
    if (!survey) throw new NotFoundException(`Survey with ID ${surveyId} not found`);
    await this.assertActivityProjectOwnership(survey.activity.toString(), userId);
  }

  private async assertActivityProjectOwnership(activityId: string, userId: string): Promise<void> {
    const activity = await this.activityModel.findById(activityId).lean().exec();
    if (!activity) throw new NotFoundException(`Activity with ID ${activityId} not found`);
    const project = await this.projectModel.findById(activity.project).lean().exec();
    if (!project) throw new NotFoundException('Project not found');
    if (project.user_id.toString() !== userId) {
      throw new ForbiddenException('You do not have permission on this project');
    }
  }

  private async getOwnedActivityIds(userId: string): Promise<Types.ObjectId[]> {
    const ownedProjects = await this.projectModel.find({ user_id: userId }).select('_id').lean().exec();
    const projectIds = ownedProjects.map((project) => project._id);

    if (!projectIds.length) {
      return [];
    }

    const ownedActivities = await this.activityModel
      .find({ project: { $in: projectIds } })
      .select('_id')
      .lean()
      .exec();

    return ownedActivities.map((activity) => new Types.ObjectId(activity._id));
  }

  // ── Survey CRUD ───────────────────────────────────────────────────────────

  async createSurvey(createSurveyDto: CreateSurveyDto, userId: string, userRole: UserRole): Promise<Survey> {
    if (userRole === UserRole.STAFF) {
      await this.assertActivityProjectOwnership(createSurveyDto.activity, userId);
    }
    const createdSurvey = new this.surveyModel(createSurveyDto);
    return createdSurvey.save();
  }

  async findAllSurveys(filters?: any, userId?: string, userRole?: UserRole): Promise<any[]> {
    const query: Record<string, any> = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.activity) {
      const activityId = String(filters.activity);
      if (!Types.ObjectId.isValid(activityId)) {
        throw new BadRequestException(`Invalid activity ID: ${activityId}`);
      }
      query.activity = new Types.ObjectId(activityId);
    }

    if (userRole === UserRole.STAFF && userId) {
      const ownedActivityIds = await this.getOwnedActivityIds(userId);

      if (query.activity) {
        const hasAccess = ownedActivityIds.some(
          (activityId) => activityId.toString() === query.activity.toString(),
        );
        if (!hasAccess) {
          return [];
        }
      }

      query.activity = query.activity
        ? query.activity
        : { $in: ownedActivityIds };
    }

    if (filters?.search) {
      const search = String(filters.search).trim();
      if (search.length > 0) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }
    }

    const surveys = await this.surveyModel
      .find(query)
      .populate('activity', 'title activityDate status')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (!surveys.length) {
      return surveys;
    }

    const surveyObjectIds = surveys.map((s) => s._id);
    const submissionCounts = await this.submissionModel.aggregate([
      { $match: { survey: { $in: surveyObjectIds } } },
      {
        $group: {
          _id: {
            survey: '$survey',
            beneficiary: { $ifNull: ['$beneficiary', 'anonymous'] },
            startedAt: '$startedAt',
          },
        },
      },
      { $group: { _id: '$_id.survey', count: { $sum: 1 } } },
    ]);

    const countBySurveyId = new Map<string, number>(
      submissionCounts.map((item: { _id: Types.ObjectId; count: number }) => [
        item._id.toString(),
        item.count,
      ]),
    );

    for (const survey of surveys) {
      const responsesCount = countBySurveyId.get(survey._id.toString()) ?? 0;
      (survey as any).currentResponses = responsesCount;
      (survey as any).totalResponses = responsesCount;
    }

    return surveys;
  }

  async findByActivity(activityId: string, userId?: string, userRole?: UserRole): Promise<Survey[]> {
    if (userRole === UserRole.STAFF && userId) {
      await this.assertActivityProjectOwnership(activityId, userId);
    }

    return this.surveyModel
      .find({ activity: new Types.ObjectId(activityId) })
      .populate('activity', 'title activityDate status')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOneSurvey(id: string, userId?: string, userRole?: UserRole): Promise<Survey> {
    const survey = await this.surveyModel
      .findById(id)
      .populate('activity')
      .exec();

    if (!survey) {
      throw new NotFoundException(`Survey with ID ${id} not found`);
    }

    if (userRole === UserRole.STAFF && userId) {
      await this.assertActivityProjectOwnership(survey.activity.toString(), userId);
    }

    return survey;
  }

  async updateSurvey(id: string, updateData: Partial<CreateSurveyDto>, userId: string, userRole: UserRole): Promise<Survey> {
    if (userRole === UserRole.STAFF) {
      await this.assertSurveyProjectOwnership(id, userId);
    }
    const updated = await this.surveyModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Survey with ID ${id} not found`);
    }

    return updated;
  }

  async deleteSurvey(id: string, userId: string, userRole: UserRole): Promise<void> {
    if (userRole === UserRole.STAFF) {
      await this.assertSurveyProjectOwnership(id, userId);
    }
    await this.questionModel.deleteMany({ survey: id });
    await this.submissionModel.deleteMany({ survey: id });
    const result = await this.surveyModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Survey with ID ${id} not found`);
    }
  }

  // ── Question Management ───────────────────────────────────────────────────

  async addQuestion(createQuestionDto: CreateSurveyQuestionDto, userId: string, userRole: UserRole): Promise<SurveyQuestion> {
    if (userRole === UserRole.STAFF) {
      await this.assertSurveyProjectOwnership(createQuestionDto.survey, userId);
    }
    await this.findOneSurvey(createQuestionDto.survey);
    const question = new this.questionModel(createQuestionDto);
    return question.save();
  }

  async getQuestions(surveyId: string, userId?: string, userRole?: UserRole): Promise<SurveyQuestion[]> {
    if (userRole === UserRole.STAFF && userId) {
      await this.assertSurveyProjectOwnership(surveyId, userId);
    }

    return this.questionModel
      .find({ survey: surveyId })
      .sort({ createdAt: 1 })
      .exec();
  }

  async updateQuestion(
    id: string,
    updateData: Partial<CreateSurveyQuestionDto>,
    userId: string,
    userRole: UserRole,
  ): Promise<SurveyQuestion> {
    if (userRole === UserRole.STAFF) {
      const question = await this.questionModel.findById(id).lean().exec();
      if (!question) throw new NotFoundException(`Question with ID ${id} not found`);
      await this.assertSurveyProjectOwnership(question.survey.toString(), userId);
    }
    const updated = await this.questionModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return updated;
  }

  async deleteQuestion(id: string, userId: string, userRole: UserRole): Promise<void> {
    if (userRole === UserRole.STAFF) {
      const question = await this.questionModel.findById(id).lean().exec();
      if (!question) throw new NotFoundException(`Question with ID ${id} not found`);
      await this.assertSurveyProjectOwnership(question.survey.toString(), userId);
    }
    await this.correctAnswerModel.deleteMany({ question: id });
    const result = await this.questionModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
  }

  // ── Correct Answers ───────────────────────────────────────────────────────

  async addCorrectAnswer(dto: CreateCorrectAnswerDto, userId: string, userRole: UserRole): Promise<SurveyCorrectAnswer> {
    const question = await this.questionModel.findById(dto.question).exec();
    if (!question) {
      throw new NotFoundException(`Question with ID ${dto.question} not found`);
    }
    if (userRole === UserRole.STAFF) {
      await this.assertSurveyProjectOwnership(question.survey.toString(), userId);
    }
    return new this.correctAnswerModel(dto).save();
  }

  async getCorrectAnswers(questionId: string, userId?: string, userRole?: UserRole): Promise<SurveyCorrectAnswer[]> {
    if (userRole === UserRole.STAFF && userId) {
      const question = await this.questionModel.findById(questionId).lean().exec();
      if (!question) {
        throw new NotFoundException(`Question with ID ${questionId} not found`);
      }
      await this.assertSurveyProjectOwnership(question.survey.toString(), userId);
    }

    return this.correctAnswerModel.find({ question: questionId }).exec();
  }

  async deleteCorrectAnswer(id: string, userId?: string, userRole?: UserRole): Promise<void> {
    if (userRole === UserRole.STAFF && userId) {
      const answer = await this.correctAnswerModel.findById(id).lean().exec();
      if (!answer) {
        throw new NotFoundException(`Correct answer with ID ${id} not found`);
      }

      const question = await this.questionModel.findById(answer.question).lean().exec();
      if (!question) {
        throw new NotFoundException(`Question with ID ${answer.question} not found`);
      }

      await this.assertSurveyProjectOwnership(question.survey.toString(), userId);
    }

    const result = await this.correctAnswerModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Correct answer with ID ${id} not found`);
    }
  }

  // ── Response Submission ───────────────────────────────────────────────────

  async submitResponse(submitDto: SubmitSurveySubmissionDto): Promise<any> {
    await this.findOneSurvey(submitDto.survey);
    const questions = await this.getQuestions(submitDto.survey);

    const requiredQuestions = questions.filter(q => q.isRequired);
    const answeredQuestionIds = submitDto.answers.map(a => a.question);

    const missingRequired = requiredQuestions.filter(
      q => !answeredQuestionIds.includes(q._id.toString()),
    );

    if (missingRequired.length > 0) {
      throw new BadRequestException(
        `Missing required questions: ${missingRequired.map(q => q.questionText).join(', ')}`,
      );
    }

    const sessionStartedAt = submitDto.startedAt
      ? new Date(submitDto.startedAt)
      : new Date();
    const completedAt = new Date();

    const submissions = await Promise.all(
      submitDto.answers.map(answerDto =>
        new this.submissionModel({
          survey: submitDto.survey,
          question: answerDto.question,
          beneficiary: submitDto.beneficiary,
          startedAt: sessionStartedAt,
          completedAt,
          textValue: answerDto.textValue,
          numberValue: answerDto.numberValue,
          booleanValue: answerDto.booleanValue,
          dateValue: answerDto.dateValue,
          arrayValue: answerDto.arrayValue,
        }).save(),
      ),
    );

    await this.surveyModel.findByIdAndUpdate(submitDto.survey, {
      $inc: { totalResponses: 1 },
    });

    return {
      sessionId: `${submitDto.survey}_${submitDto.beneficiary ?? 'anon'}_${sessionStartedAt.getTime()}`,
      survey: submitDto.survey,
      beneficiary: submitDto.beneficiary,
      submittedAt: completedAt,
      submissionsCount: submissions.length,
      submissions,
    };
  }

  // ── Retrieval ─────────────────────────────────────────────────────────────

  async getResponses(surveyId: string, userId?: string, userRole?: UserRole): Promise<any[]> {
    if (!Types.ObjectId.isValid(surveyId)) {
      throw new BadRequestException(`Invalid survey ID: ${surveyId}`);
    }

    const surveyOid = new Types.ObjectId(surveyId);

    const survey = await this.surveyModel.findById(surveyOid).lean().exec();
    if (!survey) throw new NotFoundException(`Survey with ID ${surveyId} not found`);

    if (userRole === UserRole.STAFF && userId) {
      await this.assertSurveyProjectOwnership(surveyId, userId);
    }

    const submissions = await this.submissionModel
      .find({ survey: surveyOid })
      .populate('question', 'questionText type')
      .populate('beneficiary', 'name phone')
      .sort({ startedAt: -1 })
      .exec();

    const sessionsMap = new Map<string, any>();

    for (const sub of submissions) {
      const beneficiaryDoc = sub.beneficiary as any;
      const respondentId = beneficiaryDoc
        ? (beneficiaryDoc._id?.toString() ?? beneficiaryDoc.toString())
        : 'anonymous';

      // Round startedAt to nearest second to group answers from the same session
      const sessionTs = Math.round(sub.startedAt.getTime() / 1000) * 1000;
      const sessionKey = `${surveyId}_${respondentId}_${sessionTs}`;

      if (!sessionsMap.has(sessionKey)) {
        sessionsMap.set(sessionKey, {
          sessionKey,
          survey: surveyId,
          beneficiary: sub.beneficiary,
          startedAt: sub.startedAt,
          completedAt: sub.completedAt,
          answers: [],
        });
      }

      sessionsMap.get(sessionKey)!.answers.push({
        submissionId: sub._id,
        question: sub.question,
        textValue: sub.textValue,
        numberValue: sub.numberValue,
        booleanValue: sub.booleanValue,
        dateValue: sub.dateValue,
        arrayValue: sub.arrayValue,
        isCorrect: sub.isCorrect,
      });
    }

    return Array.from(sessionsMap.values());
  }

  async getSubmissionById(submissionId: string, userId?: string, userRole?: UserRole): Promise<SurveySubmission> {
    const submission = await this.submissionModel
      .findById(submissionId)
      .populate('survey', 'title type')
      .populate('question', 'questionText type')
      .populate('beneficiary', 'name')
      .exec();

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    if (userRole === UserRole.STAFF && userId) {
      await this.assertSurveyProjectOwnership((submission.survey as any)._id.toString(), userId);
    }

    return submission;
  }

  async getResponseWithAnswers(sessionKey: string, userId?: string, userRole?: UserRole): Promise<any> {
    const parts = sessionKey.split('_');
    if (parts.length < 3) {
      throw new BadRequestException('Invalid session key format');
    }
    const [surveyId, respondentId, ts] = parts;
    if (!Types.ObjectId.isValid(surveyId)) {
      throw new BadRequestException(`Invalid survey ID in session key: ${surveyId}`);
    }

    if (userRole === UserRole.STAFF && userId) {
      await this.assertSurveyProjectOwnership(surveyId, userId);
    }

    const startedAtMs = Number(ts);
    if (!Number.isFinite(startedAtMs)) {
      throw new BadRequestException('Invalid timestamp in session key');
    }
    const startedAt = new Date(startedAtMs);
    const surveyOid = new Types.ObjectId(surveyId);

    const respondentFilter = Types.ObjectId.isValid(respondentId)
      ? { beneficiary: new Types.ObjectId(respondentId) }
      : {};

    const submissions = await this.submissionModel
      .find({
        survey: surveyOid,
        startedAt: { $gte: new Date(startedAt.getTime() - 1000), $lte: new Date(startedAt.getTime() + 1000) },
        ...respondentFilter,
      })
      .populate('question', 'questionText type')
      .populate('beneficiary', 'name phone')
      .exec();

    if (!submissions.length) {
      throw new NotFoundException('Session not found');
    }

    return {
      sessionKey,
      survey: surveyId,
      beneficiary: submissions[0].beneficiary,
      startedAt: submissions[0].startedAt,
      completedAt: submissions[0].completedAt,
      answers: submissions.map(s => ({
        submissionId: s._id,
        question: s.question,
        textValue: s.textValue,
        numberValue: s.numberValue,
        booleanValue: s.booleanValue,
        dateValue: s.dateValue,
        arrayValue: s.arrayValue,
        isCorrect: s.isCorrect,
      })),
    };
  }

  // ── QR Code ───────────────────────────────────────────────────────────────

  async generateQrCode(id: string, frontendBaseUrl: string, userId: string, userRole: UserRole): Promise<Survey> {
    if (userRole === UserRole.STAFF) {
      await this.assertSurveyProjectOwnership(id, userId);
    }
    const survey = await this.findOneSurvey(id, userId, userRole);
    const publicUrl = `${frontendBaseUrl}/survey/${id}`;
    const qrDataUrl = await QRCode.toDataURL(publicUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    });
    const updated = await this.surveyModel
      .findByIdAndUpdate(id, { qrCode: qrDataUrl }, { new: true })
      .exec();
    return updated!;
  }

  // ── Public Endpoints (no auth) ─────────────────────────────────────────────

  async getPublicSurvey(id: string): Promise<{ survey: Survey; questions: SurveyQuestion[] }> {
    const survey = await this.surveyModel.findById(id).exec();
    if (!survey) throw new NotFoundException(`Survey with ID ${id} not found`);
    if (survey.status !== SurveyStatus.ACTIVE) {
      throw new BadRequestException('هذا الاستبيان غير متاح حالياً');
    }
    const questions = await this.getQuestions(id);
    return { survey, questions };
  }

  async publicSubmit(submitDto: SubmitSurveySubmissionDto): Promise<any> {
    const survey = await this.surveyModel.findById(submitDto.survey).exec();
    if (!survey) throw new NotFoundException('الاستبيان غير موجود');
    if (survey.status !== SurveyStatus.ACTIVE) {
      throw new BadRequestException('هذا الاستبيان غير متاح حالياً');
    }
    return this.submitResponse(submitDto);
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  async getSurveyAnalytics(surveyId: string, userId?: string, userRole?: UserRole): Promise<any> {
    const questions = await this.getQuestions(surveyId, userId, userRole);
    const totalQuestions = questions.length;

    // Single query for all submissions — used for both session stats and per-question analysis
    const allSubmissions = await this.submissionModel
      .find({ survey: surveyId })
      .exec();

    // Group submissions by session (beneficiary + startedAt timestamp)
    const sessionMap = new Map<string, any[]>();
    for (const sub of allSubmissions) {
      const bId = sub.beneficiary?.toString() ?? 'anon';
      const key = `${bId}_${sub.startedAt.getTime()}`;
      if (!sessionMap.has(key)) sessionMap.set(key, []);
      sessionMap.get(key)!.push(sub);
    }

    const totalResponses = sessionMap.size;
    let completedSessions = 0;
    let totalCompletionTime = 0;
    let sessionsWithTime = 0;
    const dateCountMap: Record<string, number> = {};

    for (const subs of sessionMap.values()) {
      // Completed = answered all questions or has completedAt
      const hasCompletedAt = subs.some(s => s.completedAt);
      const answeredAll = totalQuestions > 0 && subs.length >= totalQuestions;
      if (hasCompletedAt || answeredAll) completedSessions++;

      // Completion time: use any submission that has both startedAt and completedAt
      const subWithTime = subs.find(s => s.startedAt && s.completedAt);
      if (subWithTime) {
        const diffSeconds =
          (subWithTime.completedAt.getTime() - subWithTime.startedAt.getTime()) / 1000;
        if (diffSeconds > 0) {
          totalCompletionTime += diffSeconds;
          sessionsWithTime++;
        }
      }

      // Group by date
      const dateStr = subs[0].startedAt.toISOString().split('T')[0];
      dateCountMap[dateStr] = (dateCountMap[dateStr] || 0) + 1;
    }

    const completionRate = totalResponses > 0 ? (completedSessions / totalResponses) * 100 : 0;
    const averageCompletionTime =
      sessionsWithTime > 0 ? Math.round(totalCompletionTime / sessionsWithTime) : 0;

    const responsesByDate = Object.entries(dateCountMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalResponses,
      completionRate,
      averageCompletionTime,
      responsesByDate,
      questionAnalytics: this.analyzeQuestions(questions, allSubmissions),
    };
  }

  private analyzeQuestions(questions: SurveyQuestion[], allSubmissions: any[]): any[] {
    return questions.map(question => {
      // Use string comparison to avoid ObjectId type mismatch in filtering
      const qIdStr = question._id.toString();
      const answers = allSubmissions.filter(
        sub => sub.question.toString() === qIdStr,
      );

      const analysisResult = this.analyzeAnswersByType(question, answers);
      return {
        questionId: question._id,
        questionText: question.questionText,
        type: question.type,
        totalAnswers: answers.length,
        ...analysisResult,
      };
    });
  }

  private analyzeAnswersByType(question: SurveyQuestion, answers: any[]): any {
    switch (question.type) {
      case 'rating':
      case 'scale':
      case 'number':
        return this.analyzeNumericAnswers(answers);
      case 'single_choice':
      case 'multiple_choice':
      case 'dropdown':
        return this.analyzeChoiceAnswers(answers);
      case 'text':
      case 'textarea':
        return {};
      case 'yes_no':
        return this.analyzeYesNoAnswers(answers);
      default:
        return {};
    }
  }

  private analyzeNumericAnswers(answers: any[]): any {
    const values = answers
      .map(a => a.numberValue)
      .filter(v => v !== null && v !== undefined) as number[];
    if (values.length === 0) return { average: 0, median: 0 };

    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;

    return { average, median };
  }

  private analyzeChoiceAnswers(answers: any[]): any {
    const counts: Record<string, number> = {};
    answers.forEach(answer => {
      if (Array.isArray(answer.arrayValue) && answer.arrayValue.length > 0) {
        answer.arrayValue.forEach((value: string) => {
          if (value) counts[value] = (counts[value] || 0) + 1;
        });
        return;
      }
      const value = answer.textValue;
      if (value) counts[value] = (counts[value] || 0) + 1;
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const distribution = Object.entries(counts).map(([value, count]) => ({
      value,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));

    return { distribution };
  }

  private analyzeYesNoAnswers(answers: any[]): any {
    const yes = answers.filter(a => a.booleanValue === true).length;
    const no = answers.filter(a => a.booleanValue === false).length;
    const total = yes + no;

    const distribution = [
      { value: 'نعم', count: yes, percentage: total ? (yes / total) * 100 : 0 },
      { value: 'لا', count: no, percentage: total ? (no / total) * 100 : 0 },
    ];

    return { distribution };
  }
}
