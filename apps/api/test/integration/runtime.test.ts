import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { NestFactory } from '@nestjs/core';
// Full runtime smoke test runs when PostgreSQL and Redis are available (CI).
// The local WASM-only verification intentionally leaves REDIS_URL unset.
describe.runIf(!!process.env.REDIS_URL)('Nest runtime with PostgreSQL and Redis', () => {
  it('boots all modules and checks readiness', async () => {
    if (!process.env.DATABASE_URL?.includes('tour_booking_test'))
      throw new Error('Dedicated test DB required');
    const { AppModule } = require('../../dist/app.module');
    const app = await NestFactory.create(AppModule, { logger: false });
    try {
      app.setGlobalPrefix('api/v1');
      await app.listen(0, '127.0.0.1');
      const base = await app.getUrl();
      const response = await fetch(`${base}/api/v1/health/ready`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ status: 'ok' });
    } finally {
      await app.close();
    }
  });
});
