import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ApiExceptionFilter, ResponseInterceptor, requestId } from './common/http';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const c = app.get(ConfigService);
  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.use(cookieParser());
  app.use(requestId);
  app.enableCors({
    origin: c.getOrThrow<string>('WEB_ORIGIN'),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-CSRF-Protection'],
    exposedHeaders: ['X-Request-Id'],
  });
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.enableShutdownHooks();
  await app.listen(c.getOrThrow<number>('PORT'), '0.0.0.0');
  console.info(
    JSON.stringify({
      event: 'integration_readiness',
      mailProvider: c.get<string>('MAIL_PROVIDER') || 'DISABLED',
      aiProvider: c.get<string>('AI_PROVIDER') || null,
      aiConfigured: Boolean(
        (c.get<string>('GROQ_API_KEY') && c.get<string>('GROQ_MODEL')) ||
        (c.get<string>('GEMINI_API_KEY') && c.get<string>('GEMINI_MODEL')),
      ),
      avatarStorageConfigured: Boolean(
        c.get<string>('SUPABASE_URL') &&
        (c.get<string>('SUPABASE_SECRET_KEY') || c.get<string>('SUPABASE_SERVICE_ROLE_KEY')),
      ),
      payments: {
        cashConfigured: true,
        vnpayConfigured: Boolean(
          c.get<string>('VNPAY_TMN_CODE') && c.get<string>('VNPAY_HASH_SECRET'),
        ),
        momoConfigured: Boolean(
          c.get<string>('MOMO_PARTNER_CODE') &&
          c.get<string>('MOMO_ACCESS_KEY') &&
          c.get<string>('MOMO_SECRET_KEY'),
        ),
        zalopayConfigured: Boolean(
          c.get<string>('ZALOPAY_APP_ID') &&
          c.get<string>('ZALOPAY_KEY1') &&
          c.get<string>('ZALOPAY_KEY2'),
        ),
      },
    }),
  );
}
bootstrap().catch((e) => {
  console.error(e instanceof Error ? e.message : 'Startup failed');
  process.exitCode = 1;
});
