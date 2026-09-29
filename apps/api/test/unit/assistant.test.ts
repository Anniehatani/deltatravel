import { describe, it, expect, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';

const { AssistantService } = require('../../dist/assistant/assistant.service');
const { AiProviderService } = require('../../dist/assistant/ai-provider.service');
const { OperationsAgent } = require('../../dist/assistant/agents');

describe('assistant Stage 1 grounding and authorization', () => {
  it('falls back deterministically when no AI provider is configured', async () => {
    const ai = new AiProviderService(new ConfigService({}));
    const planned = await ai.classify('lập kế hoạch 2 người lớn 1 trẻ em ngân sách 8 triệu', []);
    expect(planned.mode).toBe('RULE_BASED');
    expect(planned.intent.intent).toBe('TRAVEL_PLAN');
    expect(planned.intent.adults).toBe(2);
    expect(planned.intent.children).toBe(1);
    expect(planned.intent.budgetVnd).toBe(8000000);
  });

  it('delegates MY_BOOKINGS using the authenticated principal', async () => {
    const ai = {
      classify: vi.fn().mockResolvedValue({
        intent: { intent: 'MY_BOOKINGS', query: '' },
        mode: 'RULE_BASED',
      }),
      synthesize: vi.fn(),
    };
    const customer = {
      myBookings: vi.fn().mockResolvedValue({ reply: 'ok', actions: [], sources: [], facts: [] }),
    };
    const service = new AssistantService(ai, {}, customer, {}, {}, {});
    const user = { id: 'principal', role: 'CUSTOMER' };
    const result = await service.chat({ message: 'đơn của tôi', history: [] }, user);
    expect(result.reply).toBe('ok');
    expect(customer.myBookings).toHaveBeenCalledWith(user, undefined);
  });

  it('rejects customer access to OperationsAgent', async () => {
    const admin = { operationsOverview: vi.fn() };
    const operations = new OperationsAgent(admin);
    await expect(operations.run({ id: 'customer', role: 'CUSTOMER' })).rejects.toThrow();
    expect(admin.operationsOverview).not.toHaveBeenCalled();
  });

  it('routes admin page context to operations even when the prompt is about payments or inventory', async () => {
    const ai = new AiProviderService(new ConfigService({}));

    const refund = await ai.classify(
      'Có khoản hoàn tiền nào đang chờ không? Bối cảnh giao diện hiện tại: Admin route hiện tại: /admin/payments.',
      [],
    );
    expect(refund.mode).toBe('RULE_BASED');
    expect(refund.intent.intent).toBe('OPERATIONS');

    const inventory = await ai.classify(
      'Lịch nào cần chú ý về số chỗ? Bối cảnh giao diện hiện tại: Admin route hiện tại: /admin/schedules.',
      [],
    );
    expect(inventory.intent.intent).toBe('OPERATIONS');
  });

  it('detects a concrete booking context without treating its id as a schedule id', async () => {
    const ai = new AiProviderService(new ConfigService({}));
    const id = '33333333-3333-4333-8333-333333333333';
    const planned = await ai.classify('Tóm tắt booking ' + id + ' của tôi', []);
    expect(planned.mode).toBe('RULE_BASED');
    expect(planned.intent.intent).toBe('MY_BOOKINGS');
    expect(planned.intent.bookingId).toBe(id);
    expect(planned.intent.scheduleId).toBeUndefined();
  });

  it('synthesizes booking facts while preserving authenticated ownership lookup', async () => {
    const ai = {
      classify: vi.fn().mockResolvedValue({
        intent: {
          intent: 'MY_BOOKINGS',
          query: '',
          bookingId: '33333333-3333-4333-8333-333333333333',
        },
        mode: 'RULE_BASED',
      }),
      synthesize: vi.fn().mockResolvedValue({ reply: 'grounded booking summary', mode: 'GROQ' }),
    };
    const facts = [{ id: '33333333-3333-4333-8333-333333333333', status: 'PAID' }];
    const customer = {
      myBookings: vi.fn().mockResolvedValue({ reply: 'fallback', actions: [], sources: [], facts }),
    };
    const service = new AssistantService(ai, {}, customer, {}, {}, {});
    const user = { id: 'principal', role: 'CUSTOMER' };
    const result = await service.chat({ message: 'booking của tôi', history: [] }, user);
    expect(customer.myBookings).toHaveBeenCalledWith(user, '33333333-3333-4333-8333-333333333333');
    expect(ai.synthesize).toHaveBeenCalledWith('booking của tôi', facts, 'vi');
    expect(result.reply).toBe('grounded booking summary');
    expect(result.mode).toBe('GROQ');
  });

  it('does not invent availability without a schedule id', async () => {
    const ai = {
      classify: vi.fn().mockResolvedValue({
        intent: { intent: 'AVAILABILITY', query: '' },
        mode: 'RULE_BASED',
      }),
      synthesize: vi.fn(),
    };
    const schedules = { get: vi.fn() };
    const service = new AssistantService(ai, {}, {}, {}, {}, schedules);
    const result = await service.chat({ message: 'còn chỗ không', history: [] }, undefined);
    expect(result.reply).toContain('lịch khởi hành cụ thể');
    expect(schedules.get).not.toHaveBeenCalled();
  });
});
