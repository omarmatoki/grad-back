import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IndicatorsService } from './indicators.service';
import { IndicatorsController } from './indicators.controller';
import { Indicator, IndicatorSchema } from './schemas/indicator.schema';
import {
  IndicatorHistory,
  IndicatorHistorySchema,
} from './schemas/indicator-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Indicator.name, schema: IndicatorSchema },
      { name: IndicatorHistory.name, schema: IndicatorHistorySchema },
    ]),
  ],
  controllers: [IndicatorsController],
  providers: [IndicatorsService],
  exports: [IndicatorsService],
})
export class IndicatorsModule {}
