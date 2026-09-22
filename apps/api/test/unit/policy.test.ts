import { describe, it, expect } from 'vitest';
import {
  CreateBookingSchema,
  CreateTourSchema,
  calculateTotal,
  canCustomerCancel,
  HOLD_MS,
  CANCEL_WINDOW_MS,
  BOOKING_LABELS,
} from '@tour/shared';
describe('SRS business rules', () => {
  it('uses exactly fifteen minutes', () => expect(HOLD_MS).toBe(900000));
  it('calculates integer VND without floating point prices', () =>
    expect(calculateTotal(2, 1, 1999999, 999999)).toBe(4999997));
  it('supports zero children and zero amount', () => expect(calculateTotal(1, 0, 0, 0)).toBe(0));
  it.each([
    [0, 0, 100, 0],
    [-1, 0, 100, 0],
    [1, -1, 100, 0],
    [1, 0, -100, 0],
    [1, 0, 1.5, 0],
    [100, 100, 99999999, 99999999],
  ])('rejects invalid party/money (%s,%s,%s,%s)', (a, c, p, q) =>
    expect(() => calculateTotal(a, c, p, q)).toThrow(),
  );
  it('does not accept an infant field', () => {
    expect(
      CreateBookingSchema.safeParse({
        scheduleId: '00000000-0000-4000-8000-000000000001',
        adults: 1,
        children: 0,
        infants: 1,
        contactName: 'Test User',
        contactEmail: 'test@example.com',
        contactPhone: '0901234567',
      }).success,
    ).toBe(false);
  });
  it('only accepts VN country code', () => {
    expect(
      CreateTourSchema.safeParse({
        title: 'Tour Paris',
        slug: 'paris',
        description: 'Invalid foreign tour',
        destination: 'Paris',
        countryCode: 'FR',
        durationDays: 3,
      }).success,
    ).toBe(false);
  });
  const now = new Date('2026-10-01T00:00:00.000Z');
  it.each(['PENDING_PAYMENT', 'PAID'] as const)(
    'allows %s at the exact 72-hour boundary',
    (status) =>
      expect(canCustomerCancel(status, new Date(now.getTime() + CANCEL_WINDOW_MS), now)).toBe(true),
  );
  it('rejects cancellation one millisecond too late', () =>
    expect(canCustomerCancel('PAID', new Date(now.getTime() + CANCEL_WINDOW_MS - 1), now)).toBe(
      false,
    ));
  it.each(['CONFIRMED', 'COMPLETED', 'CANCELLED'] as const)(
    'rejects customer cancellation of %s',
    (status) =>
      expect(canCustomerCancel(status, new Date(now.getTime() + 10 * CANCEL_WINDOW_MS), now)).toBe(
        false,
      ),
  );
  it('has exactly the five SRS states', () => expect(Object.keys(BOOKING_LABELS)).toHaveLength(5));
});
