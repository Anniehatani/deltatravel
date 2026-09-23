'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { Button } from './ui/button';
import { ShieldCheck, Lock, Mail, User, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/providers/language-provider';

export function AuthForm({ register = false }: { register?: boolean }) {
  const { accept } = useAuth();
  const { t } = useLanguage();
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
      setError(e instanceof Error ? e.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }

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
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                placeholder={t('auth_name_placeholder')}
                className="pl-10 text-sm"
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
              autoComplete="email"
              required
              placeholder={t('auth_email_placeholder')}
              className="pl-10 text-sm"
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
          {busy ? t('auth_processing') : register ? t('auth_btn_submit_register') : t('auth_btn_submit_login')}
        </Button>

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

