import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { AgentPlan, AgentPlanRequest, AgentPlanUpdate, Provider } from '@tour/shared';
import { CacheService } from '../cache/cache.module';
import { PrismaService } from '../database/prisma.service';
import { ToursService } from '../tours/tours.service';
import { SchedulesService } from '../schedules/schedules.service';
import { BookingsService } from '../bookings/bookings.service';
import { PaymentsService } from '../payments/payments.service';
import { fail } from '../common/errors';
import { AiProviderService } from './ai-provider.service';

type Candidate = AgentPlan['candidates'][number];
type PlanRecord = Omit<AgentPlan, 'booking' | 'payment'> & {
  userId: string;
  message: string;
  idempotencyKey: string;
  booking: any;
  payment: any;
};

@Injectable()
export class TravelAgentService {
  constructor(
    private readonly cache: CacheService,
    private readonly db: PrismaService,
    private readonly config: ConfigService,
    private readonly ai: AiProviderService,
    private readonly tours: ToursService,
    private readonly schedules: SchedulesService,
    private readonly bookings: BookingsService,
    private readonly payments: PaymentsService,
  ) {}

  private key(id: string) {
    return 'assistant:travel-agent:' + id;
  }

  private paymentOptions(): AgentPlan['paymentOptions'] {
    return [
      {
        provider: 'CASH',
        available: true,
        label: 'Thanh toán tiền mặt',
        requiresExternalAuthorization: false,
      },
      {
        provider: 'VNPAY',
        available: Boolean(
          this.config.get<string>('VNPAY_TMN_CODE') && this.config.get<string>('VNPAY_HASH_SECRET'),
        ),
        label: 'VNPay',
        requiresExternalAuthorization: true,
      },
      {
        provider: 'MOMO',
        available: Boolean(
          this.config.get<string>('MOMO_PARTNER_CODE') &&
          this.config.get<string>('MOMO_ACCESS_KEY') &&
          this.config.get<string>('MOMO_SECRET_KEY'),
        ),
        label: 'MoMo',
        requiresExternalAuthorization: true,
      },
      {
        provider: 'ZALOPAY',
        available: Boolean(
          this.config.get<string>('ZALOPAY_APP_ID') &&
          this.config.get<string>('ZALOPAY_KEY1') &&
          this.config.get<string>('ZALOPAY_KEY2'),
        ),
        label: 'ZaloPay',
        requiresExternalAuthorization: true,
      },
    ];
  }

  private dateFloor(value?: string) {
    return value ? new Date(value + 'T00:00:00+07:00').getTime() : null;
  }

  private dateCeil(value?: string) {
    return value ? new Date(value + 'T23:59:59.999+07:00').getTime() : null;
  }

  private async candidates(input: {
    destination?: string;
    adults?: number;
    children: number;
    budgetVnd?: number;
    durationDays?: number;
    departureFrom?: string;
    departureTo?: string;
    scheduleId?: string;
  }): Promise<Candidate[]> {
    const adultsForQuote = input.adults ?? 1;
    const children = input.children;
    const partySize = adultsForQuote + children;
    const from = this.dateFloor(input.departureFrom);
    const to = this.dateCeil(input.departureTo);
    const rows: Candidate[] = [];

    if (input.scheduleId) {
      const schedule = await this.schedules.get(input.scheduleId);
      const tour = await this.tours.get(schedule.tourId);
      const totalAmount = adultsForQuote * schedule.adultPrice + children * schedule.childPrice;
      if (
        schedule.availableSeats >= partySize &&
        (from === null || schedule.departureAt.getTime() >= from) &&
        (to === null || schedule.departureAt.getTime() <= to)
      ) {
        rows.push({
          tourId: tour.id,
          tourTitle: tour.title,
          destination: tour.destination,
          durationDays: tour.durationDays,
          scheduleId: schedule.id,
          departureAt: schedule.departureAt.toISOString(),
          availableSeats: schedule.availableSeats,
          adultPrice: schedule.adultPrice,
          childPrice: schedule.childPrice,
          totalAmount,
          currency: 'VND',
        });
      }
      return rows;
    }

    let page = await this.tours.list({
      page: 1,
      pageSize: 20,
      ...(input.destination ? { destination: input.destination } : {}),
    });

    if (!page.items.length && input.destination) {
      page = await this.tours.list({ page: 1, pageSize: 20 });
    }

    for (const tour of page.items) {
      const schedules = await this.schedules.list(tour.id, 1, 20);
      for (const schedule of schedules.items) {
        const time = schedule.departureAt.getTime();
        if (from !== null && time < from) continue;
        if (to !== null && time > to) continue;
        if (schedule.availableSeats < partySize) continue;

        rows.push({
          tourId: tour.id,
          tourTitle: tour.title,
          destination: tour.destination,
          durationDays: tour.durationDays,
          scheduleId: schedule.id,
          departureAt: schedule.departureAt.toISOString(),
          availableSeats: schedule.availableSeats,
          adultPrice: schedule.adultPrice,
          childPrice: schedule.childPrice,
          totalAmount: adultsForQuote * schedule.adultPrice + children * schedule.childPrice,
          currency: 'VND',
        });
      }
    }

    rows.sort((a, b) => {
      if (input.destination) {
        const needle = input.destination.toLocaleLowerCase('vi-VN');
        const am = a.destination.toLocaleLowerCase('vi-VN').includes(needle) ? 0 : 1;
        const bm = b.destination.toLocaleLowerCase('vi-VN').includes(needle) ? 0 : 1;
        if (am !== bm) return am - bm;
      }

      if (input.budgetVnd !== undefined) {
        const aOver = Math.max(0, a.totalAmount - input.budgetVnd);
        const bOver = Math.max(0, b.totalAmount - input.budgetVnd);
        if (aOver !== bOver) return aOver - bOver;
      }

      if (input.durationDays !== undefined) {
        const ad = Math.abs(a.durationDays - input.durationDays);
        const bd = Math.abs(b.durationDays - input.durationDays);
        if (ad !== bd) return ad - bd;
      }

      const dateDiff = new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.totalAmount - b.totalAmount;
    });

    return rows.slice(0, 5);
  }

  private missingFields(input: {
    adults?: number;
    contactPhone?: string;
    provider?: Provider;
    candidates: Candidate[];
    paymentOptions: AgentPlan['paymentOptions'];
  }): AgentPlan['missingFields'] {
    const missing: AgentPlan['missingFields'] = [];
    if (!input.adults) missing.push('PARTY');
    if (!input.contactPhone) missing.push('CONTACT_PHONE');
    if (!input.candidates.length) missing.push('TOUR_OR_SCHEDULE');
    if (
      !input.provider ||
      !input.paymentOptions.some((item) => item.provider === input.provider && item.available)
    ) {
      missing.push('PAYMENT_METHOD');
    }
    return missing;
  }

  private steps(
    status: AgentPlan['status'],
    hasCandidate: boolean,
    hasBooking: boolean,
    hasPayment: boolean,
  ): AgentPlan['steps'] {
    const afterApproval =
      status === 'COMPLETED' || status === 'ACTION_REQUIRED'
        ? 'DONE'
        : status === 'PAYMENT_RETRY_REQUIRED'
          ? 'DONE'
          : status === 'EXECUTING'
            ? 'READY'
            : 'BLOCKED';

    return [
      { id: 'UNDERSTAND', label: 'Hiểu nhu cầu', state: 'DONE' },
      {
        id: 'SEARCH',
        label: 'Tìm và xếp hạng tour',
        state: hasCandidate ? 'DONE' : 'BLOCKED',
      },
      {
        id: 'VERIFY',
        label: 'Kiểm tra lịch, giá và số chỗ',
        state: hasCandidate ? 'DONE' : 'BLOCKED',
      },
      {
        id: 'APPROVAL',
        label: 'Khách duyệt kế hoạch',
        state:
          status === 'READY_FOR_APPROVAL' || status === 'REAPPROVAL_REQUIRED'
            ? 'WAITING_APPROVAL'
            : status === 'NEEDS_INPUT' || status === 'NO_MATCH'
              ? 'BLOCKED'
              : 'DONE',
      },
      {
        id: 'CREATE_BOOKING',
        label: 'Tạo booking và giữ chỗ',
        state: hasBooking ? 'DONE' : afterApproval,
      },
      {
        id: 'CREATE_PAYMENT',
        label: 'Khởi tạo phương thức thanh toán',
        state: hasPayment ? 'DONE' : status === 'PAYMENT_RETRY_REQUIRED' ? 'READY' : afterApproval,
      },
      {
        id: 'VERIFY_RESULT',
        label: 'Xác minh kết quả cuối',
        state:
          status === 'COMPLETED'
            ? 'DONE'
            : status === 'ACTION_REQUIRED'
              ? 'ACTION_REQUIRED'
              : 'BLOCKED',
      },
    ];
  }

  private checkpoint(
    version: number,
    candidate: Candidate | undefined,
    adults: number | undefined,
    children: number,
    provider: Provider | undefined,
  ): AgentPlan['checkpoint'] {
    if (!candidate || !adults || !provider) return null;
    const people = adults + children;
    const providerLabel =
      this.paymentOptions().find((item) => item.provider === provider)?.label || provider;
    return {
      title: 'Cho phép AI thực hiện kế hoạch này?',
      summary:
        candidate.tourTitle +
        ' • ' +
        new Date(candidate.departureAt).toLocaleDateString('vi-VN') +
        ' • ' +
        people +
        ' khách • ' +
        candidate.totalAmount.toLocaleString('vi-VN') +
        ' VND',
      effects: [
        'Tạo một booking thật và giữ ' + people + ' chỗ.',
        'Giá và số chỗ sẽ được kiểm tra lại ngay trước khi thực hiện.',
        'Chọn phương thức thanh toán: ' + providerLabel + '.',
        provider === 'CASH'
          ? 'AI không tự thu tiền. Đơn sẽ chuyển sang chờ thanh toán tiền mặt.'
          : 'AI chỉ tạo phiên thanh toán. Bạn vẫn phải tự xác nhận tại cổng thanh toán.',
      ],
      requiresExplicitApproval: true,
      version,
    };
  }

  private async persist(record: PlanRecord, ttl = 900) {
    await this.cache.writeRequired(this.key(record.id), record, ttl);
    return record;
  }

  private async readOwned(id: string, userId: string) {
    const record = await this.cache.readRequired<PlanRecord>(this.key(id));
    if (!record) fail(404, 'AGENT_PLAN_NOT_FOUND', 'Kế hoạch không tồn tại hoặc đã hết hạn');
    if (record.userId !== userId) fail(403, 'FORBIDDEN', 'Kế hoạch không thuộc tài khoản này');
    if (new Date(record.expiresAt).getTime() <= Date.now() && !record.booking) {
      fail(410, 'AGENT_PLAN_EXPIRED', 'Kế hoạch đã hết hạn. Hãy để AI lập kế hoạch mới.');
    }
    return record;
  }

  private toPublic(record: PlanRecord): AgentPlan {
    const {
      userId: _userId,
      message: _message,
      idempotencyKey: _idempotencyKey,
      ...publicPlan
    } = record;
    return publicPlan as AgentPlan;
  }

  async create(userId: string, input: AgentPlanRequest): Promise<AgentPlan> {
    const user = await this.db.user.findFirstOrThrow({
      where: { id: userId, isActive: true },
      select: { name: true, email: true },
    });

    const planned = await this.ai.classify(input.message, []);
    const intent = planned.intent;
    const adults = input.adults ?? intent.adults;
    const children = input.children ?? intent.children ?? 0;
    const destination = input.destination ?? intent.destination;
    const budgetVnd = input.budgetVnd ?? intent.budgetVnd;
    const durationDays = input.durationDays ?? intent.durationDays;
    const departureFrom = input.departureFrom ?? intent.departureFrom;
    const departureTo = input.departureTo ?? intent.departureTo;
    const scheduleId = input.scheduleId ?? intent.scheduleId;
    const paymentOptions = this.paymentOptions();

    const candidates = await this.candidates({
      destination,
      adults,
      children,
      budgetVnd,
      durationDays,
      departureFrom,
      departureTo,
      scheduleId,
    });

    const missingFields = this.missingFields({
      adults,
      contactPhone: input.contactPhone,
      provider: input.provider,
      candidates,
      paymentOptions,
    });

    const version = 1;
    const selected = candidates[0];
    const status: AgentPlan['status'] = !candidates.length
      ? 'NO_MATCH'
      : missingFields.length
        ? 'NEEDS_INPUT'
        : 'READY_FOR_APPROVAL';
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    const summary = selected
      ? 'AI đề xuất ' +
        selected.tourTitle +
        ', khởi hành ' +
        new Date(selected.departureAt).toLocaleDateString('vi-VN') +
        ', tổng dự kiến ' +
        selected.totalAmount.toLocaleString('vi-VN') +
        ' VND.'
      : 'Chưa tìm thấy lịch khởi hành phù hợp với các ràng buộc hiện tại.';

    const record: PlanRecord = {
      id: randomUUID(),
      userId,
      message: input.message,
      idempotencyKey: randomUUID(),
      version,
      status,
      mode: planned.mode,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      summary,
      rationale: selected
        ? 'Xếp hạng dựa trên điểm đến, cửa sổ ngày, ngân sách, thời lượng, giá và số chỗ thực tế.'
        : 'Không có lịch đang mở đáp ứng các điều kiện hiện tại.',
      constraints: {
        destination: destination ?? null,
        adults: adults ?? null,
        children,
        budgetVnd: budgetVnd ?? null,
        durationDays: durationDays ?? null,
        departureFrom: departureFrom ?? null,
        departureTo: departureTo ?? null,
        contactName: user.name,
        contactEmail: user.email,
        contactPhone: input.contactPhone ?? null,
        provider: input.provider ?? null,
      },
      missingFields,
      candidates,
      selectedScheduleId: selected?.scheduleId ?? null,
      paymentOptions,
      steps: this.steps(status, Boolean(selected), false, false),
      checkpoint:
        status === 'READY_FOR_APPROVAL'
          ? this.checkpoint(version, selected, adults, children, input.provider)
          : null,
      booking: null,
      payment: null,
      nextAction: null,
      lastError: null,
    };

    await this.persist(record);
    return this.toPublic(record);
  }

  async get(userId: string, id: string): Promise<AgentPlan> {
    return this.toPublic(await this.readOwned(id, userId));
  }

  async update(userId: string, id: string, patch: AgentPlanUpdate): Promise<AgentPlan> {
    const current = await this.readOwned(id, userId);
    if (current.booking || ['COMPLETED', 'ACTION_REQUIRED'].includes(current.status)) {
      fail(409, 'AGENT_PLAN_LOCKED', 'Kế hoạch đã bắt đầu thực hiện và không thể sửa');
    }
    if (current.status === 'DECLINED') {
      fail(409, 'AGENT_PLAN_DECLINED', 'Kế hoạch đã bị từ chối');
    }

    const constraints = {
      ...current.constraints,
      ...(patch.destination !== undefined ? { destination: patch.destination } : {}),
      ...(patch.adults !== undefined ? { adults: patch.adults } : {}),
      ...(patch.children !== undefined ? { children: patch.children } : {}),
      ...(patch.budgetVnd !== undefined ? { budgetVnd: patch.budgetVnd } : {}),
      ...(patch.durationDays !== undefined ? { durationDays: patch.durationDays } : {}),
      ...(patch.departureFrom !== undefined ? { departureFrom: patch.departureFrom } : {}),
      ...(patch.departureTo !== undefined ? { departureTo: patch.departureTo } : {}),
      ...(patch.contactPhone !== undefined ? { contactPhone: patch.contactPhone } : {}),
      ...(patch.provider !== undefined ? { provider: patch.provider } : {}),
    };

    const paymentOptions = this.paymentOptions();
    const candidates = await this.candidates({
      destination: constraints.destination ?? undefined,
      adults: constraints.adults ?? undefined,
      children: constraints.children,
      budgetVnd: constraints.budgetVnd ?? undefined,
      durationDays: constraints.durationDays ?? undefined,
      departureFrom: constraints.departureFrom ?? undefined,
      departureTo: constraints.departureTo ?? undefined,
      scheduleId: patch.scheduleId,
    });
    const selected =
      (patch.scheduleId
        ? candidates.find((item) => item.scheduleId === patch.scheduleId)
        : candidates.find((item) => item.scheduleId === current.selectedScheduleId)) ||
      candidates[0];

    const ordered = selected
      ? [selected, ...candidates.filter((item) => item.scheduleId !== selected.scheduleId)]
      : candidates;

    const missingFields = this.missingFields({
      adults: constraints.adults ?? undefined,
      contactPhone: constraints.contactPhone ?? undefined,
      provider: constraints.provider ?? undefined,
      candidates: ordered,
      paymentOptions,
    });
    const version = current.version + 1;
    const status: AgentPlan['status'] = !ordered.length
      ? 'NO_MATCH'
      : missingFields.length
        ? 'NEEDS_INPUT'
        : 'READY_FOR_APPROVAL';

    const updated: PlanRecord = {
      ...current,
      version,
      status,
      constraints,
      missingFields,
      candidates: ordered,
      selectedScheduleId: selected?.scheduleId ?? null,
      paymentOptions,
      summary: selected
        ? 'AI đề xuất ' +
          selected.tourTitle +
          ', khởi hành ' +
          new Date(selected.departureAt).toLocaleDateString('vi-VN') +
          ', tổng dự kiến ' +
          selected.totalAmount.toLocaleString('vi-VN') +
          ' VND.'
        : 'Chưa tìm thấy lịch phù hợp. Hãy nới điều kiện hoặc chọn thời gian khác.',
      rationale: selected
        ? 'Kế hoạch đã được tính lại từ dữ liệu tour, lịch, giá và tồn chỗ hiện tại.'
        : 'Không có lịch đang mở đáp ứng các điều kiện mới.',
      steps: this.steps(status, Boolean(selected), false, false),
      checkpoint:
        status === 'READY_FOR_APPROVAL'
          ? this.checkpoint(
              version,
              selected,
              constraints.adults ?? undefined,
              constraints.children,
              constraints.provider ?? undefined,
            )
          : null,
      lastError: null,
    };

    await this.persist(updated);
    return this.toPublic(updated);
  }

  async decline(userId: string, id: string): Promise<AgentPlan> {
    const current = await this.readOwned(id, userId);
    if (current.booking) {
      fail(
        409,
        'AGENT_ACTION_ALREADY_STARTED',
        'Booking đã được tạo. Nếu muốn dừng, hãy dùng luồng hủy booking có kiểm soát.',
      );
    }
    const updated: PlanRecord = {
      ...current,
      status: 'DECLINED',
      checkpoint: null,
      steps: this.steps('DECLINED', Boolean(current.selectedScheduleId), false, false),
      lastError: null,
    };
    await this.persist(updated, 300);
    return this.toPublic(updated);
  }

  async approve(userId: string, id: string, version: number, ip: string): Promise<AgentPlan> {
    let current = await this.readOwned(id, userId);
    if (current.status === 'COMPLETED' || current.status === 'ACTION_REQUIRED') {
      return this.toPublic(current);
    }
    if (version !== current.version) {
      fail(
        409,
        'AGENT_STALE_APPROVAL',
        'Kế hoạch đã thay đổi. Hãy xem lại nội dung mới trước khi cho phép.',
      );
    }
    if (
      !['READY_FOR_APPROVAL', 'REAPPROVAL_REQUIRED', 'PAYMENT_RETRY_REQUIRED'].includes(
        current.status,
      )
    ) {
      fail(409, 'AGENT_NOT_READY', 'Kế hoạch chưa sẵn sàng để thực hiện');
    }

    const selected = current.candidates.find(
      (item) => item.scheduleId === current.selectedScheduleId,
    );
    const adults = current.constraints.adults;
    const phone = current.constraints.contactPhone;
    const provider = current.constraints.provider;
    if (!selected || !adults || !phone || !provider) {
      fail(409, 'AGENT_MISSING_INPUT', 'Kế hoạch còn thiếu thông tin bắt buộc');
    }

    if (!current.paymentOptions.some((item) => item.provider === provider && item.available)) {
      fail(409, 'PROVIDER_NOT_CONFIGURED', 'Phương thức thanh toán chưa khả dụng');
    }

    if (!current.booking) {
      const freshQuote = await this.bookings.quote({
        scheduleId: selected.scheduleId,
        adults,
        children: current.constraints.children,
      });

      if (freshQuote.totalAmount !== selected.totalAmount) {
        const versionNext = current.version + 1;
        const refreshedCandidate: Candidate = {
          ...selected,
          availableSeats: freshQuote.availableSeats,
          adultPrice: freshQuote.adultPrice,
          childPrice: freshQuote.childPrice,
          totalAmount: freshQuote.totalAmount,
        };
        current = {
          ...current,
          version: versionNext,
          status: 'REAPPROVAL_REQUIRED',
          candidates: [
            refreshedCandidate,
            ...current.candidates.filter(
              (item) => item.scheduleId !== refreshedCandidate.scheduleId,
            ),
          ],
          summary:
            'Giá vừa thay đổi thành ' +
            freshQuote.totalAmount.toLocaleString('vi-VN') +
            ' VND. AI đã dừng để bạn duyệt lại.',
          checkpoint: this.checkpoint(
            versionNext,
            refreshedCandidate,
            adults,
            current.constraints.children,
            provider,
          ),
          steps: this.steps('REAPPROVAL_REQUIRED', true, false, false),
          lastError: null,
        };
        await this.persist(current);
        return this.toPublic(current);
      }

      current = {
        ...current,
        status: 'EXECUTING',
        checkpoint: null,
        steps: this.steps('EXECUTING', true, false, false),
        lastError: null,
      };
      await this.persist(current);

      const booking = await this.bookings.create(
        userId,
        {
          scheduleId: selected.scheduleId,
          adults,
          children: current.constraints.children,
          contactName: current.constraints.contactName,
          contactEmail: current.constraints.contactEmail,
          contactPhone: phone,
        },
        current.idempotencyKey,
      );

      current = {
        ...current,
        booking,
        steps: this.steps('EXECUTING', true, true, false),
      };
      await this.persist(current, 3600);
    }

    try {
      const payment = await this.payments.create(userId, current.booking.id, provider, ip);
      const booking = await this.bookings.get(current.booking.id, userId);
      const option = current.paymentOptions.find((item) => item.provider === provider);
      const actionRequired = Boolean(option?.requiresExternalAuthorization && payment.checkoutUrl);
      const status: AgentPlan['status'] = actionRequired ? 'ACTION_REQUIRED' : 'COMPLETED';

      current = {
        ...current,
        status,
        booking,
        payment,
        checkpoint: null,
        nextAction: actionRequired
          ? {
              type: 'OPEN_PAYMENT',
              label: 'Mở cổng thanh toán an toàn',
              href: payment.checkoutUrl!,
            }
          : {
              type: 'OPEN_BOOKING',
              label: 'Xem đơn vừa tạo',
              href: '/bookings/' + booking.id,
            },
        summary: actionRequired
          ? 'AI đã tạo booking và phiên thanh toán. Bạn cần xác nhận thanh toán tại cổng bên ngoài.'
          : provider === 'CASH'
            ? 'AI đã tạo booking, giữ chỗ và chuyển đơn sang chờ thanh toán tiền mặt.'
            : 'AI đã hoàn tất các bước có thể thực hiện tự động.',
        steps: this.steps(status, true, true, true),
        lastError: null,
      };
      await this.persist(current, 3600);
      return this.toPublic(current);
    } catch (error) {
      current = {
        ...current,
        status: 'PAYMENT_RETRY_REQUIRED',
        checkpoint: null,
        steps: this.steps('PAYMENT_RETRY_REQUIRED', true, true, false),
        lastError:
          error instanceof Error
            ? error.message
            : 'Không thể khởi tạo thanh toán. Booking vẫn được giữ an toàn.',
      };
      await this.persist(current, 3600);
      return this.toPublic(current);
    }
  }
}
