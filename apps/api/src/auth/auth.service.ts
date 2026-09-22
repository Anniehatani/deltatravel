import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { hashPassword, checkPassword, tokenHash } from './password';
import { fail } from '../common/errors';
import type { User as DbUser, Prisma } from '@prisma/client';
import type { z } from 'zod';
import { RegisterSchema, LoginSchema } from '@tour/shared';
export const publicUser = (u: DbUser) => ({ id: u.id, name: u.name, email: u.email, role: u.role });
@Injectable()
export class AuthService {
  constructor(
    private readonly db: PrismaService,
    private readonly jwt: JwtService,
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
    // Fixed dummy scrypt work avoids skipping expensive password verification for unknown emails.
    const hash = user?.passwordHash ?? `scrypt:${'00'.repeat(16)}:${'00'.repeat(64)}`;
    if (!(await checkPassword(input.password, hash)) || !user?.isActive)
      fail(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng');
    return this.db.serial((tx) => this.session(tx, user));
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
        return null; // Commit revocation before throwing outside the transaction.
      }
      const consumed = await tx.refreshSession.updateMany({
        where: { id: s.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (consumed.count !== 1) return null;
      return this.session(tx, s.user, s.familyId);
    });
    if (!result) fail(401, 'UNAUTHORIZED', 'Phiên đã hết hạn hoặc token đã được sử dụng');
    return result;
  }
  async logout(raw?: string) {
    if (raw) {
      const s = await this.db.refreshSession.findUnique({ where: { tokenHash: tokenHash(raw) } });
      if (s)
        await this.db.refreshSession.updateMany({
          where: { familyId: s.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
    }
    return { ok: true as const };
  }
  async me(id: string) {
    return publicUser(await this.db.user.findUniqueOrThrow({ where: { id } }));
  }
}
