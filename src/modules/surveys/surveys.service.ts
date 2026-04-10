import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Survey } from './schemas/survey.schema';
import { SurveyQuestion } from './schemas/survey-question.schema';
import { SurveySubmission } from './schemas/survey-submission.schema';
import { SurveyCorrectAnswer } from './schemas/survey-correct-answer.schema';
import { Activity } from '@modules/activities/schemas/activity.schema';
import { Project } from '@modules/projects/schemas/project.schema';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { CreateSurveyQuestionDto } from './dto/create-survey-question.dto';
import { SubmitSurveyResponseDto } from './dto/submit-survey-response.dto';
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

  // ── Survey CRUD ───────────────────────────────────────────────────────────

  async createSurvey(createSurveyDto: CreateSurveyDto, userId: string, userRole: UserRole): Promise<Survey> {
    if (userRole === UserRole.STAFF) {
      await this.assertActivityProjectOwnership(createSurveyDto.activity, userId);
    }
    const createdSurvey = new this.surveyModel(createSurveyDto);
    return createdSurvey.save();
  }

  async findAllSurveys(filters?: any): Promise<Survey[]> {
    return this.surveyModel
      .find(filters || {})
      .populate('activity', 'title activityDate status')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByActivity(activityId: string): Promise<Survey[]> {
    return this.surveyModel
      .find({ activity: new Types.ObjectId(activityId) })
      .populate('activity', 'title activityDate status')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOneSurvey(id: string): Promise<Survey> {
    const survey = await this.surveyModel
      .findById(id)
      .populate('activity')
      .exec();

    if (!survey) {
      throw new NotFoundException(`Survey with ID ${id} not found`);
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

  async getQuestions(surveyId: string): Promise<SurveyQuestion[]> {
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

  async getCorrectAnswers(questionId: string): Promise<SurveyCorrectAnswer[]> {
    return this.correctAnswerModel.find({ question: questionId }).exec();
  }

  async deleteCorrectAnswer(id: string): Promise<void> {
    const result = await this.correctAnswerModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Correct answer with ID ${id} not found`);
    }
  }

  // ── Response Submission ───────────────────────────────────────────────────

  async submitResponse(submitDto: SubmitSurveyResponseDto): Promise<any> {
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

    const sessionStartedAt = new Date();
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

  async getResponses(surveyId: string): Promise<any[]> {
    const submissions = await this.submissionModel
      .find({ survey: surveyId })
      .populate('question', 'questionText type')
      .populate('beneficiary', 'name')
      .sort({ startedAt: -1 })
      .exec();

    const sessionsMap = new Map<string, any>();

    for (const sub of submissions) {
      const respondentKey = sub.beneficiary?.toString() ?? 'anonymous';
      const sessionKey = `${respondentKey}_${sub.startedAt.getTime()}`;

      if (!sessionsMap.has(sessionKey)) {
        sessionsMap.set(sessionKey, {
          survey: surveyId,
          beneficiary: sub.beneficiary,
          startedAt: sub.startedAt,
          completedAt: sub.completedAt,
          answers: [],
        });
      }

      sessionsMap.get(sessionKey).answers.push({
        submissionId: sub._id,
        question: sub.question,
        textValue: sub.textValue,
        numberValue: sub.numberValue,
        booleanValue: sub.booleanValue,
        dateValue: sub.dateValue,
        isCorrect: sub.isCorrect,
      });
    }

    return Array.from(sessionsMap.values());
  }

  async getSubmissionById(submissionId: string): Promise<SurveySubmission> {
    const submission = await this.submissionModel
      .findById(submissionId)
      .populate('survey', 'title type')
      .populate('question', 'questionText type')
      .populate('beneficiary', 'name')
      .exec();

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    return submission;
  }

  async getResponseWithAnswers(sessionKey: string): Promise<any> {
    const parts = sessionKey.split('_');
    if (parts.length < 3) {
      throw new BadRequestException('Invalid session key format');
    }
    const [surveyId, respondentId, ts] = parts;
    const startedAt = new Date(Number(ts));

    const respondentFilter = Types.ObjectId.isValid(respondentId)
      ? { beneficiary: respondentId }
      : {};

    const submissions = await this.submissionModel
      .find({
        survey: surveyId,
        startedAt: { $gte: new Date(startedAt.getTime() - 1000), $lte: new Date(startedAt.getTime() + 1000) },
        ...respondentFilter,
      })
      .populate('question', 'questionText type')
      .populate('beneficiary', 'name')
      .exec();

    if (!submissions.length) {
      throw new NotFoundException('Session not found');
    }

    return {
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
        isCorrect: s.isCorrect,
      })),
    };
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  async getSurveyAnalytics(surveyId: string): Promise<any> {
    const survey = await this.findOneSurvey(surveyId);
    const questions = await this.getQuestions(surveyId);

    const allSubmissions = await this.submissionModel
      .find({ survey: surveyId })
      .exec();

    const sessionKeys = new Set(
      allSubmissions.map(s => {
        const r = s.beneficiary?.toString() ?? 'anon';
        return `${r}_${s.startedAt.getTime()}`;
      }),
    );

    return {
      survey: { id: survey._id, title: survey.title, type: survey.type },
      totalSessions: sessionKeys.size,
      totalSubmissions: allSubmissions.length,
      questionAnalytics: await this.analyzeQuestions(surveyId, questions),
    };
  }

  private async analyzeQuestions(surveyId: string, questions: SurveyQuestion[]): Promise<any[]> {
    const analytics: any[] = [];

    for (const question of questions) {
      const answers = await this.submissionModel
        .find({ survey: surveyId, question: question._id })
        .exec();

      analytics.push({
        questionId: question._id,
        questionText: question.questionText,
        type: question.type,
        totalAnswers: answers.length,
        analysis: this.analyzeAnswersByType(question, answers),
      });
    }

    return analytics;
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
        return this.analyzeTextAnswers(answers);
      case 'yes_no':
        return this.analyzeYesNoAnswers(answers);
      default:
        return { type: 'other', count: answers.length };
    }
  }

  private analyzeNumericAnswers(answers: any[]): any {
    const values = answers.map(a => a.numberValue).filter(v => v !== null && v !== undefined);
    if (values.length === 0) return { average: 0, min: 0, max: 0, count: 0 };
    return {
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  private analyzeChoiceAnswers(answers: any[]): any {
    const distribution: Record<string, number> = {};
    answers.forEach(answer => {
      const value = answer.textValue;
      if (value) distribution[value] = (distribution[value] || 0) + 1;
    });
    return { distribution, total: answers.length };
  }

  private analyzeTextAnswers(answers: any[]): any {
    const texts = answers.map(a => a.textValue).filter(t => t);
    return {
      count: texts.length,
      averageLength: texts.length ? texts.reduce((sum, t) => sum + t.length, 0) / texts.length : 0,
      samples: texts.slice(0, 5),
    };
  }

  private analyzeYesNoAnswers(answers: any[]): any {
    const yes = answers.filter(a => a.booleanValue === true).length;
    const no = answers.filter(a => a.booleanValue === false).length;
    const total = yes + no;
    return {
      yes,
      no,
      yesPercentage: total ? (yes / total) * 100 : 0,
      noPercentage: total ? (no / total) * 100 : 0,
    };
  }
}
