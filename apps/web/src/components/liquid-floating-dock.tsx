'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Compass, Bot, Globe, Sparkles, X, Move } from 'lucide-react';
import { useLanguage } from '@/providers/language-provider';
import { LiquidGlassRoot, LiquidGlassItem } from '@/components/ui/liquid-glass-container';
import { GLASS_PRESETS } from '@/lib/liquidglass';

/**
 * LiquidFloatingDock
 * A floating, draggable glass capsule powered by @ybouane/liquidglass WebGL shader.
 * Allows users to experience real-time glass refraction and specular highlights across the page.
 */
export function LiquidFloatingDock() {
  const { lang, setLang, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const [glassMode, setGlassMode] = useState<'regular' | 'frosted' | 'dark'>('regular');

  if (!mounted || dismissed) return null;

  const currentPreset =
    glassMode === 'regular'
      ? GLASS_PRESETS.regularGlass
      : glassMode === 'frosted'
      ? GLASS_PRESETS.frostedGlass
      : GLASS_PRESETS.darkGlass;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
      <LiquidGlassRoot
        defaults={currentPreset}
        glassSelector=".liquid-dock-pill"
        className="relative"
      >
        {/* The Direct-Child Glass Pill (with floating: true for draggable WebGL interaction) */}
        <LiquidGlassItem
          config={{
            ...currentPreset,
            floating: true,
            cornerRadius: 32,
            zRadius: 36,
            refraction: 0.85,
            chromAberration: 0.14,
            edgeHighlight: 0.28,
            specular: 0.28,
            blurAmount: glassMode === 'frosted' ? 0.25 : 0,
            brightness: glassMode === 'dark' ? -0.2 : 0.02,
          }}
          className="liquid-dock-pill group cursor-grab active:cursor-grabbing select-none"
        >
          <div
            className={`flex items-center gap-1.5 p-1.5 px-3 rounded-full border transition-all duration-300 ${
              glassMode === 'dark'
                ? 'bg-black/30 border-white/30 text-white shadow-[0_20px_50px_rgba(0,0,0,0.4)]'
                : glassMode === 'frosted'
                ? 'bg-amber-100/30 border-amber-300/40 text-neutral-900 shadow-[0_20px_50px_rgba(217,119,6,0.15)]'
                : 'bg-white/10 border-white/80 text-neutral-900 shadow-[0_20px_50px_rgba(0,0,0,0.2),inset_0_1.5px_2px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.1)]'
            }`}
          >
            {/* Drag Handle Indicator */}
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/5 hover:bg-black/10 transition-colors text-current cursor-grab"
              title="Kéo thả kính lỏng để khúc xạ mọi chi tiết trên trang web"
            >
              <Move className="h-3 w-3 text-amber-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline-block">
                Liquid Glass
              </span>
            </div>

            {/* Mode Switcher Buttons matching @ybouane/liquidglass demo */}
            <div className="flex items-center gap-1 p-0.5 rounded-full bg-black/5">
              <button
                type="button"
                onClick={() => setGlassMode('regular')}
                className={`px-2 py-1 rounded-full text-[9.5px] font-black tracking-tight transition-all duration-200 ${
                  glassMode === 'regular'
                    ? 'bg-white text-black shadow-sm font-black'
                    : 'text-neutral-600 hover:text-black'
                }`}
                title="Regular Crystal Glass"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setGlassMode('frosted')}
                className={`px-2 py-1 rounded-full text-[9.5px] font-black tracking-tight transition-all duration-200 ${
                  glassMode === 'frosted'
                    ? 'bg-amber-500 text-white shadow-sm font-black'
                    : 'text-neutral-600 hover:text-black'
                }`}
                title="Frosted Glass"
              >
                Frosted
              </button>
              <button
                type="button"
                onClick={() => setGlassMode('dark')}
                className={`px-2 py-1 rounded-full text-[9.5px] font-black tracking-tight transition-all duration-200 ${
                  glassMode === 'dark'
                    ? 'bg-black text-white shadow-sm font-black'
                    : 'text-neutral-600 hover:text-black'
                }`}
                title="Dark Glass"
              >
                Dark
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-0.5 ml-0.5">
              <Link
                href="/tours"
                className="h-7 w-7 rounded-full flex items-center justify-center text-current hover:bg-black/10 transition-all"
                title={t('nav_all_tours')}
              >
                <Compass className="h-3.5 w-3.5" />
              </Link>

              <Link
                href="/assistant"
                className="h-7 w-7 rounded-full flex items-center justify-center text-amber-500 hover:bg-amber-500/20 transition-all"
                title={t('nav_assistant')}
              >
                <Bot className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="h-6 w-6 rounded-full flex items-center justify-center text-neutral-400 hover:text-current hover:bg-black/10 transition-colors"
              title="Đóng widget"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </LiquidGlassItem>
      </LiquidGlassRoot>
    </div>
  );
}
