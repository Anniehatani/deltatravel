import 'reflect-metadata';
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
// Import emitted JS so constructor metadata is the same as production tsc output.
const { BookingsController } = require('../../dist/bookings/bookings.controller');
const { BookingsService } = require('../../dist/bookings/bookings.service');
const { AuthController } = require('../../dist/auth/auth.controller');
const { AuthService } = require('../../dist/auth/auth.service');
const { JwtAuthGuard } = require('../../dist/auth/guards');
const { PrismaService } = require('../../dist/database/prisma.service');
const { ApiExceptionFilter, ResponseInterceptor, requestId } = require('../../dist/common/http');
const userId = '44444444-4444-4444-8444-444444444444';
const jwt = new JwtService({
  secret: 'test_secret_that_has_32_characters',
  signOptions: { issuer: 'tour-api', audience: 'tour-web', expiresIn: 900 },
});
let app: INestApplication;
const bookingService = {
  create: vi.fn(),
  list: vi.fn().mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 }),
  get: vi.fn(),
  cancel: vi.fn(),
  quote: vi.fn(),
};
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [BookingsController, AuthController],
    providers: [
      { provide: BookingsService, useValue: bookingService },
      { provide: AuthService, useValue: { login: vi.fn() } },
      {
        provide: ConfigService,
        useValue: new ConfigService({ WEB_ORIGIN: 'http://localhost:3000' }),
      },
      { provide: JwtService, useValue: jwt },
      {
        provide: PrismaService,
        useValue: {
          user: { findUnique: async () => ({ id: userId, role: 'CUSTOMER', isActive: true }) },
        },
      },
      { provide: APP_GUARD, useClass: JwtAuthGuard },
    ],
  }).compile();
  app = module.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.use(requestId);
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.init();
});
afterAll(async () => {
  await app?.close();
});
describe('HTTP contract and authorization boundaries', () => {
  it('rejects anonymous access before executing booking service', async () => {
    const r = await request(app.getHttpServer()).get('/api/v1/bookings');
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
    expect(r.body.meta.requestId).toBeTruthy();
  });
  it('rejects forged tokens', async () => {
    const r = await request(app.getHttpServer())
      .get('/api/v1/bookings')
      .set('Authorization', 'Bearer fake');
    expect(r.status).toBe(401);
  });
  it('derives ownership from JWT and wraps response', async () => {
    const token = await jwt.signAsync({ sub: userId, role: 'ADMIN' });
    const r = await request(app.getHttpServer())
      .get('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body.data.items).toEqual([]);
    expect(bookingService.list).toHaveBeenCalledWith({ page: 1, pageSize: 20 }, userId);
  });
  it('rejects injected status or amount fields', async () => {
    const token = await jwt.signAsync({ sub: userId });
    const r = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', '55555555-5555-4555-8555-555555555555')
      .send({
        scheduleId: '22222222-2222-4222-8222-222222222222',
        adults: 1,
        children: 0,
        contactName: 'Test User',
        contactEmail: 'test@example.com',
        contactPhone: '0901234567',
        status: 'PAID',
        totalAmount: 1,
      });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
    expect(bookingService.create).not.toHaveBeenCalled();
  });
  it('requires CSRF origin protection on login', async () => {
    const r = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' });
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe('CSRF_REJECTED');
  });
});
