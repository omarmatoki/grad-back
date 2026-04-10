import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SurveysService } from './surveys.service';
import { SurveysController } from './surveys.controller';
import { Survey, SurveySchema } from './schemas/survey.schema';
import { SurveyQuestion, SurveyQuestionSchema } from './schemas/survey-question.schema';
import { SurveySubmission, SurveySubmissionSchema } from './schemas/survey-submission.schema';
import { SurveyCorrectAnswer, SurveyCorrectAnswerSchema } from './schemas/survey-correct-answer.schema';
import { Activity, ActivitySchema } from '@modules/activities/schemas/activity.schema';
import { Project, ProjectSchema } from '@modules/projects/schemas/project.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Survey.name, schema: SurveySchema },
      { name: SurveyQuestion.name, schema: SurveyQuestionSchema },
      { name: SurveySubmission.name, schema: SurveySubmissionSchema },
      { name: SurveyCorrectAnswer.name, schema: SurveyCorrectAnswerSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [SurveysController],
  providers: [SurveysService],
  exports: [SurveysService],
})
export class SurveysModule {}
