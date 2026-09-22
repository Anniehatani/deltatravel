import { Prisma } from '@prisma/client';
import { fail } from '../common/errors';
export type Tx = Prisma.TransactionClient;
/** Every writer acquires the schedule row first, then changes bookings/payments.
 * This ordering serializes the final seat, cancellation, webhook and expiry races. */
export async function lockSchedule(tx: Tx, id: string) {
  const rows = await tx.$queryRaw<
    { id: string }[]
  >`SELECT id FROM "LICH_KHOI_HANH" WHERE id=${id}::uuid FOR UPDATE`;
  if (!rows.length) fail(404, 'NOT_FOUND', 'Không tìm thấy lịch khởi hành');
}
export async function dbNow(tx: Tx): Promise<Date> {
  const [r] = await tx.$queryRaw<{ now: Date }[]>`SELECT clock_timestamp() AS now`;
  return r.now;
}
export async function cancelLocked(
  tx: Tx,
  id: string,
  reason: string,
  now: Date,
  actorId: string | null,
) {
  const b = await tx.booking.findUniqueOrThrow({ where: { id } });
  if (b.status === 'CANCELLED') return;
  // One transaction owns both state change and stock return. A replay returns no seats.
  await tx.booking.update({
    where: { id },
    data: { status: 'CANCELLED', cancelReason: reason, cancelledAt: now, seatsReleasedAt: now },
  });
  await tx.schedule.update({
    where: { id: b.scheduleId },
    data: { reservedSeats: { decrement: b.adults + b.children } },
  });
  await tx.payment.updateMany({
    where: { bookingId: id, status: 'SUCCEEDED', amount: { gt: 0 } },
    data: { status: 'REFUND_REQUIRED' },
  });
  await tx.auditLog.create({
    data: {
      actorId,
      action: 'BOOKING_CANCELLED',
      entityId: id,
      metadata: { reason, seats: b.adults + b.children },
    },
  });
}
export async function expireLocked(tx: Tx, scheduleId: string, now: Date) {
  const expired = await tx.booking.findMany({
    where: { scheduleId, status: 'PENDING_PAYMENT', expiresAt: { lte: now } },
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  for (const b of expired) await cancelLocked(tx, b.id, 'HOLD_EXPIRED', now, null);
}
