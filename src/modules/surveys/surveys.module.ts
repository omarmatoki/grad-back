import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SurveysService } from './surveys.service';
import { SurveysController } from './surveys.controller';
import { Survey, SurveySchema } from './schemas/survey.schema';
import { SurveyQuestion, SurveyQuestionSchema } from './schemas/survey-question.schema';
import { SurveyResponse, SurveyResponseSchema } from './schemas/survey-response.schema';
import { SurveyAnswer, SurveyAnswerSchema } from './schemas/survey-answer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Survey.name, schema: SurveySchema },
      { name: SurveyQuestion.name, schema: SurveyQuestionSchema },
      { name: SurveyResponse.name, schema: SurveyResponseSchema },
      { name: SurveyAnswer.name, schema: SurveyAnswerSchema },
    ]),
  ],
  controllers: [SurveysController],
  providers: [SurveysService],
  exports: [SurveysService],
})
export class SurveysModule {}
