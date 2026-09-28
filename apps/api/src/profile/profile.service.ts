import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { publicUser } from '../auth/auth.service';
import { AvatarStorageService } from './avatar-storage.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly db: PrismaService,
    private readonly storage: AvatarStorageService,
  ) {}

  async me(userId: string) {
    return publicUser(await this.db.user.findUniqueOrThrow({ where: { id: userId } }));
  }

  async createAvatarUpload(
    userId: string,
    input: {
      contentType: 'image/jpeg' | 'image/png' | 'image/webp';
      sizeBytes: number;
    },
  ) {
    return this.storage.createUploadTicket(userId, input);
  }

  async completeAvatar(userId: string, uploadId: string) {
    const pending = await this.storage.claimUpload(userId, uploadId);
    const avatarId = uploadId;
    const updated = await this.db.serial(async (tx) => {
      const before = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          avatarId,
          avatarPath: pending.path,
          avatarUrl: pending.publicUrl,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'AVATAR_UPDATED',
          entityId: userId,
          metadata: { avatarId, path: pending.path },
        },
      });
      return { user, oldPath: before.avatarPath };
    });
    if (updated.oldPath && updated.oldPath !== pending.path) {
      await this.storage.remove(updated.oldPath);
    }
    return publicUser(updated.user);
  }

  async deleteAvatar(userId: string) {
    const updated = await this.db.serial(async (tx) => {
      const before = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const user = await tx.user.update({
        where: { id: userId },
        data: { avatarId: null, avatarPath: null, avatarUrl: null },
      });
      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'AVATAR_REMOVED',
          entityId: userId,
        },
      });
      return { user, oldPath: before.avatarPath };
    });
    await this.storage.remove(updated.oldPath);
    return publicUser(updated.user);
  }
}
