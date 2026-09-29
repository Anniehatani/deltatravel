import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AssistantRequestSchema, AssistantResult } from '@tour/shared';
import type { AppRequest } from '../common/http';
import { SchedulesService } from '../schedules/schedules.service';
import { AiProviderService } from './ai-provider.service';
import { CatalogAgent, CustomerAgent, OperationsAgent, PolicyAgent } from './agents';

@Injectable()
export class AssistantService {
  constructor(
    private readonly ai: AiProviderService,
    private readonly catalog: CatalogAgent,
    private readonly customer: CustomerAgent,
    private readonly policy: PolicyAgent,
    private readonly operations: OperationsAgent,
    private readonly schedules: SchedulesService,
  ) {}

  providerStatus() {
    return this.ai.status();
  }

  providerProbe() {
    return this.ai.probe();
  }

  async chat(
    input: z.infer<typeof AssistantRequestSchema>,
    user: AppRequest['user'],
  ): Promise<AssistantResult> {
    const planned = await this.ai.classify(input.message, input.history);
    const intent = planned.intent;

    if (intent.intent === 'ACCOUNT_GUIDANCE') {
      return {
        reply:
          'Bạn có thể đăng ký, đăng nhập hoặc dùng Quên mật khẩu. Mã OTP đặt lại mật khẩu được gửi qua email và không được hiển thị từ API. Không gửi mật khẩu hoặc OTP cho trợ lý.',
        mode: planned.mode,
        actions: [
          { label: 'Đăng nhập', href: '/login', requiresConfirmation: false },
          { label: 'Tạo tài khoản', href: '/register', requiresConfirmation: false },
        ],
        sources: [{ type: 'POLICY', id: 'auth-contract', label: 'Hướng dẫn tài khoản' }],
      };
    }

    if (intent.intent === 'MY_BOOKINGS') {
      const payload = await this.customer.myBookings(user, intent.bookingId);
      const synthesized = await this.ai.synthesize(
        input.message,
        payload.facts,
        input.lang || 'vi',
      );
      return {
        ...payload,
        reply: synthesized?.reply || payload.reply,
        mode: synthesized?.mode || planned.mode,
      };
    }

    if (intent.intent === 'OPERATIONS') {
      const payload = await this.operations.run(user);
      const synthesized = await this.ai.synthesize(
        input.message,
        payload.facts,
        input.lang || 'vi',
      );
      return {
        ...payload,
        reply: synthesized?.reply || payload.reply,
        mode: synthesized?.mode || planned.mode,
      };
    }

    if (intent.intent === 'AVAILABILITY') {
      if (!intent.scheduleId) {
        return {
          reply:
            'Bạn hãy chọn một lịch khởi hành cụ thể để mình kiểm tra giá và số chỗ theo dữ liệu hiện tại.',
          mode: planned.mode,
          actions: [{ label: 'Xem các tour', href: '/tours', requiresConfirmation: false }],
          sources: [],
        };
      }
      const schedule = await this.schedules.get(intent.scheduleId);
      return {
        reply:
          'Lịch hiện còn ' +
          schedule.availableSeats +
          ' chỗ. Giá người lớn ' +
          schedule.adultPrice.toLocaleString('vi-VN') +
          ' VND, trẻ em ' +
          schedule.childPrice.toLocaleString('vi-VN') +
          ' VND. Kho chỗ sẽ được kiểm tra lại khi tạo đơn.',
        mode: planned.mode,
        actions: [
          {
            label: 'Xem tour và đặt chỗ',
            href: '/tours/' + schedule.tourId,
            requiresConfirmation: true,
          },
        ],
        sources: [{ type: 'TOUR', id: schedule.tourId, label: 'Lịch khởi hành' }],
      };
    }

    if (
      intent.intent === 'POLICY' ||
      intent.intent === 'CANCEL_GUIDANCE' ||
      intent.intent === 'PAYMENT_GUIDANCE'
    ) {
      const payload = this.policy.run(intent);
      return { ...payload, mode: planned.mode };
    }

    if (intent.intent === 'BOOKING_GUIDANCE') {
      return {
        reply:
          'Trợ lý có thể lập đề xuất đặt tour từ lịch, số khách và thông tin liên hệ. Hệ thống chỉ tạo đơn sau bước xác nhận rõ ràng của người dùng; thanh toán vẫn cần người dùng mở cổng thanh toán và tự phê duyệt.',
        mode: planned.mode,
        actions: [
          { label: 'Chọn tour', href: '/tours', requiresConfirmation: false },
          { label: 'Theo dõi đơn', href: '/bookings', requiresConfirmation: false },
        ],
        sources: [
          {
            type: 'POLICY',
            id: 'agentic-booking-safety',
            label: 'Quy trình AI đề xuất rồi người dùng xác nhận',
          },
        ],
      };
    }

    const payload = await this.catalog.run(intent);
    const synthesized = await this.ai.synthesize(input.message, payload.facts, input.lang || 'vi');

    return {
      reply: synthesized?.reply || payload.reply,
      mode: synthesized?.mode || planned.mode,
      actions: payload.actions,
      sources: payload.sources,
    };
  }
}
