import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { Activity, ActivitySchema } from './schemas/activity.schema';
import { ActivityTypeEntity, ActivityTypeSchema } from './schemas/activity-type.schema';
import { Project, ProjectSchema } from '@modules/projects/schemas/project.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
      { name: ActivityTypeEntity.name, schema: ActivityTypeSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
