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
import { SurveysService } from './surveys.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { CreateSurveyQuestionDto } from './dto/create-survey-question.dto';
import { SubmitSurveyResponseDto } from './dto/submit-survey-response.dto';
import { CreateCorrectAnswerDto } from './dto/create-correct-answer.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@modules/users/schemas/user.schema';

@ApiTags('Surveys')
@ApiBearerAuth()
@Controller('surveys')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  // ── Survey CRUD ────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new survey' })
  @ApiResponse({ status: 201, description: 'Survey created successfully' })
  createSurvey(@Body() createSurveyDto: CreateSurveyDto) {
    return this.surveysService.createSurvey(createSurveyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all surveys' })
  @ApiResponse({ status: 200, description: 'Surveys retrieved successfully' })
  findAllSurveys(@Query() filters: any) {
    return this.surveysService.findAllSurveys(filters);
  }

  @Get('activity/:activityId')
  @ApiOperation({ summary: 'Get all surveys for a specific activity' })
  @ApiResponse({ status: 200, description: 'Surveys retrieved successfully' })
  findByActivity(@Param('activityId') activityId: string) {
    return this.surveysService.findByActivity(activityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get survey by ID' })
  @ApiResponse({ status: 200, description: 'Survey retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Survey not found' })
  findOneSurvey(@Param('id') id: string) {
    return this.surveysService.findOneSurvey(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update survey' })
  @ApiResponse({ status: 200, description: 'Survey updated successfully' })
  updateSurvey(@Param('id') id: string, @Body() updateData: Partial<CreateSurveyDto>) {
    return this.surveysService.updateSurvey(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete survey and all its data' })
  @ApiResponse({ status: 200, description: 'Survey deleted successfully' })
  deleteSurvey(@Param('id') id: string) {
    return this.surveysService.deleteSurvey(id);
  }

  // ── Questions ──────────────────────────────────────────────────────────────

  @Post('questions')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add question to survey' })
  @ApiResponse({ status: 201, description: 'Question added successfully' })
  addQuestion(@Body() createQuestionDto: CreateSurveyQuestionDto) {
    return this.surveysService.addQuestion(createQuestionDto);
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get all questions for survey' })
  @ApiResponse({ status: 200, description: 'Questions retrieved successfully' })
  getQuestions(@Param('id') surveyId: string) {
    return this.surveysService.getQuestions(surveyId);
  }

  @Patch('questions/:questionId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update question' })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  updateQuestion(
    @Param('questionId') questionId: string,
    @Body() updateData: Partial<CreateSurveyQuestionDto>,
  ) {
    return this.surveysService.updateQuestion(questionId, updateData);
  }

  @Delete('questions/:questionId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete question and its correct answers' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  deleteQuestion(@Param('questionId') questionId: string) {
    return this.surveysService.deleteQuestion(questionId);
  }

  // ── Correct Answers ────────────────────────────────────────────────────────

  @Post('correct-answers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a correct answer for a question' })
  @ApiResponse({ status: 201, description: 'Correct answer added' })
  addCorrectAnswer(@Body() dto: CreateCorrectAnswerDto) {
    return this.surveysService.addCorrectAnswer(dto);
  }

  @Get('questions/:questionId/correct-answers')
  @ApiOperation({ summary: 'Get correct answers for a question' })
  @ApiResponse({ status: 200, description: 'Correct answers retrieved' })
  getCorrectAnswers(@Param('questionId') questionId: string) {
    return this.surveysService.getCorrectAnswers(questionId);
  }

  @Delete('correct-answers/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a correct answer' })
  @ApiResponse({ status: 200, description: 'Correct answer deleted' })
  deleteCorrectAnswer(@Param('id') id: string) {
    return this.surveysService.deleteCorrectAnswer(id);
  }

  // ── Submissions ────────────────────────────────────────────────────────────

  @Post('submissions')
  @ApiOperation({ summary: 'Submit survey response (creates one submission per answer)' })
  @ApiResponse({ status: 201, description: 'Response submitted successfully' })
  @ApiResponse({ status: 400, description: 'Missing required questions' })
  submitResponse(@Body() submitDto: SubmitSurveyResponseDto) {
    return this.surveysService.submitResponse(submitDto);
  }

  @Get(':id/responses')
  @ApiOperation({ summary: 'Get all response sessions for survey (grouped by respondent)' })
  @ApiResponse({ status: 200, description: 'Responses retrieved successfully' })
  getResponses(@Param('id') surveyId: string) {
    return this.surveysService.getResponses(surveyId);
  }

  @Get('submissions/:submissionId')
  @ApiOperation({ summary: 'Get a single submission document by ID' })
  @ApiResponse({ status: 200, description: 'Submission retrieved successfully' })
  getSubmissionById(@Param('submissionId') submissionId: string) {
    return this.surveysService.getSubmissionById(submissionId);
  }

  @Get('responses/:sessionKey')
  @ApiOperation({ summary: 'Get full response session by session key (surveyId_respondentId_timestamp)' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  getResponseWithAnswers(@Param('sessionKey') sessionKey: string) {
    return this.surveysService.getResponseWithAnswers(sessionKey);
  }

  // ── Analytics ──────────────────────────────────────────────────────────────

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get survey analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  getSurveyAnalytics(@Param('id') surveyId: string) {
    return this.surveysService.getSurveyAnalytics(surveyId);
  }
}
