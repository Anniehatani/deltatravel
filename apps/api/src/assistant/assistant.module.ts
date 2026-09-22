import { Body, Controller, HttpCode, Module, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { AssistantRequestSchema } from '@tour/shared';
import { Public } from '../auth/guards';
import { ZodPipe, AppRequest } from '../common/http';
import { AssistantService } from './assistant.service';
import { ToursModule } from '../tours/tours.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { BookingsModule } from '../bookings/bookings.module';
import { AdminModule } from '../admin/admin.module';
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}
  @Public()
  @Post('chat')
  @HttpCode(200)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  chat(
    @Body(new ZodPipe(AssistantRequestSchema)) b: z.infer<typeof AssistantRequestSchema>,
    @Req() r: AppRequest,
  ) {
    return this.assistant.chat(b, r.user);
  }
}
@Module({
  imports: [ToursModule, SchedulesModule, BookingsModule, AdminModule],
  providers: [AssistantService],
  controllers: [AssistantController],
})
export class AssistantModule {}
