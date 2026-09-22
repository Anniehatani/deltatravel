import { Global, Injectable, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
@Injectable()
export class CacheService implements OnModuleDestroy {
  readonly redis: Redis;
  constructor(c: ConfigService) {
    this.redis = new Redis(c.getOrThrow('REDIS_URL'), {
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
      enableOfflineQueue: false,
    });
    this.redis.on('error', () => {});
  }
  async read<T>(key: string): Promise<T | null> {
    try {
      const v = await this.redis.get(key);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  }
  async write(key: string, value: unknown, ttl = 30) {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch {
      /* Cache loss never changes inventory decisions. */
    }
  }
  async onModuleDestroy() {
    this.redis.disconnect();
  }
}
@Global()
@Module({ providers: [CacheService], exports: [CacheService] })
export class CacheModule {}
