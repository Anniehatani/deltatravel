import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ToursModule } from '../tours/tours.module';
import { BookingsModule } from '../bookings/bookings.module';
@Module({
  imports: [ToursModule, BookingsModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
