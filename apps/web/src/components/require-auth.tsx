'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Role } from '@tour/shared';
import { useAuth } from '@/providers/auth-provider';
export function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Đang kiểm tra phiên đăng nhập...</p>;
  if (!user)
    return (
      <p>
        Vui lòng{' '}
        <Link className="underline" href="/login">
          đăng nhập
        </Link>{' '}
        để tiếp tục.
      </p>
    );
  if (roles && !roles.includes(user.role)) return <p>Bạn không có quyền xem trang này.</p>;
  return <>{children}</>;
}
