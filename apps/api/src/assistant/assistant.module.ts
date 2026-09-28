import {
  Body,
  Controller,
  Get,
  HttpCode,
  Module,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { AssistantRequestSchema, AssistantBookingProposalSchema } from '@tour/shared';
import { Public, Roles } from '../auth/guards';
import { ZodPipe, AppRequest } from '../common/http';
import { AssistantService } from './assistant.service';
import { AssistantActionService } from './assistant-action.service';
import { AiProviderService } from './ai-provider.service';
import { CatalogAgent, CustomerAgent, OperationsAgent, PolicyAgent } from './agents';
import { ToursModule } from '../tours/tours.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { BookingsModule } from '../bookings/bookings.module';
import { AdminModule } from '../admin/admin.module';

@Controller('assistant')
export class AssistantController {
  constructor(
    private readonly assistant: AssistantService,
    private readonly actions: AssistantActionService,
  ) {}

  @Public()
  @Get('provider-status')
  providerStatus() {
    return this.assistant.providerStatus();
  }

  @Roles('ADMIN', 'OPERATIONS')
  @Get('provider-probe')
  providerProbe() {
    return this.assistant.providerProbe();
  }

  @Public()
  @Post('chat')
  @HttpCode(200)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  chat(
    @Body(new ZodPipe(AssistantRequestSchema))
    body: z.infer<typeof AssistantRequestSchema>,
    @Req() req: AppRequest,
  ) {
    return this.assistant.chat(body, req.user);
  }

  @Roles('CUSTOMER')
  @Post('booking-proposals')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  proposeBooking(
    @Body(new ZodPipe(AssistantBookingProposalSchema))
    body: z.infer<typeof AssistantBookingProposalSchema>,
    @Req() req: AppRequest,
  ) {
    return this.actions.proposeBooking(req.user!.id, body);
  }

  @Roles('CUSTOMER')
  @Post('booking-proposals/:id/confirm')
  @HttpCode(200)
  confirmBooking(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: AppRequest) {
    return this.actions.confirmBooking(req.user!.id, id);
  }
}

@Module({
  imports: [ToursModule, SchedulesModule, BookingsModule, AdminModule],
  providers: [
    AssistantService,
    AssistantActionService,
    AiProviderService,
    CatalogAgent,
    CustomerAgent,
    PolicyAgent,
    OperationsAgent,
  ],
  controllers: [AssistantController],
})
export class AssistantModule {}
