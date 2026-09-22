import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { fail } from '../common/errors';
import type { AppRequest } from '../common/http';
import type { Role } from '@tour/shared';
export const Public = () => SetMetadata('public', true);
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly db: PrismaService,
  ) {}
  async canActivate(ctx: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('public', [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const req = ctx.switchToHttp().getRequest<AppRequest>();
    const auth = req.headers.authorization;
    if (!auth && isPublic) return true;
    if (!auth?.startsWith('Bearer ')) fail(401, 'UNAUTHORIZED', 'Cần đăng nhập');
    let sub: string;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(auth.slice(7), {
        algorithms: ['HS256'],
        issuer: 'tour-api',
        audience: 'tour-web',
      });
      sub = payload.sub;
    } catch {
      fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ');
    }
    const user = await this.db.user.findUnique({
      where: { id: sub! },
      select: { id: true, role: true, isActive: true },
    });
    if (!user?.isActive) fail(401, 'UNAUTHORIZED', 'Tài khoản không hoạt động');
    req.user = { id: user.id, role: user.role };
    const roles = this.reflector.getAllAndOverride<Role[]>('roles', [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (roles && !roles.includes(user.role)) fail(403, 'FORBIDDEN', 'Không có quyền thực hiện');
    return true;
  }
}
