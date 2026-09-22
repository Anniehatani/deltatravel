'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { Button } from './ui/button';
import { ShieldCheck, Lock, Mail, User, AlertCircle } from 'lucide-react';

export function AuthForm({ register = false }: { register?: boolean }) {
  const { accept } = useAuth();
  const router = useRouter();

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    const data = new FormData(event.currentTarget);
    try {
      const input = {
        email: String(data.get('email')).trim().toLowerCase(),
        password: String(data.get('password')),
      };

      accept(
        register
          ? await authApi.register({ ...input, name: String(data.get('name')).trim() })
          : await authApi.login(input),
      );

      router.push('/tours');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể hoàn tất xác thực.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-stone-200/80 bg-white p-8 md:p-10 shadow-luxury max-w-md mx-auto">
      <div className="text-center mb-8">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 block mb-1">
          Hệ Thống Thành Viên
        </span>
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          {register ? 'Đăng Ký Tài Khoản' : 'Chào Mừng Trở Lại'}
        </h2>
        <p className="mt-1.5 text-xs text-stone-500">
          {register
            ? 'Tạo tài khoản để quản lý đơn đặt tour và hưởng ưu đãi dành riêng.'
            : 'Đăng nhập để tra cứu lịch sử hành trình và tiếp tục giữ chỗ.'}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {register && (
          <div>
            <label htmlFor="name" className="text-xs font-semibold text-stone-700">
              Họ và tên của bạn *
            </label>
            <div className="relative mt-1">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                id="name"
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                placeholder="Ví dụ: Lê Văn An"
                className="pl-10 text-sm"
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="email" className="text-xs font-semibold text-stone-700">
            Địa chỉ Email *
          </label>
          <div className="relative mt-1">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="example@domain.vn"
              className="pl-10 text-sm"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="password" className="text-xs font-semibold text-stone-700">
              Mật khẩu *
            </label>
            {register && (
              <span className="text-[10px] text-stone-400">Tối thiểu 12 ký tự</span>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              minLength={register ? 12 : 1}
              maxLength={128}
              required
              placeholder="••••••••••••"
              className="pl-10 text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={busy}
          className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-xl shadow-md text-sm font-semibold"
        >
          {busy ? 'Đang xử lý...' : register ? 'Tạo tài khoản ngay' : 'Đăng nhập'}
        </Button>

        <div className="pt-2 text-center text-xs text-stone-500 border-t border-stone-100">
          <span>{register ? 'Đã có tài khoản?' : 'Chưa có tài khoản thành viên?'}</span>{' '}
          <Link
            href={register ? '/login' : '/register'}
            className="font-semibold text-amber-800 hover:underline"
          >
            {register ? 'Đăng nhập tại đây' : 'Đăng ký miễn phí'}
          </Link>
        </div>
      </form>
    </div>
  );
}

