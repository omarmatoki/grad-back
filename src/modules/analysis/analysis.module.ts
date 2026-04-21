import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { N8nAiService } from './services/n8n-ai.service';
import { TextAnalysis, TextAnalysisSchema } from './schemas/text-analysis.schema';
import { Topic, TopicSchema } from './schemas/topic.schema';
import { TextTopic, TextTopicSchema } from './schemas/text-topic.schema';
import { Project, ProjectSchema } from '@modules/projects/schemas/project.schema';
import { Activity, ActivitySchema } from '@modules/activities/schemas/activity.schema';
import { Survey, SurveySchema } from '@modules/surveys/schemas/survey.schema';
import { SurveySubmission, SurveySubmissionSchema } from '@modules/surveys/schemas/survey-submission.schema';
import { Indicator, IndicatorSchema } from '@modules/indicators/schemas/indicator.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: TextAnalysis.name, schema: TextAnalysisSchema },
      { name: Topic.name, schema: TopicSchema },
      { name: TextTopic.name, schema: TextTopicSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Survey.name, schema: SurveySchema },
      { name: SurveySubmission.name, schema: SurveySubmissionSchema },
      { name: Indicator.name, schema: IndicatorSchema },
    ]),
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService, N8nAiService],
  exports: [AnalysisService, N8nAiService],
})
export class AnalysisModule {}
