import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Survey } from './schemas/survey.schema';
import { SurveyQuestion } from './schemas/survey-question.schema';
import { SurveyResponse, ResponseStatus } from './schemas/survey-response.schema';
import { SurveyAnswer } from './schemas/survey-answer.schema';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { CreateSurveyQuestionDto } from './dto/create-survey-question.dto';
import { SubmitSurveyResponseDto } from './dto/submit-survey-response.dto';

@Injectable()
export class SurveysService {
  constructor(
    @InjectModel(Survey.name) private surveyModel: Model<Survey>,
    @InjectModel(SurveyQuestion.name) private questionModel: Model<SurveyQuestion>,
    @InjectModel(SurveyResponse.name) private responseModel: Model<SurveyResponse>,
    @InjectModel(SurveyAnswer.name) private answerModel: Model<SurveyAnswer>,
  ) {}

  // Survey CRUD
  async createSurvey(createSurveyDto: CreateSurveyDto): Promise<Survey> {
    const createdSurvey = new this.surveyModel(createSurveyDto);
    return createdSurvey.save();
  }

  async findAllSurveys(filters?: any): Promise<Survey[]> {
    return this.surveyModel
      .find(filters || {})
      .populate('project', 'name')
      .populate('activity', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOneSurvey(id: string): Promise<Survey> {
    const survey = await this.surveyModel
      .findById(id)
      .populate('project')
      .populate('activity')
      .exec();

    if (!survey) {
      throw new NotFoundException(`Survey with ID ${id} not found`);
    }

    return survey;
  }

  async updateSurvey(id: string, updateData: Partial<CreateSurveyDto>): Promise<Survey> {
    const updated = await this.surveyModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Survey with ID ${id} not found`);
    }

    return updated;
  }

  async deleteSurvey(id: string): Promise<void> {
    // Also delete all related questions
    await this.questionModel.deleteMany({ survey: id });
    const result = await this.surveyModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Survey with ID ${id} not found`);
    }
  }

  // Question Management
  async addQuestion(createQuestionDto: CreateSurveyQuestionDto): Promise<SurveyQuestion> {
    const survey = await this.findOneSurvey(createQuestionDto.survey);

    const question = new this.questionModel(createQuestionDto);
    return question.save();
  }

  async getQuestions(surveyId: string): Promise<SurveyQuestion[]> {
    return this.questionModel
      .find({ survey: surveyId })
      .sort({ order: 1 })
      .exec();
  }

  async updateQuestion(id: string, updateData: Partial<CreateSurveyQuestionDto>): Promise<SurveyQuestion> {
    const updated = await this.questionModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return updated;
  }

  async deleteQuestion(id: string): Promise<void> {
    const result = await this.questionModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
  }

  // Response Submission
  async submitResponse(submitDto: SubmitSurveyResponseDto): Promise<any> {
    const survey = await this.findOneSurvey(submitDto.survey);
    const questions = await this.getQuestions(submitDto.survey);

    // Validate all required questions are answered
    const requiredQuestions = questions.filter(q => q.isRequired);
    const answeredQuestionIds = submitDto.answers.map(a => a.question);

    const missingRequired = requiredQuestions.filter(
      q => !answeredQuestionIds.includes(q._id.toString())
    );

    if (missingRequired.length > 0) {
      throw new BadRequestException(
        `Missing required questions: ${missingRequired.map(q => q.questionText).join(', ')}`
      );
    }

    // Create response
    const response = new this.responseModel({
      survey: submitDto.survey,
      beneficiary: submitDto.beneficiary,
      participant: submitDto.participant,
      status: ResponseStatus.COMPLETED,
      startedAt: new Date(),
      completedAt: new Date(),
      completionPercentage: 100,
      metadata: submitDto.metadata,
    });

    const savedResponse = await response.save();

    // Create answers
    const answers = await Promise.all(
      submitDto.answers.map(answerDto =>
        new this.answerModel({
          surveyResponse: savedResponse._id,
          question: answerDto.question,
          valueType: answerDto.valueType,
          textValue: answerDto.textValue,
          numberValue: answerDto.numberValue,
          booleanValue: answerDto.booleanValue,
          dateValue: answerDto.dateValue,
          arrayValue: answerDto.arrayValue,
          objectValue: answerDto.objectValue,
          fileUrl: answerDto.fileUrl,
          timeSpent: answerDto.timeSpent,
        }).save()
      )
    );

    // Update survey total responses
    await this.surveyModel.findByIdAndUpdate(submitDto.survey, {
      $inc: { totalResponses: 1 },
    });

    return {
      response: savedResponse,
      answers,
      message: 'Survey response submitted successfully',
    };
  }

  // Get Responses
  async getResponses(surveyId: string): Promise<any[]> {
    return this.responseModel
      .find({ survey: surveyId })
      .populate('beneficiary', 'name')
      .populate('participant', 'name')
      .sort({ completedAt: -1 })
      .exec();
  }

  async getResponseWithAnswers(responseId: string): Promise<any> {
    const response = await this.responseModel
      .findById(responseId)
      .populate('survey')
      .populate('beneficiary')
      .populate('participant')
      .exec();

    if (!response) {
      throw new NotFoundException(`Response with ID ${responseId} not found`);
    }

    const answers = await this.answerModel
      .find({ surveyResponse: responseId })
      .populate('question')
      .exec();

    return {
      ...response.toObject(),
      answers,
    };
  }

  // Analytics
  async getSurveyAnalytics(surveyId: string): Promise<any> {
    const survey = await this.findOneSurvey(surveyId);
    const responses = await this.responseModel.find({ survey: surveyId });
    const questions = await this.getQuestions(surveyId);

    const analytics = {
      survey: {
        id: survey._id,
        title: survey.title,
        type: survey.type,
      },
      totalResponses: responses.length,
      completedResponses: responses.filter(r => r.status === ResponseStatus.COMPLETED).length,
      averageCompletionTime: this.calculateAverageTime(responses),
      questionAnalytics: await this.analyzeQuestions(surveyId, questions),
    };

    return analytics;
  }

  private calculateAverageTime(responses: any[]): number {
    const completedResponses = responses.filter(r => r.completedAt && r.startedAt);
    if (completedResponses.length === 0) return 0;

    const total = completedResponses.reduce((sum, r) => {
      return sum + (r.completedAt.getTime() - r.startedAt.getTime());
    }, 0);

    return Math.round(total / completedResponses.length / 1000); // Convert to seconds
  }

  private async analyzeQuestions(surveyId: string, questions: SurveyQuestion[]): Promise<any[]> {
    const analytics = [];

    for (const question of questions) {
      const answers = await this.answerModel.find({ question: question._id });

      const questionAnalytics = {
        questionId: question._id,
        questionText: question.questionText,
        type: question.type,
        totalAnswers: answers.length,
        analysis: this.analyzeAnswersByType(question, answers),
      };

      analytics.push(questionAnalytics);
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

    if (values.length === 0) {
      return { average: 0, min: 0, max: 0, count: 0 };
    }

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
      const values = answer.arrayValue || [answer.textValue];
      values.forEach((value: string) => {
        if (value) {
          distribution[value] = (distribution[value] || 0) + 1;
        }
      });
    });

    return { distribution, total: answers.length };
  }

  private analyzeTextAnswers(answers: any[]): any {
    const texts = answers.map(a => a.textValue).filter(t => t);

    return {
      count: texts.length,
      averageLength: texts.reduce((sum, t) => sum + t.length, 0) / texts.length || 0,
      samples: texts.slice(0, 5), // First 5 samples
    };
  }

  private analyzeYesNoAnswers(answers: any[]): any {
    const yes = answers.filter(a => a.booleanValue === true).length;
    const no = answers.filter(a => a.booleanValue === false).length;

    return {
      yes,
      no,
      yesPercentage: (yes / (yes + no)) * 100 || 0,
      noPercentage: (no / (yes + no)) * 100 || 0,
    };
  }
}
