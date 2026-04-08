import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BeneficiariesService } from './beneficiaries.service';
import { BeneficiariesController } from './beneficiaries.controller';
import { Beneficiary, BeneficiarySchema } from './schemas/beneficiary.schema';
import { ActivityBeneficiary, ActivityBeneficiarySchema } from './schemas/activity-beneficiary.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Beneficiary.name, schema: BeneficiarySchema },
      { name: ActivityBeneficiary.name, schema: ActivityBeneficiarySchema },
    ]),
  ],
  controllers: [BeneficiariesController],
  providers: [BeneficiariesService],
  exports: [BeneficiariesService, MongooseModule],
})
export class BeneficiariesModule {}
