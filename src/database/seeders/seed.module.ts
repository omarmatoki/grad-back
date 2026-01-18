import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Import all schemas
import { User, UserSchema } from '../../modules/users/schemas/user.schema';
import { Project, ProjectSchema } from '../../modules/projects/schemas/project.schema';
import { Beneficiary, BeneficiarySchema } from '../../modules/beneficiaries/schemas/beneficiary.schema';
import { Activity, ActivitySchema } from '../../modules/activities/schemas/activity.schema';
import { Participant, ParticipantSchema } from '../../modules/participants/schemas/participant.schema';
import { Survey, SurveySchema } from '../../modules/surveys/schemas/survey.schema';
import { SurveyQuestion, SurveyQuestionSchema } from '../../modules/surveys/schemas/survey-question.schema';
import { SurveyResponse, SurveyResponseSchema } from '../../modules/surveys/schemas/survey-response.schema';
import { SurveyAnswer, SurveyAnswerSchema } from '../../modules/surveys/schemas/survey-answer.schema';
import { TextAnalysis, TextAnalysisSchema } from '../../modules/analysis/schemas/text-analysis.schema';
import { Topic, TopicSchema } from '../../modules/analysis/schemas/topic.schema';
import { TextTopic, TextTopicSchema } from '../../modules/analysis/schemas/text-topic.schema';
import { Indicator, IndicatorSchema } from '../../modules/indicators/schemas/indicator.schema';
import { IndicatorHistory, IndicatorHistorySchema } from '../../modules/indicators/schemas/indicator-history.schema';

// Import seeder service
import { DatabaseSeeder } from './database.seeder';

// Import config
import databaseConfig from '../../config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/social-impact-platform'),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Beneficiary.name, schema: BeneficiarySchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Participant.name, schema: ParticipantSchema },
      { name: Survey.name, schema: SurveySchema },
      { name: SurveyQuestion.name, schema: SurveyQuestionSchema },
      { name: SurveyResponse.name, schema: SurveyResponseSchema },
      { name: SurveyAnswer.name, schema: SurveyAnswerSchema },
      { name: TextAnalysis.name, schema: TextAnalysisSchema },
      { name: Topic.name, schema: TopicSchema },
      { name: TextTopic.name, schema: TextTopicSchema },
      { name: Indicator.name, schema: IndicatorSchema },
      { name: IndicatorHistory.name, schema: IndicatorHistorySchema },
    ]),
  ],
  providers: [DatabaseSeeder],
  exports: [DatabaseSeeder],
})
export class SeedModule {}
