'use client';

import React from 'react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Role } from '@tour/shared';
import { useAuth } from '@/providers/auth-provider';
import { Lock, ArrowRight, UserPlus, ArrowLeft, ShieldAlert } from 'lucide-react';
import { LiquidGlassBadge } from '@/components/ui/liquid-glass-badge';
import { useLanguage } from '@/providers/language-provider';

export function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 select-none">
        <div className="h-10 w-10 rounded-full border-2 border-stone-200 border-t-black animate-spin mb-4" />
        <p className="text-xs font-bold text-neutral-500 tracking-wider uppercase">
          {t('auth_checking')}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 sm:py-24 select-none">
        <div className="relative w-full max-w-md rounded-[32px] bg-white/85 backdrop-blur-2xl border border-black/[0.08] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12),inset_0_1.5px_2px_rgba(255,255,255,1)] p-8 sm:p-10 text-center animate-fade-in">
          {/* Top Specular Rim */}
          <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

          {/* Badge */}
          <div className="flex justify-center mb-5">
            <LiquidGlassBadge variant="gold" size="sm">
              {t('auth_badge')}
            </LiquidGlassBadge>
          </div>

          {/* Icon Orb */}
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-gradient-to-tr from-stone-900 to-black text-white flex items-center justify-center shadow-lg border border-white/60">
            <Lock className="h-7 w-7 text-amber-300 drop-shadow-sm" />
          </div>

          {/* Title & Description */}
          <h2 className="text-2xl sm:text-[26px] font-black text-black tracking-tight uppercase">
            {t('auth_login_required')}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-neutral-600 font-normal leading-relaxed">
            {t('auth_login_desc')}
          </p>

          {/* Actions */}
          <div className="mt-8 space-y-3">
            <Link
              href="/login"
              className="w-full py-3.5 px-6 rounded-full bg-black text-white text-xs font-black uppercase tracking-wider hover:bg-neutral-800 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
            >
              <span>{t('auth_btn_login')}</span>
              <ArrowRight className="h-4 w-4 text-amber-300" />
            </Link>

            <Link
              href="/register"
              className="w-full py-3.5 px-6 rounded-full bg-stone-100/80 hover:bg-stone-200/80 text-black border border-stone-200/80 text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4 text-stone-600" />
              <span>{t('auth_btn_register')}</span>
            </Link>
          </div>

          {/* Back link */}
          <div className="mt-6 pt-5 border-t border-neutral-100">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-black transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t('auth_back_home')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 select-none">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 border border-red-200 shadow-md text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-stone-900">{t('auth_forbidden_title')}</h3>
          <p className="mt-2 text-xs text-stone-600">
            {t('auth_forbidden_desc')}
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-block py-2.5 px-5 rounded-full bg-black text-white text-xs font-bold"
            >
              {t('auth_back_home')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
