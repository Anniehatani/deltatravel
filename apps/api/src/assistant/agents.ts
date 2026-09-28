import { Injectable } from '@nestjs/common';
import type { AssistantResult } from '@tour/shared';
import { BOOKING_LABELS } from '@tour/shared';
import { ToursService } from '../tours/tours.service';
import { SchedulesService } from '../schedules/schedules.service';
import { BookingsService } from '../bookings/bookings.service';
import { AdminService } from '../admin/admin.service';
import { fail } from '../common/errors';
import type { AppRequest } from '../common/http';
import type { AgentIntent } from './ai-provider.service';

export type AgentPayload = Pick<AssistantResult, 'reply' | 'actions' | 'sources'> & {
  facts?: unknown;
};

@Injectable()
export class CatalogAgent {
  constructor(
    private readonly tours: ToursService,
    private readonly schedules: SchedulesService,
  ) {}

  async run(intent: AgentIntent): Promise<AgentPayload> {
    const q = [intent.destination, intent.query].filter(Boolean).join(' ').trim();
    let page = await this.tours.list({
      q: q || undefined,
      page: 1,
      pageSize: 5,
    });

    if (!page.items.length && q) {
      page = await this.tours.list({ page: 1, pageSize: 5 });
    }

    const adults = intent.adults || 1;
    const children = intent.children || 0;
    const candidates: Array<{
      tourId: string;
      title: string;
      destination: string;
      durationDays: number;
      scheduleId?: string;
      departureAt?: Date;
      availableSeats?: number;
      adultPrice?: number;
      childPrice?: number;
      partyTotal?: number;
    }> = [];

    for (const tour of page.items) {
      const schedules = await this.schedules.list(tour.id, 1, 3);
      if (!schedules.items.length) {
        candidates.push({
          tourId: tour.id,
          title: tour.title,
          destination: tour.destination,
          durationDays: tour.durationDays,
        });
        continue;
      }

      const ranked = schedules.items
        .map((schedule) => ({
          schedule,
          total: adults * schedule.adultPrice + children * schedule.childPrice,
        }))
        .sort((a, b) => {
          if (intent.budgetVnd !== undefined) {
            const aOver = Math.max(0, a.total - intent.budgetVnd);
            const bOver = Math.max(0, b.total - intent.budgetVnd);
            if (aOver !== bOver) return aOver - bOver;
          }
          return a.total - b.total;
        });

      const best = ranked[0];
      candidates.push({
        tourId: tour.id,
        title: tour.title,
        destination: tour.destination,
        durationDays: tour.durationDays,
        scheduleId: best.schedule.id,
        departureAt: best.schedule.departureAt,
        availableSeats: best.schedule.availableSeats,
        adultPrice: best.schedule.adultPrice,
        childPrice: best.schedule.childPrice,
        partyTotal: best.total,
      });
    }

    candidates.sort((a, b) => {
      const aTotal = a.partyTotal ?? Number.MAX_SAFE_INTEGER;
      const bTotal = b.partyTotal ?? Number.MAX_SAFE_INTEGER;
      if (intent.budgetVnd !== undefined) {
        const aOver = Math.max(0, aTotal - intent.budgetVnd);
        const bOver = Math.max(0, bTotal - intent.budgetVnd);
        if (aOver !== bOver) return aOver - bOver;
      }
      return aTotal - bTotal;
    });

    const top = candidates.slice(0, 5);
    const reply = top.length
      ? top
          .map((item) => {
            const price =
              item.partyTotal !== undefined
                ? ', tổng cho nhóm hiện tại ' + item.partyTotal.toLocaleString('vi-VN') + ' VND'
                : '';
            const seats =
              item.availableSeats !== undefined ? ', còn ' + item.availableSeats + ' chỗ' : '';
            return (
              item.title +
              ' tại ' +
              item.destination +
              ', ' +
              item.durationDays +
              ' ngày' +
              price +
              seats +
              '.'
            );
          })
          .join('\n')
      : 'Chưa tìm thấy tour phù hợp trong dữ liệu hiện tại.';

    return {
      reply,
      actions: top.map((item) => ({
        label: 'Xem ' + item.title,
        href: '/tours/' + item.tourId,
        requiresConfirmation: false,
      })),
      sources: top.map((item) => ({
        type: 'TOUR' as const,
        id: item.tourId,
        label: item.title,
      })),
      facts: {
        constraints: {
          adults,
          children,
          budgetVnd: intent.budgetVnd,
          durationDays: intent.durationDays,
          destination: intent.destination,
        },
        candidates: top,
      },
    };
  }
}

@Injectable()
export class CustomerAgent {
  constructor(private readonly bookings: BookingsService) {}

  async myBookings(user: AppRequest['user']): Promise<AgentPayload> {
    if (!user) {
      return {
        reply: 'Bạn cần đăng nhập để xem các đơn đặt tour của mình.',
        actions: [{ label: 'Đăng nhập', href: '/login', requiresConfirmation: false }],
        sources: [],
      };
    }

    const rows = await this.bookings.list({ page: 1, pageSize: 5 }, user.id);
    return {
      reply: rows.items.length
        ? rows.items
            .map(
              (b) =>
                b.tourTitle +
                ': ' +
                BOOKING_LABELS[b.status] +
                ', ' +
                b.totalAmount.toLocaleString('vi-VN') +
                ' VND.',
            )
            .join('\n')
        : 'Bạn chưa có đơn đặt tour.',
      actions: rows.items.map((b) => ({
        label: 'Xem ' + b.tourTitle,
        href: '/bookings/' + b.id,
        requiresConfirmation: false,
      })),
      sources: rows.items.map((b) => ({
        type: 'BOOKING' as const,
        id: b.id,
        label: b.tourTitle,
      })),
      facts: rows.items,
    };
  }
}

@Injectable()
export class PolicyAgent {
  run(intent: AgentIntent): AgentPayload {
    const policy =
      'Hệ thống chỉ nhận tour nội địa Việt Nam. Mỗi đơn cần ít nhất 1 người lớn. ' +
      'Chỗ được giữ đúng 15 phút. Khách chỉ được tự hủy khi đơn đang chờ thanh toán hoặc đã thanh toán ' +
      'và còn ít nhất 72 giờ trước giờ khởi hành. Giá và số chỗ luôn được kiểm tra lại tại thời điểm tạo đơn. ' +
      'Thanh toán chỉ được coi là thành công sau callback đã xác minh từ cổng thanh toán; browser return không tự đánh dấu PAID.';

    return {
      reply: policy,
      actions:
        intent.intent === 'POLICY'
          ? []
          : [
              {
                label: 'Mở Đơn của tôi',
                href: '/bookings',
                requiresConfirmation: true,
              },
            ],
      sources: [
        {
          type: 'POLICY',
          id: 'SRS-TOUR-2026-v1.0',
          label: 'Quy tắc đặt, giữ chỗ, hủy và thanh toán',
        },
      ],
      facts: { policy },
    };
  }
}

@Injectable()
export class OperationsAgent {
  constructor(private readonly admin: AdminService) {}

  async run(user: AppRequest['user']): Promise<AgentPayload> {
    if (!user || !['ADMIN', 'OPERATIONS'].includes(user.role)) {
      fail(403, 'FORBIDDEN', 'Chỉ bộ phận vận hành được xem dữ liệu quản trị');
    }
    const summary = await this.admin.summary();
    return {
      reply:
        'Có ' +
        summary.tours +
        ' tour, ' +
        summary.bookings +
        ' đơn và ' +
        summary.pendingRefunds +
        ' giao dịch cần xử lý hoàn tiền.',
      actions: [
        { label: 'Quản lý tour', href: '/admin/tours', requiresConfirmation: false },
        {
          label: 'Lịch khởi hành',
          href: '/admin/schedules',
          requiresConfirmation: false,
        },
        {
          label: 'Xử lý đơn',
          href: '/admin/bookings',
          requiresConfirmation: true,
        },
        {
          label: 'Đối soát thanh toán',
          href: '/admin/payments',
          requiresConfirmation: true,
        },
      ],
      sources: [{ type: 'OPERATIONS', id: 'summary', label: 'Thống kê vận hành' }],
      facts: summary,
    };
  }
}
