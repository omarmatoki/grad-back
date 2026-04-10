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

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: TextAnalysis.name, schema: TextAnalysisSchema },
      { name: Topic.name, schema: TopicSchema },
      { name: TextTopic.name, schema: TextTopicSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService, N8nAiService],
  exports: [AnalysisService, N8nAiService],
})
export class AnalysisModule {}
