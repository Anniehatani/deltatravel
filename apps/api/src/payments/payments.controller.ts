import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { z } from 'zod';
import { CreatePaymentSchema } from '@tour/shared';
import { ZodPipe, AppRequest } from '../common/http';
import { Public } from '../auth/guards';
import { PaymentsService } from './payments.service';
import { Gateways } from './gateways';
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly gateways: Gateways,
  ) {}
  @Post()
  @HttpCode(200)
  create(
    @Req() req: AppRequest,
    @Body(new ZodPipe(CreatePaymentSchema)) body: z.infer<typeof CreatePaymentSchema>,
  ) {
    return this.payments.create(req.user!.id, body.bookingId, body.provider, req.ip ?? '127.0.0.1');
  }
  @Get(':id') get(@Req() req: AppRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.payments.get(id, req.user!.id);
  }
  @Public()
  @SkipThrottle()
  @Get('webhooks/vnpay')
  async vnpay(@Query() query: unknown) {
    try {
      const result = await this.payments.settle(this.gateways.verifyVnpay(query));
      return {
        RspCode: result === 'DUPLICATE' ? '02' : '00',
        Message: result === 'DUPLICATE' ? 'Order already confirmed' : 'Confirm Success',
      };
    } catch (e) {
      const code = e instanceof HttpException ? (e.getResponse() as { code?: string }).code : '';
      return {
        RspCode:
          code === 'INVALID_SIGNATURE'
            ? '97'
            : code === 'PAYMENT_NOT_FOUND'
              ? '01'
              : code === 'AMOUNT_MISMATCH'
                ? '04'
                : '99',
        Message: 'Unable to confirm',
      };
    }
  }
  @Public()
  @SkipThrottle()
  @Post('webhooks/momo')
  async momo(@Body() body: unknown, @Res() res: Response) {
    await this.payments.settle(this.gateways.verifyMomo(body));
    res.status(204).send();
  }
  @Public()
  @SkipThrottle()
  @Post('webhooks/zalopay')
  @HttpCode(200)
  async zalopay(@Body() body: unknown) {
    try {
      await this.payments.settle(this.gateways.verifyZalopay(body));
      return { return_code: 1, return_message: 'success' };
    } catch (e) {
      const code = e instanceof HttpException ? (e.getResponse() as { code?: string }).code : '';
      return {
        return_code: code === 'INVALID_SIGNATURE' ? -1 : 0,
        return_message: 'Unable to confirm',
      };
    }
  }
}
