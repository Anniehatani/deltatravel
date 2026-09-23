'use client';

import React from 'react';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import type { User as AuthUser } from '@tour/shared';
import { getInitials } from '@/lib/format';

interface GlassUserMenuProps {
  user: AuthUser | null;
  userAvatar: string;
  onOpenAccount: () => void;
  onLogout: () => void;
  loginLabel: string;
  registerLabel: string;
  logoutLabel: string;
  manageAccountTitle: string;
  isTransparent?: boolean;
}

export function GlassUserMenu({
  user,
  userAvatar,
  onOpenAccount,
  onLogout,
  loginLabel,
  registerLabel,
  logoutLabel,
  manageAccountTitle,
  isTransparent = false,
}: GlassUserMenuProps) {
  if (!user) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Login Button with Liquid Glass Border & Inner Light */}
        <Link
          href="/login"
          className={`relative z-10 rounded-full px-3.5 py-1.5 text-[12px] font-bold tracking-tight transition-all duration-300 hover:scale-105 active:scale-95 ${
            isTransparent
              ? 'border border-white/30 bg-white/[0.08] text-white hover:bg-white/[0.18] hover:border-white/60 shadow-[0_2px_12px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-xl'
              : 'border border-black/[0.08] bg-white/70 text-neutral-800 hover:bg-white hover:text-black shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.9)] backdrop-blur-xl'
          }`}
        >
          {loginLabel}
        </Link>

        {/* Register Button with Solid Radiance */}
        <Link
          href="/register"
          className={`relative z-10 rounded-full px-4 py-1.5 text-[12px] font-black tracking-tight transition-all duration-300 hover:scale-105 active:scale-95 ${
            isTransparent
              ? 'bg-white text-black hover:bg-neutral-100 shadow-[0_4px_20px_rgba(255,255,255,0.35)]'
              : 'bg-black text-white hover:bg-neutral-800 shadow-[0_4px_14px_rgba(0,0,0,0.15)]'
          }`}
        >
          {registerLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0 select-none">
      {/* ─── Luxury User Profile Glass Pill ─── */}
      <button
        type="button"
        onClick={onOpenAccount}
        className={`liquid-user-glass group relative flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
          isTransparent
            ? 'bg-white/[0.08] hover:bg-white/[0.18] border border-white/25 hover:border-white/60 text-white shadow-[0_4px_20px_rgba(0,0,0,0.18),inset_0_1px_1.5px_rgba(255,255,255,0.5)] backdrop-blur-2xl'
            : 'bg-white/70 hover:bg-white border border-black/[0.08] hover:border-black/20 text-black shadow-[0_2px_12px_rgba(0,0,0,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.95)] backdrop-blur-2xl'
        }`}
        title={manageAccountTitle}
      >
        {/* Specular Top Rim */}
        <div className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

        {/* User Avatar with Golden Rim */}
        <div className="relative h-6 w-6 rounded-full overflow-hidden border border-amber-300 bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-white font-black text-[10px] tracking-wider uppercase shadow-sm group-hover:scale-105 transition-transform shrink-0 select-none">
          {userAvatar ? (
            <img src={userAvatar} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <span>{getInitials(user.name)}</span>
          )}
        </div>

        {/* Username Display */}
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-[12px] font-bold leading-tight tracking-tight">
            {user.name}
          </span>
        </div>
      </button>

      {/* ─── Logout Button in Matching Glass Pill ─── */}
      <button
        type="button"
        onClick={onLogout}
        title={logoutLabel}
        className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${
          isTransparent
            ? 'border border-white/25 bg-white/[0.08] text-white hover:bg-red-500/25 hover:border-red-400/60 hover:text-red-200 shadow-[0_2px_10px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-xl'
            : 'border border-black/[0.08] bg-white/70 text-neutral-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.9)] backdrop-blur-xl'
        }`}
        aria-label={logoutLabel}
      >
        <LogOut className="h-3.5 w-3.5 text-current transition-transform duration-300 group-hover:rotate-6" />
      </button>
    </div>
  );
}
