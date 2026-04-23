import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { N8nAiService } from './n8n-ai.service';
import { Topic } from '../schemas/topic.schema';
import { TextTopic } from '../schemas/text-topic.schema';
import { Project } from '@modules/projects/schemas/project.schema';
import { UserRole } from '@modules/users/schemas/user.schema';
import type { ExtractTopicsDto } from '../dto/extract-topics.dto';

export interface TopicExtractionResult {
  topics: Array<{
    _id: string;
    name: string;
    keywords: string[];
    frequency: number;
    relevanceScore?: number;
    overallSentiment?: string;
  }>;
  totalTopics: number;
  insights: string[];
}

@Injectable()
export class TopicExtractionService {
  private readonly logger = new Logger(TopicExtractionService.name);

  constructor(
    @InjectModel(Topic.name) private topicModel: Model<Topic>,
    @InjectModel(TextTopic.name) private textTopicModel: Model<TextTopic>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    private readonly n8nAiService: N8nAiService,
  ) {}

  async extract(
    dto: ExtractTopicsDto,
    userId?: string,
    userRole?: UserRole,
  ): Promise<TopicExtractionResult> {
    if (userRole === UserRole.STAFF && userId) {
      await this.assertProjectOwnership(dto.projectId, userId);
    }

    this.logger.log(`Extracting topics for project ${dto.projectId} (${dto.responses.length} responses)`);

    const aiResponse = await this.n8nAiService.extractTopics(
      dto.projectId,
      dto.projectName,
      dto.responses,
      dto.language ?? 'ar',
    );

    const savedTopics = await this.saveTopics(dto.projectId, aiResponse.data.topics ?? []);

    return {
      topics: savedTopics.map((t: any) => ({
        _id: t._id.toString(),
        name: t.name,
        keywords: t.keywords,
        frequency: t.frequency,
        relevanceScore: t.relevanceScore,
        overallSentiment: t.overallSentiment,
      })),
      totalTopics: savedTopics.length,
      insights: aiResponse.data.insights ?? [],
    };
  }

  private async assertProjectOwnership(projectId: string, userId: string): Promise<void> {
    const project = await this.projectModel.findById(projectId).lean().exec();
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (project.user_id.toString() !== userId) {
      throw new ForbiddenException('You do not have permission on this project');
    }
  }

  private async saveTopics(projectId: string, topicsData: any[]): Promise<Topic[]> {
    const saved: Topic[] = [];
    for (const topicData of topicsData) {
      let topic = await this.topicModel.findOne({ project: projectId, name: topicData.name });
      if (topic) {
        topic.frequency += 1;
        topic.keywords = [...new Set([...topic.keywords, ...(topicData.keywords ?? [])])];
        await topic.save();
      } else {
        topic = await new this.topicModel({
          project: projectId,
          name: topicData.name,
          keywords: topicData.keywords ?? [],
          frequency: 1,
          relevanceScore: topicData.relevance,
          overallSentiment: topicData.sentiment,
        }).save();
      }
      saved.push(topic);
    }
    return saved;
  }
}
