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
}
bootstrap().catch((e) => {
  console.error(e instanceof Error ? e.message : 'Startup failed');
  process.exitCode = 1;
});
