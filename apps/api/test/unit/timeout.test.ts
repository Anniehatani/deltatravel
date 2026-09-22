import { describe, it, expect, vi } from 'vitest';
const {
  TimeoutDispatcher,
  BookingTimeoutWorker,
} = require('../../dist/bookings/booking-timeout.worker');
describe('timeout delivery and recovery', () => {
  it('sweeps expired holds before publishing outbox and retries after queue failure', async () => {
    const expiresAt = new Date(Date.now() + 10000),
      createdAt = new Date(expiresAt.getTime() - 900000);
    const db = {
      booking: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ id: 'expired' }])
          .mockResolvedValueOnce([{ id: 'new', expiresAt, createdAt }]),
        update: vi.fn(),
      },
    };
    const service = { expire: vi.fn().mockResolvedValue(undefined) };
    const queue = { add: vi.fn().mockRejectedValue(new Error('Redis unavailable')) };
    const dispatcher = new TimeoutDispatcher(db, service, queue);
    await dispatcher.dispatch();
    expect(service.expire).toHaveBeenCalledWith('expired');
    expect(db.booking.update).not.toHaveBeenCalled();
    db.booking.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'new', expiresAt, createdAt }]);
    queue.add.mockResolvedValue({});
    await dispatcher.dispatch();
    expect(queue.add).toHaveBeenCalledTimes(2);
    expect(db.booking.update).toHaveBeenCalledOnce();
    expect(queue.add.mock.calls[1][2].jobId).toBe('expire_new');
  });
  it('worker delegates idempotent expiry without assuming job timing is exact', async () => {
    const service = { expire: vi.fn().mockResolvedValue(undefined) };
    const worker = new BookingTimeoutWorker(service);
    await worker.process({ data: { bookingId: 'id' } });
    expect(service.expire).toHaveBeenCalledWith('id');
  });
});
