import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { validateEnv } from './common/env';
import { DatabaseModule, PrismaService } from './database/prisma.service';
import { CacheModule, CacheService } from './cache/cache.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard, Public } from './auth/guards';
import { ToursModule } from './tours/tours.module';
import { SchedulesModule } from './schedules/schedules.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { AssistantModule } from './assistant/assistant.module';
import { ProfileModule } from './profile/profile.module';
import { fail } from './common/errors';
@Public()
@Controller('health')
class HealthController {
  constructor(
    private readonly db: PrismaService,
    private readonly cache: CacheService,
    private readonly config: ConfigService,
  ) {}
  @Get('live') live() {
    return { status: 'ok' };
  }
  @Get('integrations') integrations() {
    return {
      mailProvider: this.config.get<string>('MAIL_PROVIDER') || 'DISABLED',
      aiProvider: this.config.get<string>('AI_PROVIDER') || null,
      aiConfigured: Boolean(
        (this.config.get<string>('GROQ_API_KEY') && this.config.get<string>('GROQ_MODEL')) ||
        (this.config.get<string>('GEMINI_API_KEY') && this.config.get<string>('GEMINI_MODEL')),
      ),
      avatarStorageConfigured: Boolean(
        this.config.get<string>('SUPABASE_URL') &&
        (this.config.get<string>('SUPABASE_SECRET_KEY') ||
          this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')),
      ),
      payments: {
        cashConfigured: true,
        vnpayConfigured: Boolean(
          this.config.get<string>('VNPAY_TMN_CODE') && this.config.get<string>('VNPAY_HASH_SECRET'),
        ),
        momoConfigured: Boolean(
          this.config.get<string>('MOMO_PARTNER_CODE') &&
          this.config.get<string>('MOMO_ACCESS_KEY') &&
          this.config.get<string>('MOMO_SECRET_KEY'),
        ),
        zalopayConfigured: Boolean(
          this.config.get<string>('ZALOPAY_APP_ID') &&
          this.config.get<string>('ZALOPAY_KEY1') &&
          this.config.get<string>('ZALOPAY_KEY2'),
        ),
      },
    };
  }

  @Get('ready') async ready() {
    try {
      await this.db.$queryRaw`SELECT 1`;
      await this.cache.redis.ping();
      return { status: 'ok' };
    } catch {
      fail(503, 'NOT_READY', 'Phụ thuộc hệ thống chưa sẵn sàng');
    }
  }
}
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    DatabaseModule,
    CacheModule,
    AuthModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => {
        const u = new URL(c.getOrThrow('REDIS_URL'));
        return {
          connection: {
            host: u.hostname,
            port: Number(u.port || 6379),
            username: u.username || undefined,
            password: u.password ? decodeURIComponent(u.password) : undefined,
            db: Number(u.pathname.slice(1) || 0),
            ...(u.protocol === 'rediss:' ? { tls: {} } : {}),
            maxRetriesPerRequest: null,
            enableOfflineQueue: false,
            connectTimeout: 3000,
          },
        };
      },
    }),
    ToursModule,
    SchedulesModule,
    BookingsModule,
    PaymentsModule,
    AdminModule,
    AssistantModule,
    ProfileModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
