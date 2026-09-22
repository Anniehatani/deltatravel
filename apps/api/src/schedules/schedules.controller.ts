import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { z } from 'zod';
import { PaginationSchema } from '@tour/shared';
import { Public } from '../auth/guards';
import { ZodPipe } from '../common/http';
import { SchedulesService } from './schedules.service';
@Public()
@Controller()
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}
  @Get('tours/:id/schedules') list(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query(new ZodPipe(PaginationSchema)) q: z.infer<typeof PaginationSchema>,
  ) {
    return this.schedules.list(id, q.page, q.pageSize);
  }
  @Get('schedules/:id/availability') get(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.schedules.get(id);
  }
}
