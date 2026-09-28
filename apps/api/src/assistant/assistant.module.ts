import {
  Body,
  Controller,
  Get,
  HttpCode,
  Module,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import {
  AssistantRequestSchema,
  AssistantBookingProposalSchema,
  AgentPlanRequestSchema,
  AgentPlanUpdateSchema,
  AgentApprovalSchema,
  AgentDeclineSchema,
} from '@tour/shared';
import { Public, Roles } from '../auth/guards';
import { ZodPipe, AppRequest } from '../common/http';
import { AssistantService } from './assistant.service';
import { AssistantActionService } from './assistant-action.service';
import { TravelAgentService } from './travel-agent.service';
import { AiProviderService } from './ai-provider.service';
import { CatalogAgent, CustomerAgent, OperationsAgent, PolicyAgent } from './agents';
import { ToursModule } from '../tours/tours.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { BookingsModule } from '../bookings/bookings.module';
import { AdminModule } from '../admin/admin.module';
import { PaymentsModule } from '../payments/payments.module';

@Controller('assistant')
export class AssistantController {
  constructor(
    private readonly assistant: AssistantService,
    private readonly actions: AssistantActionService,
    private readonly travelAgent: TravelAgentService,
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
  @Post('agent/plans')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createAgentPlan(
    @Body(new ZodPipe(AgentPlanRequestSchema))
    body: z.infer<typeof AgentPlanRequestSchema>,
    @Req() req: AppRequest,
  ) {
    return this.travelAgent.create(req.user!.id, body);
  }

  @Roles('CUSTOMER')
  @Get('agent/plans/:id')
  getAgentPlan(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: AppRequest) {
    return this.travelAgent.get(req.user!.id, id);
  }

  @Roles('CUSTOMER')
  @Patch('agent/plans/:id')
  @HttpCode(200)
  updateAgentPlan(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(AgentPlanUpdateSchema))
    body: z.infer<typeof AgentPlanUpdateSchema>,
    @Req() req: AppRequest,
  ) {
    return this.travelAgent.update(req.user!.id, id, body);
  }

  @Roles('CUSTOMER')
  @Post('agent/plans/:id/approve')
  @HttpCode(200)
  approveAgentPlan(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(AgentApprovalSchema))
    body: z.infer<typeof AgentApprovalSchema>,
    @Req() req: AppRequest,
  ) {
    return this.travelAgent.approve(req.user!.id, id, body.version, req.ip ?? '127.0.0.1');
  }

  @Roles('CUSTOMER')
  @Post('agent/plans/:id/decline')
  @HttpCode(200)
  declineAgentPlan(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(AgentDeclineSchema))
    _body: z.infer<typeof AgentDeclineSchema>,
    @Req() req: AppRequest,
  ) {
    return this.travelAgent.decline(req.user!.id, id);
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
  imports: [ToursModule, SchedulesModule, BookingsModule, AdminModule, PaymentsModule],
  providers: [
    AssistantService,
    AssistantActionService,
    TravelAgentService,
    AiProviderService,
    CatalogAgent,
    CustomerAgent,
    PolicyAgent,
    OperationsAgent,
  ],
  controllers: [AssistantController],
})
export class AssistantModule {}
