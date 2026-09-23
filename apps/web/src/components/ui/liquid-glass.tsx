'use client';

import React from 'react';

interface LiquidGlassPaneProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  contentClassName?: string;
  variant?: 'light' | 'dark' | 'crystal';
}

/**
 * Reusable LiquidGlassPane component — Pure, Lightweight, Ultra-Smooth CSS Glass.
 *
 * Strict 4-Layer Architecture:
 * ├── Layer 1: Glass Surface (Translucent material + backdrop blur)
 * ├── Layer 2: Reflection Layer (Upper specular glare)
 * ├── Layer 3: Edge Highlight Layer (Razor-sharp top rim specular line)
 * └── Layer 4: Content Layer (z-10, 100% sharp text & icons, never obscured)
 */
export function LiquidGlassPane({
  children,
  className = '',
  contentClassName = '',
  variant = 'light',
  ...props
}: LiquidGlassPaneProps) {
  const variantStyles = {
    light: {
      bg: 'bg-white/70 backdrop-blur-2xl border border-white/80',
      shadow: '0 8px 32px -4px rgba(0, 0, 0, 0.08), inset 0 1.5px 2px rgba(255, 255, 255, 1), inset 0 -1px 1px rgba(0, 0, 0, 0.03)',
      glare: 'from-white/80 via-white/20 to-transparent',
      rim: 'via-white/95',
    },
    crystal: {
      bg: 'bg-white/30 backdrop-blur-xl border border-white/50',
      shadow: '0 8px 32px -4px rgba(0, 0, 0, 0.15), inset 0 1.5px 2px rgba(255, 255, 255, 0.9), inset 0 -1px 1px rgba(0, 0, 0, 0.1)',
      glare: 'from-white/60 via-white/10 to-transparent',
      rim: 'via-white/90',
    },
    dark: {
      bg: 'bg-black/35 backdrop-blur-2xl border border-white/25',
      shadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35), inset 0 1.5px 2px rgba(255, 255, 255, 0.6), inset 0 -1px 1px rgba(0, 0, 0, 0.2)',
      glare: 'from-white/50 via-white/10 to-transparent',
      rim: 'via-white/80',
    },
  }[variant];

  return (
    <div
      className={`glass-container relative rounded-3xl overflow-hidden isolate select-none transition-all duration-300 ${className}`}
      {...props}
    >
      {/* ─── Layer 1: Translucent Glass Surface & Refraction Material ─── */}
      <div
        className={`glass-surface absolute inset-0 pointer-events-none z-[1] rounded-[inherit] transition-all duration-300 ${variantStyles.bg}`}
        style={{
          boxShadow: variantStyles.shadow,
        }}
      />

      {/* ─── Layer 2: Upper Specular Glare Reflection ─── */}
      <div
        className={`glass-reflection absolute inset-x-2 top-0.5 h-1/2 rounded-t-[inherit] bg-gradient-to-b ${variantStyles.glare} pointer-events-none z-[2]`}
      />

      {/* ─── Layer 3: Razor-Sharp Edge Specular Lighting Beam ─── */}
      <div
        className={`glass-edge absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent ${variantStyles.rim} to-transparent pointer-events-none z-[3]`}
      />

      {/* ─── Layer 4: Content Layer — 100% Sharp Typography & Interactive Content ─── */}
      <div className={`glass-content relative z-[10] pointer-events-auto h-full w-full ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
}
