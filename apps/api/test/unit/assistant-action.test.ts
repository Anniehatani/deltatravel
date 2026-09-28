import { describe, it, expect, vi } from 'vitest';

const { AssistantActionService } = require('../../dist/assistant/assistant-action.service');

describe('assistant booking proposal confirmation', () => {
  const input = {
    scheduleId: '22222222-2222-4222-8222-222222222222',
    adults: 2,
    children: 1,
    contactName: 'Nguyễn Minh Anh',
    contactEmail: 'minhanh@example.com',
    contactPhone: '0901234567',
    provider: 'VNPAY',
  };

  it('creates a proposal without creating a booking', async () => {
    const cache = { writeRequired: vi.fn() };
    const bookings = {
      quote: vi.fn().mockResolvedValue({ totalAmount: 10470000 }),
      create: vi.fn(),
    };
    const service = new AssistantActionService(cache, bookings);
    const result = await service.proposeBooking('user-1', input);
    expect(result.requiresConfirmation).toBe(true);
    expect(bookings.create).not.toHaveBeenCalled();
    expect(cache.writeRequired).toHaveBeenCalled();
  });

  it('uses the proposal idempotency key when confirmed', async () => {
    const record = {
      version: 1,
      id: '66666666-6666-4666-8666-666666666666',
      userId: 'user-1',
      input,
      idempotencyKey: '77777777-7777-4777-8777-777777777777',
      expiresAt: new Date(Date.now() + 60000).toISOString(),
      status: 'PENDING',
    };
    const cache = {
      readRequired: vi.fn().mockResolvedValue(record),
      writeRequired: vi.fn(),
    };
    const booking = { id: '33333333-3333-4333-8333-333333333333' };
    const bookings = { create: vi.fn().mockResolvedValue(booking) };
    const service = new AssistantActionService(cache, bookings);

    const result = await service.confirmBooking('user-1', record.id);
    expect(bookings.create).toHaveBeenCalledWith(
      'user-1',
      expect.not.objectContaining({ provider: 'VNPAY' }),
      record.idempotencyKey,
    );
    expect(result.booking).toEqual(booking);
    expect(result.selectedProvider).toBe('VNPAY');
  });

  it('rejects a proposal owned by another user', async () => {
    const cache = {
      readRequired: vi.fn().mockResolvedValue({
        version: 1,
        id: '66666666-6666-4666-8666-666666666666',
        userId: 'owner',
        input,
        idempotencyKey: '77777777-7777-4777-8777-777777777777',
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        status: 'PENDING',
      }),
    };
    const service = new AssistantActionService(cache, {});
    await expect(
      service.confirmBooking('attacker', '66666666-6666-4666-8666-666666666666'),
    ).rejects.toThrow();
  });
});
