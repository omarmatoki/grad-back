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
import { SubmitSurveySubmissionDto } from './dto/submit-survey-submission.dto';
import { CreateCorrectAnswerDto } from './dto/create-correct-answer.dto';
import { FindSurveysDto } from './dto/find-surveys.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { UserRole } from '@modules/users/schemas/user.schema';
import { RequestUser } from '@common/interfaces/request-user.interface';

@ApiTags('Surveys')
@ApiBearerAuth()
@Controller('surveys')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  // ── Survey CRUD ────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create new survey' })
  @ApiResponse({ status: 201, description: 'Survey created successfully' })
  createSurvey(@Body() createSurveyDto: CreateSurveyDto, @CurrentUser() user: RequestUser) {
    return this.surveysService.createSurvey(createSurveyDto, user._id, user.role);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all surveys' })
  @ApiResponse({ status: 200, description: 'Surveys retrieved successfully' })
  findAllSurveys(@Query() filters: FindSurveysDto, @CurrentUser() user: RequestUser) {
    return this.surveysService.findAllSurveys(filters, user._id, user.role);
  }

  @Get('activity/:activityId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all surveys for a specific activity' })
  @ApiResponse({ status: 200, description: 'Surveys retrieved successfully' })
  findByActivity(@Param('activityId') activityId: string, @CurrentUser() user: RequestUser) {
    return this.surveysService.findByActivity(activityId, user._id, user.role);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get survey by ID' })
  @ApiResponse({ status: 200, description: 'Survey retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Survey not found' })
  findOneSurvey(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.surveysService.findOneSurvey(id, user._id, user.role);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update survey' })
  @ApiResponse({ status: 200, description: 'Survey updated successfully' })
  updateSurvey(@Param('id') id: string, @Body() updateData: Partial<CreateSurveyDto>, @CurrentUser() user: RequestUser) {
    return this.surveysService.updateSurvey(id, updateData, user._id, user.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Delete survey and all its data' })
  @ApiResponse({ status: 200, description: 'Survey deleted successfully' })
  deleteSurvey(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.surveysService.deleteSurvey(id, user._id, user.role);
  }

  // ── Questions ──────────────────────────────────────────────────────────────

  @Post('questions')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Add question to survey' })
  @ApiResponse({ status: 201, description: 'Question added successfully' })
  addQuestion(@Body() createQuestionDto: CreateSurveyQuestionDto, @CurrentUser() user: RequestUser) {
    return this.surveysService.addQuestion(createQuestionDto, user._id, user.role);
  }

  @Get(':id/questions')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all questions for survey' })
  @ApiResponse({ status: 200, description: 'Questions retrieved successfully' })
  getQuestions(@Param('id') surveyId: string, @CurrentUser() user: RequestUser) {
    return this.surveysService.getQuestions(surveyId, user._id, user.role);
  }

  @Patch('questions/:questionId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update question' })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  updateQuestion(
    @Param('questionId') questionId: string,
    @Body() updateData: Partial<CreateSurveyQuestionDto>,
    @CurrentUser() user: RequestUser,
  ) {
    return this.surveysService.updateQuestion(questionId, updateData, user._id, user.role);
  }

  @Delete('questions/:questionId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Delete question and its correct answers' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  deleteQuestion(@Param('questionId') questionId: string, @CurrentUser() user: RequestUser) {
    return this.surveysService.deleteQuestion(questionId, user._id, user.role);
  }

  // ── Correct Answers ────────────────────────────────────────────────────────

  @Post('correct-answers')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Add a correct answer for a question' })
  @ApiResponse({ status: 201, description: 'Correct answer added' })
  addCorrectAnswer(@Body() dto: CreateCorrectAnswerDto, @CurrentUser() user: RequestUser) {
    return this.surveysService.addCorrectAnswer(dto, user._id, user.role);
  }

  @Get('questions/:questionId/correct-answers')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get correct answers for a question' })
  @ApiResponse({ status: 200, description: 'Correct answers retrieved' })
  getCorrectAnswers(@Param('questionId') questionId: string, @CurrentUser() user: RequestUser) {
    return this.surveysService.getCorrectAnswers(questionId, user._id, user.role);
  }

  @Delete('correct-answers/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Delete a correct answer' })
  @ApiResponse({ status: 200, description: 'Correct answer deleted' })
  deleteCorrectAnswer(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.surveysService.deleteCorrectAnswer(id, user._id, user.role);
  }

  // ── Submissions ────────────────────────────────────────────────────────────

  @Post('submissions')
  @ApiOperation({ summary: 'Submit survey response (creates one submission per answer)' })
  @ApiResponse({ status: 201, description: 'Response submitted successfully' })
  @ApiResponse({ status: 400, description: 'Missing required questions' })
  submitResponse(@Body() submitDto: SubmitSurveySubmissionDto) {
    return this.surveysService.submitResponse(submitDto);
  }

  @Get(':id/responses')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all response sessions for survey (grouped by respondent)' })
  @ApiResponse({ status: 200, description: 'Responses retrieved successfully' })
  getResponses(@Param('id') surveyId: string, @CurrentUser() user: RequestUser) {
    return this.surveysService.getResponses(surveyId, user._id, user.role);
  }

  @Get('submissions/:submissionId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get a single submission document by ID' })
  @ApiResponse({ status: 200, description: 'Submission retrieved successfully' })
  getSubmissionById(@Param('submissionId') submissionId: string, @CurrentUser() user: RequestUser) {
    return this.surveysService.getSubmissionById(submissionId, user._id, user.role);
  }

  @Get('responses/:sessionKey')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get full response session by session key (surveyId_respondentId_timestamp)' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  getResponseWithAnswers(@Param('sessionKey') sessionKey: string, @CurrentUser() user: RequestUser) {
    return this.surveysService.getResponseWithAnswers(sessionKey, user._id, user.role);
  }

  // ── Analytics ──────────────────────────────────────────────────────────────

  @Get(':id/analytics')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get survey analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  getSurveyAnalytics(@Param('id') surveyId: string, @CurrentUser() user: RequestUser) {
    return this.surveysService.getSurveyAnalytics(surveyId, user._id, user.role);
  }

  // ── QR Code ────────────────────────────────────────────────────────────────

  @Post(':id/generate-qr')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Generate QR code for survey public link' })
  @ApiResponse({ status: 200, description: 'QR code generated and saved' })
  generateQrCode(
    @Param('id') id: string,
    @Body('frontendBaseUrl') frontendBaseUrl: string,
    @CurrentUser() user: RequestUser,
  ) {
    const baseUrl = frontendBaseUrl || process.env.FRONTEND_URL || 'http://localhost:3001';
    return this.surveysService.generateQrCode(id, baseUrl, user._id, user.role);
  }

  // ── Public Endpoints (no auth) ─────────────────────────────────────────────

  @Public()
  @Get('public/:id')
  @ApiOperation({ summary: 'Get public survey data (no auth required)' })
  @ApiResponse({ status: 200, description: 'Survey and questions returned' })
  @ApiResponse({ status: 400, description: 'Survey is not active' })
  getPublicSurvey(@Param('id') id: string) {
    return this.surveysService.getPublicSurvey(id);
  }

  @Public()
  @Post('public/submit')
  @ApiOperation({ summary: 'Submit survey response (no auth required)' })
  @ApiResponse({ status: 201, description: 'Response submitted successfully' })
  publicSubmit(@Body() submitDto: SubmitSurveySubmissionDto) {
    return this.surveysService.publicSubmit(submitDto);
  }
}
