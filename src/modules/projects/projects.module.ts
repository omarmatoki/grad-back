import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project, ProjectSchema } from './schemas/project.schema';
import { ProjectTypeEntity, ProjectTypeSchema } from './schemas/project-type.schema';
import { User, UserSchema } from '@modules/users/schemas/user.schema';
import { Activity, ActivitySchema } from '@modules/activities/schemas/activity.schema';
import { Survey, SurveySchema } from '@modules/surveys/schemas/survey.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: ProjectTypeEntity.name, schema: ProjectTypeSchema },
      { name: User.name, schema: UserSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Survey.name, schema: SurveySchema },
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
