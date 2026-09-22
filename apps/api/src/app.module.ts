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
import { fail } from './common/errors';
@Public()
@Controller('health')
class HealthController {
  constructor(
    private readonly db: PrismaService,
    private readonly cache: CacheService,
  ) {}
  @Get('live') live() {
    return { status: 'ok' };
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
            commandTimeout: 10000,
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
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
