import 'reflect-metadata';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/database/prisma.service';
import { BookingsService } from '../../src/bookings/bookings.service';
import { PaymentsService } from '../../src/payments/payments.service';
import { AdminService } from '../../src/admin/admin.service';
import { AuthService } from '../../src/auth/auth.service';
import { Gateways } from '../../src/payments/gateways';
import { CacheService } from '../../src/cache/cache.module';
import { HOLD_MS } from '@tour/shared';
const db = new PrismaService();
const bookings = new BookingsService(db);
const gateway = new Gateways(new ConfigService({}));
const payments = new PaymentsService(db, gateway);
const admin = new AdminService(db, {
  read: async () => null,
  write: async () => {},
} as unknown as CacheService);
const auth = new AuthService(
  db,
  new JwtService({
    secret: 'integration_only_secret_32_characters',
    signOptions: { expiresIn: 900 },
  }),
);
let userId: string, tourId: string;
const nonce = randomUUID();
const createdBookingIds: string[] = [],
  createdScheduleIds: string[] = [];
beforeAll(async () => {
  // Fail closed: never run these writes against an unmarked database.
  if (!process.env.DATABASE_URL?.includes('tour_booking_test'))
    throw new Error('Integration tests require a dedicated tour_booking_test database');
  await db.$connect();
  userId = (
    await db.user.create({
      data: {
        name: 'Integration Test',
        email: `${nonce}@test.invalid`,
        passwordHash: 'not-a-login-hash',
      },
    })
  ).id;
  tourId = (
    await db.tour.create({
      data: {
        title: 'Test Vietnam',
        slug: `test-${nonce}`,
        description: 'Integration test tour',
        destination: 'Đà Nẵng',
        durationDays: 2,
        status: 'ACTIVE',
      },
    })
  ).id;
});
afterAll(async () => {
  if (userId) {
    const rows = await db.booking.findMany({ where: { userId }, select: { id: true } });
    const ids = rows.map((b) => b.id);
    createdBookingIds.push(...ids);
    await db.payment.deleteMany({ where: { bookingId: { in: ids } } });
    await db.bookingDetail.deleteMany({ where: { bookingId: { in: ids } } });
    await db.booking.deleteMany({ where: { userId } });
    await db.schedule.deleteMany({ where: { tourId } });
    await db.tour.delete({ where: { id: tourId } });
    await db.refreshSession.deleteMany({ where: { userId } });
    await db.user.delete({ where: { id: userId } });
    await db.auditLog.deleteMany({
      where: {
        OR: [{ actorId: userId }, { entityId: { in: [...ids, ...createdScheduleIds, tourId] } }],
      },
    });
  }
  await db.$disconnect();
});
async function schedule(seats = 10, price = 100000) {
  const row = await db.schedule.create({
    data: {
      tourId,
      departureAt: new Date(Date.now() + 10 * 86400000),
      totalSeats: seats,
      adultPrice: price,
      childPrice: 50000,
    },
  });
  createdScheduleIds.push(row.id);
  return row;
}
const input = (scheduleId: string, adults = 1) => ({
  scheduleId,
  adults,
  children: 0,
  contactName: 'Test User',
  contactEmail: 'test@example.com',
  contactPhone: '0901234567',
});
async function pendingPayment(bookingId: string) {
  return db.payment.create({
    data: {
      bookingId,
      provider: 'VNPAY',
      providerReference: randomUUID(),
      amount: (await db.booking.findUniqueOrThrow({ where: { id: bookingId } })).totalAmount,
    },
  });
}
async function forceExpired(id: string) {
  const createdAt = new Date(Date.now() - HOLD_MS - 1000);
  await db.booking.update({
    where: { id },
    data: { createdAt, expiresAt: new Date(createdAt.getTime() + HOLD_MS) },
  });
}
describe('database business invariants', () => {
  it('creates a hold with exactly 900000 milliseconds and snapshots prices', async () => {
    const s = await schedule();
    const b = await bookings.create(userId, input(s.id, 2), randomUUID());
    expect(b.expiresAt.getTime() - b.createdAt.getTime()).toBe(900000);
    expect(b.totalAmount).toBe(200000);
    expect((await db.schedule.findUniqueOrThrow({ where: { id: s.id } })).reservedSeats).toBe(2);
    await admin.updateSchedule(s.id, { adultPrice: 200000 }, userId);
    expect((await bookings.get(b.id, userId)).totalAmount).toBe(200000);
  });
  it('rejects zero adults even through a raw database write', async () => {
    const s = await schedule();
    const b = await bookings.create(userId, input(s.id), randomUUID());
    await expect(db.booking.update({ where: { id: b.id }, data: { adults: 0 } })).rejects.toThrow();
    // The optional WASM socket runner closes a connection after a SQL error.
    // Reconnect explicitly in tests; production never retries arbitrary writes.
    await db.$disconnect();
    await db.$connect();
  });
  it('reserves the final seat once under simultaneous requests', async () => {
    const s = await schedule(1);
    const results = await Promise.allSettled([
      bookings.create(userId, input(s.id), randomUUID()),
      bookings.create(userId, input(s.id), randomUUID()),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await db.schedule.findUniqueOrThrow({ where: { id: s.id } })).reservedSeats).toBe(1);
  });
  it('replays a booking key without consuming seats twice', async () => {
    const s = await schedule(),
      key = randomUUID();
    const a = await bookings.create(userId, input(s.id), key);
    const b = await bookings.create(userId, input(s.id), key);
    expect(a.id).toBe(b.id);
    expect((await db.schedule.findUniqueOrThrow({ where: { id: s.id } })).reservedSeats).toBe(1);
    await expect(bookings.create(userId, input(s.id, 2), key)).rejects.toThrow();
  });
  it('returns seats only once for concurrent repeated cancellation', async () => {
    const s = await schedule();
    const b = await bookings.create(userId, input(s.id, 3), randomUUID());
    await Promise.all([
      bookings.cancel(b.id, userId, 'Khách yêu cầu hủy'),
      bookings.cancel(b.id, userId, 'Khách yêu cầu hủy'),
    ]);
    expect((await db.schedule.findUniqueOrThrow({ where: { id: s.id } })).reservedSeats).toBe(0);
  });
  it('automatically frees an expired hold before the next booking', async () => {
    const s = await schedule(1);
    const a = await bookings.create(userId, input(s.id), randomUUID());
    await forceExpired(a.id);
    const b = await bookings.create(userId, input(s.id), randomUUID());
    expect(b.status).toBe('PENDING_PAYMENT');
    expect((await db.booking.findUniqueOrThrow({ where: { id: a.id } })).status).toBe('CANCELLED');
  });
  it('treats duplicate signed payment events idempotently', async () => {
    const s = await schedule();
    const b = await bookings.create(userId, input(s.id), randomUUID());
    const p = await pendingPayment(b.id);
    const event = {
      provider: 'VNPAY' as const,
      reference: p.providerReference,
      transactionId: randomUUID(),
      amount: p.amount,
      success: true,
    };
    expect(await payments.settle(event)).toBe('APPLIED');
    expect(await payments.settle(event)).toBe('DUPLICATE');
    expect((await bookings.get(b.id, userId)).status).toBe('PAID');
    expect((await db.schedule.findUniqueOrThrow({ where: { id: s.id } })).reservedSeats).toBe(1);
  });
  it('does not accept a wrong amount', async () => {
    const s = await schedule();
    const b = await bookings.create(userId, input(s.id), randomUUID());
    const p = await pendingPayment(b.id);
    await expect(
      payments.settle({
        provider: 'VNPAY',
        reference: p.providerReference,
        transactionId: randomUUID(),
        amount: p.amount + 1n,
        success: true,
      }),
    ).rejects.toThrow();
    expect((await bookings.get(b.id, userId)).status).toBe('PENDING_PAYMENT');
  });
  it('keeps expired bookings cancelled when money arrives late', async () => {
    const s = await schedule();
    const b = await bookings.create(userId, input(s.id), randomUUID());
    const p = await pendingPayment(b.id);
    await forceExpired(b.id);
    await payments.settle({
      provider: 'VNPAY',
      reference: p.providerReference,
      transactionId: randomUUID(),
      amount: p.amount,
      success: true,
    });
    expect((await bookings.get(b.id, userId)).status).toBe('CANCELLED');
    expect((await db.payment.findUniqueOrThrow({ where: { id: p.id } })).status).toBe(
      'REFUND_REQUIRED',
    );
    expect((await db.schedule.findUniqueOrThrow({ where: { id: s.id } })).reservedSeats).toBe(0);
  });
  it('never loses a refund requirement when cancellation races payment', async () => {
    const s = await schedule();
    const b = await bookings.create(userId, input(s.id), randomUUID());
    const p = await pendingPayment(b.id);
    await Promise.all([
      bookings.cancel(b.id, userId, 'Khách yêu cầu hủy'),
      payments.settle({
        provider: 'VNPAY',
        reference: p.providerReference,
        transactionId: randomUUID(),
        amount: p.amount,
        success: true,
      }),
    ]);
    expect((await bookings.get(b.id, userId)).status).toBe('CANCELLED');
    expect((await db.payment.findUniqueOrThrow({ where: { id: p.id } })).status).toBe(
      'REFUND_REQUIRED',
    );
    expect((await db.schedule.findUniqueOrThrow({ where: { id: s.id } })).reservedSeats).toBe(0);
  });
  it('prevents capacity below active holds', async () => {
    const s = await schedule();
    await bookings.create(userId, input(s.id, 4), randomUUID());
    await expect(admin.updateSchedule(s.id, { totalSeats: 3 }, userId)).rejects.toThrow();
  });
  it('rejects another user reading a booking', async () => {
    const s = await schedule();
    const b = await bookings.create(userId, input(s.id), randomUUID());
    await expect(bookings.get(b.id, randomUUID())).rejects.toThrow();
  });
  it('rejects skipping straight to completed', async () => {
    const s = await schedule();
    const b = await bookings.create(userId, input(s.id), randomUUID());
    await expect(bookings.transition(b.id, 'COMPLETED', userId)).rejects.toThrow();
  });
  it('blocks customer cancellation of confirmed orders, but audited operations can cancel', async () => {
    const s = await schedule();
    const b = await bookings.create(userId, input(s.id), randomUUID());
    const p = await pendingPayment(b.id);
    await payments.settle({
      provider: 'VNPAY',
      reference: p.providerReference,
      transactionId: randomUUID(),
      amount: p.amount,
      success: true,
    });
    await bookings.transition(b.id, 'CONFIRMED', userId);
    await expect(bookings.cancel(b.id, userId, 'Khách yêu cầu hủy')).rejects.toThrow();
    expect((await bookings.cancel(b.id, userId, 'Vận hành hủy chuyến', true)).status).toBe(
      'CANCELLED',
    );
  });
  it('settles a free tour without contacting a gateway', async () => {
    const s = await schedule(10, 0);
    const b = await bookings.create(userId, input(s.id), randomUUID());
    expect((await payments.create(userId, b.id, 'VNPAY', '127.0.0.1')).status).toBe('SUCCEEDED');
    expect((await bookings.get(b.id, userId)).status).toBe('PAID');
  });
  it('requires configured credentials and does not create fake payment success', async () => {
    const s = await schedule();
    const b = await bookings.create(userId, input(s.id), randomUUID());
    await expect(payments.create(userId, b.id, 'VNPAY', '127.0.0.1')).rejects.toThrow();
    expect(await db.payment.count({ where: { bookingId: b.id } })).toBe(0);
  });
  it('rotates a refresh token once and revokes the family on reuse', async () => {
    const raw = randomUUID();
    const { tokenHash } = await import('../../src/auth/password');
    await db.refreshSession.create({
      data: {
        userId,
        tokenHash: tokenHash(raw),
        familyId: randomUUID(),
        expiresAt: new Date(Date.now() + 600000),
      },
    });
    const next = await auth.refresh(raw);
    expect(next.refreshToken).not.toBe(raw);
    await expect(auth.refresh(raw)).rejects.toThrow();
    await expect(auth.refresh(next.refreshToken)).rejects.toThrow();
  });
});
