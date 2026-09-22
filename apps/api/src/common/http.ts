import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  PipeTransform,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { map } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

export type AppRequest = Request & {
  requestId: string;
  user?: { id: string; role: 'CUSTOMER' | 'OPERATIONS' | 'ADMIN' };
};
export function requestId(req: AppRequest, res: Response, next: () => void) {
  req.requestId = randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}
@Injectable()
export class ZodPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodTypeAny) {}
  transform(value: unknown) {
    return this.schema.parse(value);
  }
}
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest<AppRequest>();
    // Gateway acknowledgements have their own exact wire format.
    if (req.path.includes('/payments/webhooks/')) return next.handle();
    return next.handle().pipe(
      map((data) => ({
        data,
        meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
      })),
    );
  }
}
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(e: unknown, host: ArgumentsHost) {
    const req = host.switchToHttp().getRequest<AppRequest>();
    const res = host.switchToHttp().getResponse<Response>();
    let status = 500,
      code = 'INTERNAL_ERROR',
      message = 'Có lỗi hệ thống. Vui lòng thử lại.';
    let details: unknown;
    if (e instanceof z.ZodError) {
      status = 400;
      code = 'VALIDATION_ERROR';
      message = 'Dữ liệu không hợp lệ';
      details = e.issues.map((i) => ({ path: i.path, message: i.message }));
    } else if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        status = 409;
        code = 'CONFLICT';
        message = 'Dữ liệu hoặc mã yêu cầu đã tồn tại';
      }
      if (e.code === 'P2025') {
        status = 404;
        code = 'NOT_FOUND';
        message = 'Không tìm thấy dữ liệu';
      }
      if (e.code === 'P2034') {
        status = 409;
        code = 'RETRY_TRANSACTION';
        message = 'Có thao tác đồng thời. Hãy thử lại cùng mã yêu cầu';
      }
    } else if (e instanceof HttpException) {
      status = e.getStatus();
      const body = e.getResponse();
      const b = typeof body === 'object' ? (body as Record<string, unknown>) : {};
      code =
        typeof b.code === 'string'
          ? b.code
          : ({
              400: 'BAD_REQUEST',
              401: 'UNAUTHORIZED',
              403: 'FORBIDDEN',
              404: 'NOT_FOUND',
              429: 'RATE_LIMITED',
            }[status] ?? 'HTTP_ERROR');
      message = typeof b.message === 'string' ? b.message : e.message;
    }
    if (status >= 500)
      console.error(
        JSON.stringify({
          level: 'error',
          requestId: req.requestId,
          code,
          error: e instanceof Error ? e.name : 'UnknownError',
        }),
      );
    res.status(status).json({
      error: { code, message, ...(details ? { details } : {}) },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  }
}
