import { describe, it, expect, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordSchema } from '@tour/shared';

const { AuthService } = require('../../dist/auth/auth.service');

describe('password reset safety', () => {
  it('uses a generic success response for an unknown email', async () => {
    const db = { user: { findUnique: vi.fn().mockResolvedValue(null) } };
    const mail = { sendPasswordReset: vi.fn() };
    const service = new AuthService(
      db,
      {},
      new ConfigService({ JWT_SECRET: 'x'.repeat(32) }),
      mail,
    );
    await expect(service.requestPasswordReset({ email: 'missing@example.com' })).resolves.toEqual({
      ok: true,
    });
    expect(mail.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('requires a 6 digit code and a strong new password', () => {
    expect(
      ResetPasswordSchema.safeParse({
        email: 'user@example.com',
        code: '123456',
        newPassword: 'NewDemoPassword_123!',
      }).success,
    ).toBe(true);
    expect(
      ResetPasswordSchema.safeParse({
        email: 'user@example.com',
        code: '12345',
        newPassword: 'short',
      }).success,
    ).toBe(false);
  });
});
