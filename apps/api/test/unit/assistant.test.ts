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
    expect(customer.myBookings).toHaveBeenCalledWith(user);
  });

  it('rejects customer access to OperationsAgent', async () => {
    const admin = { summary: vi.fn() };
    const operations = new OperationsAgent(admin);
    await expect(operations.run({ id: 'customer', role: 'CUSTOMER' })).rejects.toThrow();
    expect(admin.summary).not.toHaveBeenCalled();
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
