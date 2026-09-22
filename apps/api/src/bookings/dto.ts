import { Prisma, Payment, Schedule } from '@prisma/client';
export const bookingInclude = { details: true, schedule: true } satisfies Prisma.BookingInclude;
export type BookingRow = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;
export function bookingDto(b: BookingRow, now = new Date()) {
  return {
    id: b.id,
    scheduleId: b.scheduleId,
    status: b.status,
    adults: b.adults,
    children: b.children,
    totalAmount: Number(b.totalAmount),
    currency: 'VND' as const,
    contactName: b.contactName,
    contactEmail: b.contactEmail,
    contactPhone: b.contactPhone,
    expiresAt: b.expiresAt,
    createdAt: b.createdAt,
    paidAt: b.paidAt,
    cancelledAt: b.cancelledAt,
    cancelReason: b.cancelReason,
    tourTitle: b.tourTitle,
    departureAt: b.schedule.departureAt,
    serverTime: now,
    details: b.details.map((d) => ({
      kind: d.kind,
      quantity: d.quantity,
      unitPrice: Number(d.unitPrice),
      lineTotal: Number(d.lineTotal),
    })),
  };
}
export function scheduleDto(s: Schedule, now = new Date()) {
  return {
    ...s,
    adultPrice: Number(s.adultPrice),
    childPrice: Number(s.childPrice),
    availableSeats: s.totalSeats - s.reservedSeats,
    serverTime: now,
  };
}
export function paymentDto(p: Payment) {
  return {
    id: p.id,
    bookingId: p.bookingId,
    provider: p.provider,
    status: p.status,
    amount: Number(p.amount),
    currency: 'VND' as const,
    checkoutUrl: p.checkoutUrl,
    createdAt: p.createdAt,
  };
}
