import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  HOLD_MS,
  calculateTotal,
  canCustomerCancel,
  CreateBookingInput,
  QuoteInput,
  PaginationSchema,
} from '@tour/shared';
import { PrismaService } from '../database/prisma.service';
import { fail } from '../common/errors';
import { lockSchedule, dbNow, expireLocked, cancelLocked } from './inventory';
import { bookingDto, bookingInclude } from './dto';
@Injectable()
export class BookingsService {
  constructor(private readonly db: PrismaService) {}
  async quote(input: QuoteInput) {
    return this.db.serial(async (tx) => {
      await lockSchedule(tx, input.scheduleId);
      const now = await dbNow(tx);
      await expireLocked(tx, input.scheduleId, now);
      const s = await tx.schedule.findUniqueOrThrow({
        where: { id: input.scheduleId },
        include: { tour: true },
      });
      if (
        s.tour.status !== 'ACTIVE' ||
        s.tour.deletedAt ||
        s.tour.countryCode !== 'VN' ||
        s.status !== 'OPEN' ||
        s.departureAt <= now
      )
        fail(409, 'SCHEDULE_UNAVAILABLE', 'Lịch khởi hành không nhận đặt chỗ');
      if (s.totalSeats - s.reservedSeats < input.adults + input.children)
        fail(409, 'INSUFFICIENT_SEATS', 'Không đủ chỗ');
      return {
        ...input,
        adultPrice: Number(s.adultPrice),
        childPrice: Number(s.childPrice),
        totalAmount: calculateTotal(
          input.adults,
          input.children,
          Number(s.adultPrice),
          Number(s.childPrice),
        ),
        currency: 'VND' as const,
        availableSeats: s.totalSeats - s.reservedSeats,
        serverTime: now,
      };
    });
  }
  async create(userId: string, input: CreateBookingInput, idempotencyKey: string) {
    const requestHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    return this.db.serial(async (tx) => {
      await lockSchedule(tx, input.scheduleId);
      const now = await dbNow(tx);
      await expireLocked(tx, input.scheduleId, now);
      const old = await tx.booking.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey } },
        include: bookingInclude,
      });
      if (old) {
        if (old.requestHash !== requestHash)
          fail(409, 'IDEMPOTENCY_CONFLICT', 'Mã yêu cầu đã được dùng cho dữ liệu khác');
        return bookingDto(old, now);
      }
      const s = await tx.schedule.findUniqueOrThrow({
        where: { id: input.scheduleId },
        include: { tour: true },
      });
      if (
        s.tour.status !== 'ACTIVE' ||
        s.tour.deletedAt ||
        s.tour.countryCode !== 'VN' ||
        s.status !== 'OPEN' ||
        s.departureAt.getTime() <= now.getTime() + HOLD_MS
      )
        fail(
          409,
          'SCHEDULE_UNAVAILABLE',
          'Lịch đóng, tour không hoạt động hoặc còn không quá 15 phút tới giờ khởi hành',
        );
      const seats = input.adults + input.children;
      if (s.totalSeats - s.reservedSeats < seats) fail(409, 'INSUFFICIENT_SEATS', 'Không đủ chỗ');
      const totalAmount = BigInt(
        calculateTotal(input.adults, input.children, Number(s.adultPrice), Number(s.childPrice)),
      );
      await tx.schedule.update({
        where: { id: s.id },
        data: { reservedSeats: { increment: seats } },
      });
      const details = [
        {
          kind: 'ADULT' as const,
          quantity: input.adults,
          unitPrice: s.adultPrice,
          lineTotal: BigInt(input.adults) * s.adultPrice,
        },
        ...(input.children
          ? [
              {
                kind: 'CHILD' as const,
                quantity: input.children,
                unitPrice: s.childPrice,
                lineTotal: BigInt(input.children) * s.childPrice,
              },
            ]
          : []),
      ];
      const b = await tx.booking.create({
        data: {
          ...input,
          userId,
          idempotencyKey,
          requestHash,
          totalAmount,
          tourTitle: s.tour.title,
          createdAt: now,
          expiresAt: new Date(now.getTime() + HOLD_MS),
          details: { create: details },
        },
        include: bookingInclude,
      });
      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'BOOKING_CREATED',
          entityId: b.id,
          metadata: { seats, totalAmount: Number(totalAmount) },
        },
      });
      // The persisted pending booking is also the timeout outbox. Queue publishing is retried independently.
      return bookingDto(b, now);
    });
  }
  async get(id: string, userId?: string) {
    const b = await this.db.booking.findFirstOrThrow({
      where: { id, ...(userId ? { userId } : {}) },
      select: { scheduleId: true },
    });
    return this.db.serial(async (tx) => {
      await lockSchedule(tx, b.scheduleId);
      const now = await dbNow(tx);
      await expireLocked(tx, b.scheduleId, now);
      return bookingDto(
        await tx.booking.findUniqueOrThrow({ where: { id }, include: bookingInclude }),
        now,
      );
    });
  }
  async list(q: z.infer<typeof PaginationSchema>, userId?: string) {
    const where = userId ? { userId } : {};
    const [rows, total] = await this.db.$transaction([
      this.db.booking.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        select: { id: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      }),
      this.db.booking.count({ where }),
    ]);
    const items = [];
    for (const b of rows) items.push(await this.get(b.id, userId));
    return { items, total, page: q.page, pageSize: q.pageSize };
  }
  async cancel(id: string, actorId: string, reason: string, operations = false) {
    const b = await this.db.booking.findFirstOrThrow({
      where: { id, ...(!operations ? { userId: actorId } : {}) },
      select: { scheduleId: true },
    });
    return this.db.serial(async (tx) => {
      await lockSchedule(tx, b.scheduleId);
      const now = await dbNow(tx);
      await expireLocked(tx, b.scheduleId, now);
      const fresh = await tx.booking.findUniqueOrThrow({ where: { id }, include: bookingInclude });
      if (fresh.status === 'CANCELLED') return bookingDto(fresh, now);
      if (!operations && !canCustomerCancel(fresh.status, fresh.schedule.departureAt, now))
        fail(
          409,
          'CANCELLATION_NOT_ALLOWED',
          'Chỉ được hủy đơn chờ thanh toán/đã thanh toán trước khởi hành ít nhất 72 giờ',
        );
      await cancelLocked(tx, id, reason, now, actorId);
      return bookingDto(
        await tx.booking.findUniqueOrThrow({ where: { id }, include: bookingInclude }),
        now,
      );
    });
  }
  async transition(id: string, status: 'CONFIRMED' | 'COMPLETED', actorId: string) {
    const b = await this.db.booking.findUniqueOrThrow({
      where: { id },
      select: { scheduleId: true },
    });
    return this.db.serial(async (tx) => {
      await lockSchedule(tx, b.scheduleId);
      const now = await dbNow(tx);
      await expireLocked(tx, b.scheduleId, now);
      const current = await tx.booking.findUniqueOrThrow({
        where: { id },
        include: bookingInclude,
      });
      if (current.status === status) return bookingDto(current, now);
      if (
        (status === 'CONFIRMED' && current.status !== 'PAID') ||
        (status === 'COMPLETED' && current.status !== 'CONFIRMED')
      )
        fail(409, 'INVALID_TRANSITION', 'Không được bỏ qua trạng thái');
      if (status === 'COMPLETED' && now.getTime() < current.schedule.departureAt.getTime())
        fail(409, 'TOUR_NOT_STARTED', 'Chưa tới giờ khởi hành');
      const updated = await tx.booking.update({
        where: { id },
        data: { status },
        include: bookingInclude,
      });
      await tx.auditLog.create({ data: { actorId, action: `BOOKING_${status}`, entityId: id } });
      return bookingDto(updated, now);
    });
  }
  async expire(id: string) {
    const b = await this.db.booking.findUnique({ where: { id }, select: { scheduleId: true } });
    if (!b) return;
    await this.db.serial(async (tx) => {
      await lockSchedule(tx, b.scheduleId);
      await expireLocked(tx, b.scheduleId, await dbNow(tx));
    });
  }
}
