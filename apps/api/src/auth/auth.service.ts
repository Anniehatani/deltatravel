import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { PrismaService } from '../database/prisma.service';
import { hashPassword, checkPassword, tokenHash } from './password';
import { fail } from '../common/errors';
import { MailService } from './mail.service';
import type { User as DbUser, Prisma } from '@prisma/client';
import type { z } from 'zod';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
} from '@tour/shared';

export const publicUser = (u: DbUser) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  avatarUrl: u.avatarUrl,
  avatarId: u.avatarId,
});

@Injectable()
export class AuthService {
  constructor(
    private readonly db: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  private async session(tx: Prisma.TransactionClient, u: DbUser, familyId: string = randomUUID()) {
    const raw = randomBytes(48).toString('base64url');
    await tx.refreshSession.create({
      data: {
        userId: u.id,
        tokenHash: tokenHash(raw),
        familyId,
        expiresAt: new Date(Date.now() + 30 * 86400000),
      },
    });
    return {
      refreshToken: raw,
      result: {
        user: publicUser(u),
        accessToken: await this.jwt.signAsync({ sub: u.id }),
        expiresIn: 900 as const,
      },
    };
  }

  private resetPepper() {
    return (
      this.config.get<string>('PASSWORD_RESET_PEPPER') ||
      this.config.getOrThrow<string>('JWT_SECRET')
    );
  }

  private resetHash(email: string, code: string) {
    return createHmac('sha256', this.resetPepper())
      .update(email + String.fromCharCode(0) + code, 'utf8')
      .digest('hex');
  }

  private sameHex(a: string, b: string) {
    const x = Buffer.from(a, 'hex');
    const y = Buffer.from(b, 'hex');
    return x.length === y.length && timingSafeEqual(x, y);
  }

  async register(input: z.infer<typeof RegisterSchema>) {
    const passwordHash = await hashPassword(input.password);
    return this.db.serial(async (tx) => {
      const u = await tx.user.create({
        data: { email: input.email, name: input.name, passwordHash },
      });
      return this.session(tx, u);
    });
  }

  async login(input: z.infer<typeof LoginSchema>) {
    const user = await this.db.user.findUnique({ where: { email: input.email } });
    const hash = user?.passwordHash || 'scrypt:' + '00'.repeat(16) + ':' + '00'.repeat(64);
    if (!(await checkPassword(input.password, hash)) || !user?.isActive) {
      fail(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng');
    }
    return this.db.serial((tx) => this.session(tx, user));
  }

  async requestPasswordReset(input: z.infer<typeof ForgotPasswordSchema>) {
    const user = await this.db.user.findUnique({
      where: { email: input.email },
      select: { id: true, email: true, isActive: true },
    });

    if (!user?.isActive) {
      await sleep(120);
      return { ok: true as const };
    }

    const code = randomInt(0, 1000000).toString().padStart(6, '0');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
    const challenge = await this.db.serial(async (tx) => {
      await tx.passwordResetChallenge.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: now },
      });
      return tx.passwordResetChallenge.create({
        data: {
          userId: user.id,
          codeHash: this.resetHash(user.email, code),
          expiresAt,
        },
      });
    });

    try {
      await this.mail.sendPasswordReset(user.email, code, 10);
    } catch {
      await this.db.passwordResetChallenge.deleteMany({ where: { id: challenge.id } });
      fail(503, 'MAIL_UNAVAILABLE', 'Chưa thể gửi email xác thực. Vui lòng thử lại sau');
    }

    return { ok: true as const };
  }

  async resetPassword(input: z.infer<typeof ResetPasswordSchema>) {
    const user = await this.db.user.findUnique({ where: { email: input.email } });
    const candidateHash = this.resetHash(input.email, input.code);

    if (!user?.isActive) {
      this.sameHex(candidateHash, this.resetHash(input.email, '000000'));
      fail(400, 'INVALID_RESET_CODE', 'Mã xác thực không hợp lệ hoặc đã hết hạn');
    }

    const newHash = await hashPassword(input.newPassword);
    const result = await this.db.serial(async (tx) => {
      const now = new Date();
      const challenge = await tx.passwordResetChallenge.findFirst({
        where: {
          userId: user.id,
          consumedAt: null,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!challenge || challenge.attempts >= 5) return false;

      if (!this.sameHex(challenge.codeHash, candidateHash)) {
        await tx.passwordResetChallenge.update({
          where: { id: challenge.id },
          data: { attempts: { increment: 1 } },
        });
        return false;
      }

      const claimed = await tx.passwordResetChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null },
        data: { consumedAt: now },
      });
      if (claimed.count !== 1) return false;

      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
      await tx.refreshSession.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: now },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'PASSWORD_RESET',
          entityId: user.id,
        },
      });
      return true;
    });

    if (!result) {
      fail(400, 'INVALID_RESET_CODE', 'Mã xác thực không hợp lệ hoặc đã hết hạn');
    }

    return { ok: true as const };
  }

  async changePassword(userId: string, input: z.infer<typeof ChangePasswordSchema>) {
    const user = await this.db.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await checkPassword(input.oldPassword, user.passwordHash))) {
      fail(400, 'INVALID_CURRENT_PASSWORD', 'Mật khẩu hiện tại không đúng');
    }

    const next = await hashPassword(input.newPassword);
    const now = new Date();
    await this.db.serial(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: next },
      });
      await tx.refreshSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      });
      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'PASSWORD_CHANGED',
          entityId: userId,
        },
      });
    });
    return { ok: true as const };
  }

  async refresh(raw?: string) {
    if (!raw) fail(401, 'UNAUTHORIZED', 'Thiếu refresh token');
    const result = await this.db.serial(async (tx) => {
      const s = await tx.refreshSession.findUnique({
        where: { tokenHash: tokenHash(raw) },
        include: { user: true },
      });
      if (!s) return null;
      if (s.revokedAt || s.expiresAt <= new Date() || !s.user.isActive) {
        await tx.refreshSession.updateMany({
          where: { familyId: s.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        return null;
      }
      const consumed = await tx.refreshSession.updateMany({
        where: { id: s.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (consumed.count !== 1) return null;
      return this.session(tx, s.user, s.familyId);
    });
    if (!result) {
      fail(401, 'UNAUTHORIZED', 'Phiên đã hết hạn hoặc token đã được sử dụng');
    }
    return result;
  }

  async logout(raw?: string) {
    if (raw) {
      const s = await this.db.refreshSession.findUnique({
        where: { tokenHash: tokenHash(raw) },
      });
      if (s) {
        await this.db.refreshSession.updateMany({
          where: { familyId: s.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    }
    return { ok: true as const };
  }

  async me(id: string) {
    return publicUser(await this.db.user.findUniqueOrThrow({ where: { id } }));
  }
}
