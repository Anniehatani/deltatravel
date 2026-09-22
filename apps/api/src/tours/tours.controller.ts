import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { z } from 'zod';
import { TourQuerySchema } from '@tour/shared';
import { Public } from '../auth/guards';
import { ZodPipe } from '../common/http';
import { ToursService } from './tours.service';
@Public()
@Controller('tours')
export class ToursController {
  constructor(private readonly tours: ToursService) {}
  @Get() list(@Query(new ZodPipe(TourQuerySchema)) q: z.infer<typeof TourQuerySchema>) {
    return this.tours.list(q);
  }
  @Get(':id') get(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.tours.get(id);
  }
}
