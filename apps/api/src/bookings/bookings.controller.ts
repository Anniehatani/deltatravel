import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  CreateBookingSchema,
  QuoteSchema,
  PaginationSchema,
  IdempotencyKeySchema,
  CancelSchema,
} from '@tour/shared';
import { z } from 'zod';
import { BookingsService } from './bookings.service';
import { ZodPipe, AppRequest } from '../common/http';
import { Public, Roles } from '../auth/guards';
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}
  @Public()
  @Post('quote')
  @HttpCode(200)
  quote(@Body(new ZodPipe(QuoteSchema)) body: z.infer<typeof QuoteSchema>) {
    return this.bookings.quote(body);
  }
  @Roles('CUSTOMER')
  @Post()
  create(
    @Req() req: AppRequest,
    @Body(new ZodPipe(CreateBookingSchema)) body: z.infer<typeof CreateBookingSchema>,
    @Headers('idempotency-key') key: string,
  ) {
    return this.bookings.create(req.user!.id, body, IdempotencyKeySchema.parse(key));
  }
  @Get() list(
    @Req() req: AppRequest,
    @Query(new ZodPipe(PaginationSchema)) q: z.infer<typeof PaginationSchema>,
  ) {
    return this.bookings.list(q, req.user!.id);
  }
  @Get(':id') get(@Req() req: AppRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.bookings.get(id, req.user!.id);
  }
  @Post(':id/cancel')
  @HttpCode(200)
  cancel(
    @Req() req: AppRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(CancelSchema)) body: z.infer<typeof CancelSchema>,
  ) {
    return this.bookings.cancel(id, req.user!.id, body.reason);
  }
  @Delete(':id')
  @HttpCode(200)
  delete(
    @Req() req: AppRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.bookings.delete(id, req.user!.id);
  }
}
