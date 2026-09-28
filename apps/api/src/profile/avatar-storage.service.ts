import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { CacheService } from '../cache/cache.module';
import { fail } from '../common/errors';

type PendingAvatar = {
  userId: string;
  path: string;
  publicUrl: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
};

@Injectable()
export class AvatarStorageService {
  constructor(
    private readonly config: ConfigService,
    private readonly cache: CacheService,
  ) {}

  private settings() {
    const url = this.config.get<string>('SUPABASE_URL');
    const key =
      this.config.get<string>('SUPABASE_SECRET_KEY') ||
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const bucket = this.config.get<string>('SUPABASE_AVATAR_BUCKET') || 'avatars';
    if (!url || !key) {
      fail(503, 'AVATAR_STORAGE_NOT_CONFIGURED', 'Avatar storage chưa được cấu hình trên server');
    }
    return {
      base: url.replace(/\/$/, '') + '/storage/v1',
      key,
      bucket,
    };
  }

  private authHeaders(key: string) {
    return {
      apikey: key,
      ...(key.startsWith('sb_secret_') ? {} : { authorization: 'Bearer ' + key }),
      'content-type': 'application/json',
    };
  }

  private encodePath(path: string) {
    return path
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');
  }

  private publicUrl(base: string, bucket: string, path: string) {
    return base + '/object/public/' + encodeURIComponent(bucket) + '/' + this.encodePath(path);
  }

  async createUploadTicket(
    userId: string,
    input: {
      contentType: 'image/jpeg' | 'image/png' | 'image/webp';
      sizeBytes: number;
    },
  ) {
    const { base, key, bucket } = this.settings();
    const extension = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    }[input.contentType];

    const uploadId = randomUUID();
    const path = userId + '/avatar-' + uploadId + '.' + extension;
    const endpoint =
      base + '/object/upload/sign/' + encodeURIComponent(bucket) + '/' + this.encodePath(path);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...this.authHeaders(key),
          'x-upsert': 'false',
        },
        body: '{}',
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      fail(503, 'AVATAR_STORAGE_UNAVAILABLE', 'Không kết nối được Supabase Storage');
    }

    const payload = (await response!.json().catch(() => ({}))) as {
      url?: string;
      message?: string;
      error?: string;
    };
    if (!response!.ok || !payload.url) {
      fail(
        503,
        'AVATAR_STORAGE_UNAVAILABLE',
        payload.message || payload.error || 'Không tạo được signed upload URL',
      );
    }

    const signedUrl = payload.url.startsWith('http')
      ? payload.url
      : base + (payload.url.startsWith('/') ? payload.url : '/' + payload.url);
    const token = new URL(signedUrl).searchParams.get('token');
    if (!token) {
      fail(503, 'AVATAR_STORAGE_INVALID_RESPONSE', 'Storage không trả upload token');
    }

    const publicUrl = this.publicUrl(base, bucket, path);
    const record: PendingAvatar = {
      userId,
      path,
      publicUrl,
      contentType: input.contentType,
    };
    await this.cache.writeRequired('avatar:upload:' + uploadId, record, 7200);

    return {
      uploadId,
      path,
      signedUrl,
      token,
      publicUrl,
      expiresIn: 7200 as const,
    };
  }

  async claimUpload(userId: string, uploadId: string) {
    const { base, key, bucket } = this.settings();
    const record = await this.cache.readRequired<PendingAvatar>('avatar:upload:' + uploadId);
    if (!record || record.userId !== userId) {
      fail(404, 'AVATAR_UPLOAD_NOT_FOUND', 'Phiên tải avatar không tồn tại hoặc đã hết hạn');
    }

    const infoUrl =
      base + '/object/info/' + encodeURIComponent(bucket) + '/' + this.encodePath(record.path);
    let response: Response;
    try {
      response = await fetch(infoUrl, {
        headers: this.authHeaders(key),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      fail(503, 'AVATAR_STORAGE_UNAVAILABLE', 'Không xác minh được avatar đã tải lên');
    }
    if (!response!.ok) {
      fail(409, 'AVATAR_NOT_UPLOADED', 'Chưa tìm thấy ảnh đã tải lên Storage');
    }

    return record;
  }

  async remove(path: string | null | undefined) {
    if (!path) return;
    const { base, key, bucket } = this.settings();
    try {
      await fetch(base + '/object/' + encodeURIComponent(bucket), {
        method: 'DELETE',
        headers: this.authHeaders(key),
        body: JSON.stringify({ prefixes: [path] }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      // Storage cleanup is best-effort after the database has already moved on.
    }
  }
}
