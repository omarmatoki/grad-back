import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IndicatorsService } from './indicators.service';
import { IndicatorsController } from './indicators.controller';
import { Indicator, IndicatorSchema } from './schemas/indicator.schema';
import {
  IndicatorHistory,
  IndicatorHistorySchema,
} from './schemas/indicator-history.schema';
import { Project, ProjectSchema } from '@modules/projects/schemas/project.schema';
import { IndicatorAutoUpdateService } from './services/indicator-auto-update.service';
import { SurveySubmission, SurveySubmissionSchema } from '@modules/surveys/schemas/survey-submission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Indicator.name, schema: IndicatorSchema },
      { name: IndicatorHistory.name, schema: IndicatorHistorySchema },
      { name: Project.name, schema: ProjectSchema },
      { name: SurveySubmission.name, schema: SurveySubmissionSchema },
    ]),
  ],
  controllers: [IndicatorsController],
  providers: [IndicatorsService, IndicatorAutoUpdateService],
  exports: [IndicatorsService, IndicatorAutoUpdateService],
})
export class IndicatorsModule {}
