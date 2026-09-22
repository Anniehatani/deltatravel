import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingTimeoutWorker, TimeoutDispatcher } from './booking-timeout.worker';
@Module({
  imports: [BullModule.registerQueue({ name: 'booking-timeout' })],
  controllers: [BookingsController],
  providers: [BookingsService, BookingTimeoutWorker, TimeoutDispatcher],
  exports: [BookingsService],
})
export class BookingsModule {}
