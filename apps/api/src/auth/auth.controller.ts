import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { z } from 'zod';
import { RegisterSchema, LoginSchema } from '@tour/shared';
import { ZodPipe, AppRequest } from '../common/http';
import { fail } from '../common/errors';
import { Public } from './guards';
import { AuthService } from './auth.service';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}
  private csrf(req: AppRequest) {
    if (
      req.headers.origin !== this.config.get('WEB_ORIGIN') ||
      req.headers['x-csrf-protection'] !== '1'
    )
      fail(403, 'CSRF_REJECTED', 'Origin hoặc CSRF header không hợp lệ');
  }
  private cookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 30 * 86400000,
    });
  }
  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(
    @Body(new ZodPipe(RegisterSchema)) body: z.infer<typeof RegisterSchema>,
    @Req() req: AppRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.csrf(req);
    const r = await this.auth.register(body);
    this.cookie(res, r.refreshToken);
    return r.result;
  }
  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(
    @Body(new ZodPipe(LoginSchema)) body: z.infer<typeof LoginSchema>,
    @Req() req: AppRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.csrf(req);
    const r = await this.auth.login(body);
    this.cookie(res, r.refreshToken);
    return r.result;
  }
  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: AppRequest, @Res({ passthrough: true }) res: Response) {
    this.csrf(req);
    const r = await this.auth.refresh(req.cookies?.refresh_token);
    this.cookie(res, r.refreshToken);
    return r.result;
  }
  @Public()
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: AppRequest, @Res({ passthrough: true }) res: Response) {
    this.csrf(req);
    res.clearCookie('refresh_token', {
      path: '/api/v1/auth',
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'strict',
    });
    return this.auth.logout(req.cookies?.refresh_token);
  }
  @Get('me') me(@Req() req: AppRequest) {
    return this.auth.me(req.user!.id);
  }
}
