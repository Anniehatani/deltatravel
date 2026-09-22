import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
  CreateTourSchema,
  UpdateTourSchema,
  CreateScheduleSchema,
  UpdateScheduleSchema,
  PaginationSchema,
  RefundRecordSchema,
} from '@tour/shared';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.module';
import { lockSchedule, dbNow, expireLocked } from '../bookings/inventory';
import { scheduleDto, paymentDto } from '../bookings/dto';
import { fail } from '../common/errors';
@Injectable()
export class AdminService {
  constructor(
    private readonly db: PrismaService,
    private readonly cache: CacheService,
  ) {}
  async createTour(input: z.infer<typeof CreateTourSchema>, actorId: string) {
    return this.db.serial(async (tx) => {
      const { deletedAt, ...t } = await tx.tour.create({ data: input });
      await tx.auditLog.create({ data: { actorId, action: 'TOUR_CREATED', entityId: t.id } });
      return t;
    });
  }
  async updateTour(id: string, input: z.infer<typeof UpdateTourSchema>, actorId: string) {
    return this.db.serial(async (tx) => {
      const { deletedAt, ...t } = await tx.tour.update({
        where: { id, deletedAt: null },
        data: input,
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'TOUR_UPDATED',
          entityId: id,
          metadata: { fields: Object.keys(input) },
        },
      });
      return t;
    });
  }
  async archiveTour(id: string, actorId: string) {
    return this.db.serial(async (tx) => {
      await tx.tour.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } });
      await tx.auditLog.create({ data: { actorId, action: 'TOUR_ARCHIVED', entityId: id } });
      return { ok: true as const };
    });
  }
  async createSchedule(input: z.infer<typeof CreateScheduleSchema>, actorId: string) {
    return this.db.serial(async (tx) => {
      const now = await dbNow(tx);
      if (new Date(input.departureAt) <= now)
        fail(400, 'PAST_DEPARTURE', 'Ngày khởi hành phải ở tương lai');
      await tx.tour.findFirstOrThrow({
        where: { id: input.tourId, deletedAt: null, countryCode: 'VN' },
      });
      const s = await tx.schedule.create({
        data: {
          ...input,
          departureAt: new Date(input.departureAt),
          adultPrice: BigInt(input.adultPrice),
          childPrice: BigInt(input.childPrice),
        },
      });
      await tx.auditLog.create({ data: { actorId, action: 'SCHEDULE_CREATED', entityId: s.id } });
      return scheduleDto(s, now);
    });
  }
  async updateSchedule(id: string, input: z.infer<typeof UpdateScheduleSchema>, actorId: string) {
    return this.db.serial(async (tx) => {
      await lockSchedule(tx, id);
      const now = await dbNow(tx);
      await expireLocked(tx, id, now);
      const current = await tx.schedule.findUniqueOrThrow({ where: { id } });
      if (input.totalSeats !== undefined && input.totalSeats < current.reservedSeats)
        fail(
          409,
          'CAPACITY_BELOW_RESERVED',
          'Tổng chỗ không được nhỏ hơn số chỗ đang giữ hoặc đã đặt',
        );
      const s = await tx.schedule.update({ where: { id }, data: input });
      await tx.auditLog.create({
        data: { actorId, action: 'SCHEDULE_UPDATED', entityId: id, metadata: input },
      });
      return scheduleDto(s, now);
    });
  }
  async schedules(q: z.infer<typeof PaginationSchema>) {
    const [rows, total] = await this.db.$transaction([
      this.db.schedule.findMany({
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        select: { id: true },
        orderBy: [{ departureAt: 'desc' }, { id: 'asc' }],
      }),
      this.db.schedule.count(),
    ]);
    const items = [];
    for (const row of rows)
      items.push(
        await this.db.serial(async (tx) => {
          await lockSchedule(tx, row.id);
          const now = await dbNow(tx);
          await expireLocked(tx, row.id, now);
          return scheduleDto(await tx.schedule.findUniqueOrThrow({ where: { id: row.id } }), now);
        }),
      );
    return { ...q, total, items };
  }
  async summary() {
    const cached = await this.cache.read<{
      tours: number;
      bookings: number;
      pendingRefunds: number;
    }>('operations:summary');
    if (cached) return cached;
    const [tours, bookings, pendingRefunds] = await Promise.all([
      this.db.tour.count({ where: { deletedAt: null } }),
      this.db.booking.count(),
      this.db.payment.count({ where: { status: 'REFUND_REQUIRED' } }),
    ]);
    const value = { tours, bookings, pendingRefunds };
    await this.cache.write('operations:summary', value, 15);
    return value;
  }
  async payments(q: z.infer<typeof PaginationSchema>) {
    const [items, total] = await this.db.$transaction([
      this.db.payment.findMany({
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      }),
      this.db.payment.count(),
    ]);
    return { ...q, total, items: items.map(paymentDto) };
  }
  async recordRefund(id: string, input: z.infer<typeof RefundRecordSchema>, actorId: string) {
    const p = await this.db.payment.findUniqueOrThrow({
      where: { id },
      include: { booking: true },
    });
    return this.db.serial(async (tx) => {
      await lockSchedule(tx, p.booking.scheduleId);
      const current = await tx.payment.findUniqueOrThrow({ where: { id } });
      if (current.status === 'REFUNDED') {
        if (current.refundReference !== input.reference)
          fail(409, 'REFUND_REFERENCE_CONFLICT', 'Mã hoàn tiền không trùng lần ghi nhận trước');
        return paymentDto(current);
      }
      if (current.status !== 'REFUND_REQUIRED')
        fail(409, 'REFUND_NOT_REQUIRED', 'Giao dịch chưa ở trạng thái cần hoàn tiền');
      const result = await tx.payment.update({
        where: { id },
        data: { status: 'REFUNDED', refundedAt: await dbNow(tx), refundReference: input.reference },
      });
      await tx.auditLog.create({
        data: { actorId, action: 'REFUND_RECORDED_MANUALLY', entityId: id, metadata: input },
      });
      return paymentDto(result);
    });
  }
  async audit(q: z.infer<typeof PaginationSchema>) {
    const [items, total] = await this.db.$transaction([
      this.db.auditLog.findMany({
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      }),
      this.db.auditLog.count(),
    ]);
    return { ...q, total, items };
  }
}
