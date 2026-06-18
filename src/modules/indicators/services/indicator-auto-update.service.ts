import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Indicator, AutoAggregationType } from '../schemas/indicator.schema';
import { IndicatorHistory } from '../schemas/indicator-history.schema';
import { SurveySubmission } from '@modules/surveys/schemas/survey-submission.schema';

@Injectable()
export class IndicatorAutoUpdateService {
  private readonly logger = new Logger(IndicatorAutoUpdateService.name);

  constructor(
    @InjectModel(Indicator.name) private indicatorModel: Model<Indicator>,
    @InjectModel(IndicatorHistory.name) private historyModel: Model<IndicatorHistory>,
    @InjectModel(SurveySubmission.name) private submissionModel: Model<SurveySubmission>,
  ) {}

  /**
   * Called after every survey submission.
   * Finds indicators linked to any of the submitted questions,
   * recalculates their actualValue, and logs to indicator_histories.
   */
  async updateLinkedIndicators(questionIds: string[]): Promise<void> {
    if (!questionIds.length) return;

    const oids = questionIds
      .filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));

    const indicators = await this.indicatorModel
      .find({
        linkedQuestionId: { $in: oids },
        isActive: true,
        autoAggregationType: { $exists: true, $ne: null },
      })
      .lean();

    if (!indicators.length) return;

    for (const ind of indicators) {
      try {
        const qId = ind.linkedQuestionId!.toString();
        const newValue = await this.aggregate(qId, ind.autoAggregationType!);
        if (newValue === null) continue;

        await this.indicatorModel.findByIdAndUpdate(ind._id, {
          actualValue: newValue,
          lastCalculatedAt: new Date(),
        });

        const prev = await this.historyModel
          .findOne({ indicator: ind._id })
          .sort({ calculatedAt: -1 })
          .lean();

        const prevValue = prev?.recordedValue;
        const changeAmount = prevValue !== undefined ? newValue - prevValue : undefined;
        const changePercentage =
          prevValue !== undefined && prevValue !== 0
            ? (changeAmount! / prevValue) * 100
            : undefined;

        await new this.historyModel({
          indicator: ind._id,
          recordedValue: newValue,
          calculatedAt: new Date(),
          source: 'auto',
          notes: 'تحديث تلقائي من ردود الاستبيان',
          status: 'recorded',
          previousValue: prevValue,
          changeAmount,
          changePercentage,
        }).save();

        this.logger.log(
          `Auto-updated indicator "${ind.name}": ${prevValue ?? '—'} → ${newValue}`,
        );
      } catch (err) {
        this.logger.error(`Failed to auto-update indicator ${ind._id}: ${err.message}`);
      }
    }
  }

  // ── Aggregation logic ─────────────────────────────────────────────────────

  private async aggregate(questionId: string, type: AutoAggregationType): Promise<number | null> {
    const qOid = new Types.ObjectId(questionId);

    if (type === AutoAggregationType.AVERAGE) {
      const res = await this.submissionModel.aggregate([
        { $match: { question: qOid, numberValue: { $exists: true, $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$numberValue' } } },
      ]);
      if (!res.length) return null;
      return Math.round(res[0].avg * 100) / 100;
    }

    if (type === AutoAggregationType.SUM) {
      const res = await this.submissionModel.aggregate([
        { $match: { question: qOid, numberValue: { $exists: true, $ne: null } } },
        { $group: { _id: null, total: { $sum: '$numberValue' } } },
      ]);
      return res.length ? res[0].total : null;
    }

    if (type === AutoAggregationType.COUNT_TRUE) {
      const count = await this.submissionModel.countDocuments({
        question: qOid,
        booleanValue: true,
      });
      return count;
    }

    if (type === AutoAggregationType.PERCENTAGE_TRUE) {
      const [total, trueCount] = await Promise.all([
        this.submissionModel.countDocuments({
          question: qOid,
          booleanValue: { $exists: true, $ne: null },
        }),
        this.submissionModel.countDocuments({ question: qOid, booleanValue: true }),
      ]);
      if (total === 0) return null;
      return Math.round((trueCount / total) * 100);
    }

    return null;
  }
}
