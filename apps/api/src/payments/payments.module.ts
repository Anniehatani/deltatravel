import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Gateways } from './gateways';
@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, Gateways],
  exports: [PaymentsService],
})
export class PaymentsModule {}
