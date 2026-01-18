import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BeneficiariesService } from './beneficiaries.service';
import { BeneficiariesController } from './beneficiaries.controller';
import { Beneficiary, BeneficiarySchema } from './schemas/beneficiary.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Beneficiary.name, schema: BeneficiarySchema },
    ]),
  ],
  controllers: [BeneficiariesController],
  providers: [BeneficiariesService],
  exports: [BeneficiariesService],
})
export class BeneficiariesModule {}
