import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Project, ProjectSchema } from '@modules/projects/schemas/project.schema';
import { Survey, SurveySchema } from '@modules/surveys/schemas/survey.schema';
import { SurveyResponse, SurveyResponseSchema } from '@modules/surveys/schemas/survey-response.schema';
import { Beneficiary, BeneficiarySchema } from '@modules/beneficiaries/schemas/beneficiary.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Survey.name, schema: SurveySchema },
      { name: SurveyResponse.name, schema: SurveyResponseSchema },
      { name: Beneficiary.name, schema: BeneficiarySchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
