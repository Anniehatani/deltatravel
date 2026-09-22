import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { z } from 'zod';
import {
  CreateTourSchema,
  UpdateTourSchema,
  CreateScheduleSchema,
  UpdateScheduleSchema,
  PaginationSchema,
  TourQuerySchema,
  CancelSchema,
  TransitionSchema,
  RefundRecordSchema,
} from '@tour/shared';
import { Roles } from '../auth/guards';
import { ZodPipe, AppRequest } from '../common/http';
import { AdminService } from './admin.service';
import { ToursService } from '../tours/tours.service';
import { BookingsService } from '../bookings/bookings.service';
@Roles('ADMIN', 'OPERATIONS')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly tours: ToursService,
    private readonly bookings: BookingsService,
  ) {}
  @Get('summary') summary() {
    return this.admin.summary();
  }
  @Get('tours') toursList(@Query(new ZodPipe(TourQuerySchema)) q: z.infer<typeof TourQuerySchema>) {
    return this.tours.list(q, true);
  }
  @Post('tours') createTour(
    @Body(new ZodPipe(CreateTourSchema)) b: z.infer<typeof CreateTourSchema>,
    @Req() r: AppRequest,
  ) {
    return this.admin.createTour(b, r.user!.id);
  }
  @Patch('tours/:id') updateTour(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(UpdateTourSchema)) b: z.infer<typeof UpdateTourSchema>,
    @Req() r: AppRequest,
  ) {
    return this.admin.updateTour(id, b, r.user!.id);
  }
  @Roles('ADMIN') @Delete('tours/:id') archiveTour(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() r: AppRequest,
  ) {
    return this.admin.archiveTour(id, r.user!.id);
  }
  @Get('schedules') schedules(
    @Query(new ZodPipe(PaginationSchema)) q: z.infer<typeof PaginationSchema>,
  ) {
    return this.admin.schedules(q);
  }
  @Post('schedules') createSchedule(
    @Body(new ZodPipe(CreateScheduleSchema)) b: z.infer<typeof CreateScheduleSchema>,
    @Req() r: AppRequest,
  ) {
    return this.admin.createSchedule(b, r.user!.id);
  }
  @Patch('schedules/:id') updateSchedule(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(UpdateScheduleSchema)) b: z.infer<typeof UpdateScheduleSchema>,
    @Req() r: AppRequest,
  ) {
    return this.admin.updateSchedule(id, b, r.user!.id);
  }
  @Get('bookings') listBookings(
    @Query(new ZodPipe(PaginationSchema)) q: z.infer<typeof PaginationSchema>,
  ) {
    return this.bookings.list(q);
  }
  @Get('bookings/:id') getBooking(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.bookings.get(id);
  }
  @Patch('bookings/:id/status') transition(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(TransitionSchema)) b: z.infer<typeof TransitionSchema>,
    @Req() r: AppRequest,
  ) {
    return this.bookings.transition(id, b.status, r.user!.id);
  }
  @Post('bookings/:id/cancel')
  @HttpCode(200)
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(CancelSchema)) b: z.infer<typeof CancelSchema>,
    @Req() r: AppRequest,
  ) {
    return this.bookings.cancel(id, r.user!.id, b.reason, true);
  }
  @Get('payments') payments(
    @Query(new ZodPipe(PaginationSchema)) q: z.infer<typeof PaginationSchema>,
  ) {
    return this.admin.payments(q);
  }
  @Roles('ADMIN')
  @Post('payments/:id/refund-record')
  @HttpCode(200)
  refund(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(RefundRecordSchema)) b: z.infer<typeof RefundRecordSchema>,
    @Req() r: AppRequest,
  ) {
    return this.admin.recordRefund(id, b, r.user!.id);
  }
  @Roles('ADMIN') @Get('audit-logs') audit(
    @Query(new ZodPipe(PaginationSchema)) q: z.infer<typeof PaginationSchema>,
  ) {
    return this.admin.audit(q);
  }
}
