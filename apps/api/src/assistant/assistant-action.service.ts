import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { AssistantBookingProposalSchema } from '@tour/shared';
import { CacheService } from '../cache/cache.module';
import { BookingsService } from '../bookings/bookings.service';
import { fail } from '../common/errors';

type ProposalInput = z.infer<typeof AssistantBookingProposalSchema>;

type ProposalRecord = {
  version: 1;
  id: string;
  userId: string;
  input: ProposalInput;
  idempotencyKey: string;
  expiresAt: string;
  status: 'PENDING' | 'EXECUTED';
  result?: unknown;
};

@Injectable()
export class AssistantActionService {
  constructor(
    private readonly cache: CacheService,
    private readonly bookings: BookingsService,
  ) {}

  private key(id: string) {
    return 'assistant:booking-proposal:' + id;
  }

  async proposeBooking(userId: string, input: ProposalInput) {
    const { provider, ...bookingInput } = input;
    const quote = await this.bookings.quote(bookingInput);
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const record: ProposalRecord = {
      version: 1,
      id,
      userId,
      input,
      idempotencyKey: randomUUID(),
      expiresAt: expiresAt.toISOString(),
      status: 'PENDING',
    };
    await this.cache.writeRequired(this.key(id), record, 600);

    return {
      proposalId: id,
      kind: 'CREATE_BOOKING' as const,
      expiresAt,
      requiresConfirmation: true as const,
      quote,
      provider: provider || null,
      summary:
        'Tạo đơn giữ chỗ 15 phút cho ' +
        (input.adults + input.children) +
        ' khách, tổng ' +
        quote.totalAmount.toLocaleString('vi-VN') +
        ' VND.',
    };
  }

  async confirmBooking(userId: string, id: string) {
    const record = await this.cache.readRequired<ProposalRecord>(this.key(id));
    if (!record) fail(404, 'PROPOSAL_NOT_FOUND', 'Đề xuất không tồn tại hoặc đã hết hạn');
    if (record.userId !== userId) fail(403, 'FORBIDDEN', 'Đề xuất không thuộc tài khoản này');
    if (record.status === 'EXECUTED') return record.result;
    if (new Date(record.expiresAt).getTime() <= Date.now()) {
      fail(410, 'PROPOSAL_EXPIRED', 'Đề xuất đã hết hạn, cần tạo lại để kiểm tra giá và chỗ');
    }

    const { provider, ...bookingInput } = record.input;
    const booking = await this.bookings.create(userId, bookingInput, record.idempotencyKey);
    const result = {
      booking,
      selectedProvider: provider || null,
      nextAction: 'OPEN_BOOKING' as const,
    };

    await this.cache.writeRequired(this.key(id), { ...record, status: 'EXECUTED', result }, 300);
    return result;
  }
}
