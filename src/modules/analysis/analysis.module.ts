import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Schemas
import { TextAnalysis, TextAnalysisSchema } from './schemas/text-analysis.schema';
import { Topic, TopicSchema } from './schemas/topic.schema';
import { TextTopic, TextTopicSchema } from './schemas/text-topic.schema';
import { Project, ProjectSchema } from '@modules/projects/schemas/project.schema';
import { Activity, ActivitySchema } from '@modules/activities/schemas/activity.schema';
import { Survey, SurveySchema } from '@modules/surveys/schemas/survey.schema';
import { SurveySubmission, SurveySubmissionSchema } from '@modules/surveys/schemas/survey-submission.schema';
import { Indicator, IndicatorSchema } from '@modules/indicators/schemas/indicator.schema';

// Shared AI service
import { N8nAiService } from './services/n8n-ai.service';

// Section services
import { ActivityAnalysisService } from './services/activity-analysis.service';
import { ImpactAssessmentService } from './services/impact-assessment.service';
import { TopicExtractionService } from './services/topic-extraction.service';
import { ProjectAnalysisService } from './services/project-analysis.service';

// Section controllers
import { ActivityAnalysisController } from './controllers/activity-analysis.controller';
import { ImpactAssessmentController } from './controllers/impact-assessment.controller';
import { TopicExtractionController } from './controllers/topic-extraction.controller';
import { ProjectAnalysisController } from './controllers/project-analysis.controller';

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
  controllers: [
    ActivityAnalysisController,
    ImpactAssessmentController,
    TopicExtractionController,
    ProjectAnalysisController,
  ],
  providers: [
    N8nAiService,
    ActivityAnalysisService,
    ImpactAssessmentService,
    TopicExtractionService,
    ProjectAnalysisService,
  ],
  exports: [
    N8nAiService,
    ActivityAnalysisService,
    ImpactAssessmentService,
    TopicExtractionService,
    ProjectAnalysisService,
  ],
})
export class AnalysisModule {}
