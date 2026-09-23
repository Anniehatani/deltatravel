'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { Button } from './ui/button';
import { ShieldCheck, Lock, Mail, User, AlertCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '@/providers/language-provider';

export function AuthForm({ register = false }: { register?: boolean }) {
  const { accept } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const input = {
        email: email.trim().toLowerCase(),
        password: password,
      };

      const result = register
        ? await authApi.register({ ...input, name: name.trim() })
        : await authApi.login(input);

      accept(result);

      // If user is Admin or Operations, navigate directly to Admin Super Max Dashboard!
      if (result.user.role === 'ADMIN' || result.user.role === 'OPERATIONS') {
        router.push('/admin');
      } else {
        router.push('/tours');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  const fillAdminCredentials = () => {
    setEmail('admin@tour.local');
    setPassword('Admin@123456');
    setError('');
  };

  return (
    <div className="rounded-3xl border border-stone-200/80 bg-white p-8 md:p-10 shadow-luxury max-w-md mx-auto">
      <div className="text-center mb-8">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 block mb-1">
          {t('auth_member_system')}
        </span>
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          {register ? t('auth_create_account') : t('auth_welcome_back')}
        </h2>
        <p className="mt-1.5 text-xs text-stone-500">
          {register ? t('auth_register_sub') : t('auth_login_sub')}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {register && (
          <div>
            <label htmlFor="name" className="text-xs font-semibold text-stone-700">
              {t('auth_name_label')}
            </label>
            <div className="relative mt-1">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                placeholder={t('auth_name_placeholder')}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-10 pr-4 py-2.5 text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="email" className="text-xs font-semibold text-stone-700">
            {t('auth_email_label')}
          </label>
          <div className="relative mt-1">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder={t('auth_email_placeholder')}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-10 pr-4 py-2.5 text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="password" className="text-xs font-semibold text-stone-700">
              {t('auth_pwd_label')}
            </label>
            {register && (
              <span className="text-[10px] text-stone-400">{t('auth_pwd_min')}</span>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={register ? 'new-password' : 'current-password'}
              minLength={register ? 12 : 1}
              maxLength={128}
              required
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-10 pr-4 py-2.5 text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
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
          {busy ? t('auth_processing') : register ? t('auth_btn_submit_register') : t('auth_btn_submit_login')}
        </Button>

        {/* 1-Click Quick Admin Demo Assistant */}
        {!register && (
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-center">
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="group inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-950 transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600 transition-transform group-hover:scale-110" />
              <span>Điền nhanh tài khoản Quản Trị Viên (Admin Demo)</span>
            </button>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              admin@tour.local • Mật khẩu: Admin@123456
            </span>
          </div>
        )}

        <div className="pt-2 text-center text-xs text-stone-500 border-t border-stone-100">
          <span>{register ? t('auth_have_account') : t('auth_no_account')}</span>{' '}
          <Link
            href={register ? '/login' : '/register'}
            className="font-semibold text-amber-800 hover:underline"
          >
            {register ? t('auth_link_login') : t('auth_link_register')}
          </Link>
        </div>
      </form>
    </div>
  );
}
