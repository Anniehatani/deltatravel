'use client';

import React from 'react';
import { VietnamFlag, UKFlag } from '@/components/ui/flags';
import type { Language } from '@/providers/language-provider';

interface GlassLanguageSwitcherProps {
  lang: Language;
  setLang: (l: Language) => void;
  isTransparent?: boolean;
}

export function GlassLanguageSwitcher({
  lang,
  setLang,
  isTransparent = false,
}: GlassLanguageSwitcherProps) {
  return (
    <div
      className={`liquid-lang-control relative inline-flex items-center rounded-full p-[2.5px] text-xs font-bold transition-all duration-500 select-none ${
        isTransparent
          ? 'border border-white/25 bg-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.18),inset_0_1px_1.5px_rgba(255,255,255,0.5)] backdrop-blur-2xl'
          : 'border border-black/[0.08] bg-white/60 shadow-[0_2px_12px_rgba(0,0,0,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.95)] backdrop-blur-2xl'
      }`}
    >
      {/* Sliding Liquid Glass Capsule */}
      <div
        className={`absolute top-[2.5px] bottom-[2.5px] w-[calc(50%-2.5px)] rounded-full transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] z-[5] overflow-hidden ${
          lang === 'vi' ? 'left-[2.5px] translate-x-0' : 'left-[2.5px] translate-x-full'
        } ${
          isTransparent
            ? 'bg-white/[0.25] border border-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.25)]'
            : 'bg-white/90 border border-white/95 shadow-[0_3px_12px_rgba(0,0,0,0.08)]'
        }`}
        style={{
          boxShadow: isTransparent
            ? '0 4px 16px rgba(0,0,0,0.25), inset 0 1.5px 2px rgba(255,255,255,1), inset 0 -1px 1px rgba(0,0,0,0.1)'
            : '0 3px 10px rgba(0,0,0,0.06), inset 0 1.5px 2px rgba(255,255,255,1), inset 0 -1px 1px rgba(0,0,0,0.04)',
        }}
      >
        {/* Specular Glare Upper Highlight */}
        <div className="absolute inset-x-1 top-0.5 h-[50%] bg-gradient-to-b from-white/90 to-transparent pointer-events-none" />
        <div className="absolute inset-x-1.5 top-0.5 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />
      </div>

      {/* VI Option */}
      <button
        type="button"
        onClick={() => setLang('vi')}
        className={`relative z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide transition-all duration-300 ${
          lang === 'vi'
            ? isTransparent
              ? 'text-white scale-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]'
              : 'text-black scale-100'
            : isTransparent
            ? 'text-white/70 hover:text-white scale-95'
            : 'text-neutral-600 hover:text-black scale-95'
        }`}
        title="Tiếng Việt"
      >
        <VietnamFlag className="w-3.5 h-2.5 rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.3)] shrink-0" />
        <span>VI</span>
      </button>

      {/* EN Option */}
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`relative z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide transition-all duration-300 ${
          lang === 'en'
            ? isTransparent
              ? 'text-white scale-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]'
              : 'text-black scale-100'
            : isTransparent
            ? 'text-white/70 hover:text-white scale-95'
            : 'text-neutral-600 hover:text-black scale-95'
        }`}
        title="English"
      >
        <UKFlag className="w-3.5 h-2.5 rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.3)] shrink-0" />
        <span>EN</span>
      </button>
    </div>
  );
}
