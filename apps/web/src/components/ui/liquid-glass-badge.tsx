'use client';

import React from 'react';

export type LiquidGlassBadgeVariant =
  | 'luxury'
  | 'duration'
  | 'rating'
  | 'destination'
  | 'glass'
  | 'gold';

export interface LiquidGlassBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: LiquidGlassBadgeVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md';
  interactive?: boolean;
}

/**
 * LiquidGlassBadge — Luxury Apple-Grade Optical Glass Badge.
 *
 * Strict 4-Layer Architecture:
 * ├── Layer 1: Glass Surface (Translucent material + backdrop blur)
 * ├── Layer 2: Reflection Layer (Upper specular glare)
 * ├── Layer 3: Edge Highlight Layer (Razor-sharp top rim specular line)
 * └── Layer 4: Content Layer (z-10, 100% sharp text & icons, never obscured)
 */
export function LiquidGlassBadge({
  variant = 'glass',
  icon,
  children,
  size = 'sm',
  interactive = true,
  className = '',
  style,
  ...props
}: LiquidGlassBadgeProps) {
  // Size metrics
  const sizeStyles = {
    xs: {
      padding: 'px-2.5 py-0.5',
      text: 'text-[9.5px]',
      gap: 'gap-1',
    },
    sm: {
      padding: 'px-3 py-1',
      text: 'text-[10.5px]',
      gap: 'gap-1.5',
    },
    md: {
      padding: 'px-3.5 py-1.5',
      text: 'text-[11.5px]',
      gap: 'gap-1.5',
    },
  }[size];

  // Variant aesthetic tokens — Crystal clear glass, NO solid white pills, NO loud rainbow fringes
  const variantTokens = {
    luxury: {
      surfaceBg: 'bg-black/35 backdrop-blur-md',
      surfaceBorder: 'border border-white/40',
      boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -0.5px 1px rgba(0, 0, 0, 0.2)',
      textColor: 'text-white',
      accentColor: 'text-amber-300',
      beamGradient: 'from-transparent via-amber-200/90 to-transparent',
      glareOpacity: 'opacity-70',
    },
    duration: {
      surfaceBg: 'bg-black/35 backdrop-blur-md',
      surfaceBorder: 'border border-white/35',
      boxShadow: '0 4px 14px -2px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -0.5px 1px rgba(0, 0, 0, 0.2)',
      textColor: 'text-white',
      accentColor: 'text-white',
      beamGradient: 'from-transparent via-white/85 to-transparent',
      glareOpacity: 'opacity-65',
    },
    rating: {
      surfaceBg: 'bg-black/40 backdrop-blur-md',
      surfaceBorder: 'border border-amber-300/40',
      boxShadow: '0 4px 14px -2px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -0.5px 1px rgba(0, 0, 0, 0.2)',
      textColor: 'text-amber-300 font-extrabold',
      accentColor: 'text-amber-300 fill-amber-300',
      beamGradient: 'from-transparent via-amber-200/90 to-transparent',
      glareOpacity: 'opacity-75',
    },
    destination: {
      surfaceBg: 'bg-black/35 backdrop-blur-md',
      surfaceBorder: 'border border-white/35',
      boxShadow: '0 4px 14px -2px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.5), inset 0 -0.5px 1px rgba(0, 0, 0, 0.2)',
      textColor: 'text-white',
      accentColor: 'text-amber-300',
      beamGradient: 'from-transparent via-white/80 to-transparent',
      glareOpacity: 'opacity-60',
    },
    gold: {
      surfaceBg: 'bg-amber-500/20 backdrop-blur-md',
      surfaceBorder: 'border border-amber-400/50',
      boxShadow: '0 4px 16px -2px rgba(217, 119, 6, 0.2), inset 0 1px 1.5px rgba(255, 255, 255, 0.8), inset 0 -0.5px 1px rgba(180, 83, 9, 0.2)',
      textColor: 'text-amber-900 font-black',
      accentColor: 'text-amber-600',
      beamGradient: 'from-transparent via-amber-200 to-transparent',
      glareOpacity: 'opacity-80',
    },
    glass: {
      surfaceBg: 'bg-black/30 backdrop-blur-md',
      surfaceBorder: 'border border-white/35',
      boxShadow: '0 4px 14px -2px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -0.5px 1px rgba(0, 0, 0, 0.2)',
      textColor: 'text-white',
      accentColor: 'text-white',
      beamGradient: 'from-transparent via-white/85 to-transparent',
      glareOpacity: 'opacity-65',
    },
  }[variant];

  return (
    <div
      className={`glass-container group/badge relative inline-flex items-center rounded-full select-none overflow-hidden isolate transition-all duration-300 ${sizeStyles.padding} ${
        interactive ? 'hover:scale-[1.03] cursor-default' : ''
      } ${className}`}
      style={style}
      {...props}
    >
      {/* ─── Layer 1: Translucent Glass Surface & Refraction Material ─── */}
      <div
        className={`glass-surface absolute inset-0 rounded-full pointer-events-none z-[1] transition-all duration-300 ${variantTokens.surfaceBg} ${variantTokens.surfaceBorder}`}
        style={{
          boxShadow: variantTokens.boxShadow,
        }}
      />

      {/* ─── Layer 2: Upper Specular Glare Reflection ─── */}
      <div
        className={`glass-reflection absolute inset-x-1 top-0.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/60 via-white/10 to-transparent pointer-events-none z-[2] transition-opacity duration-300 ${variantTokens.glareOpacity} group-hover/badge:opacity-90`}
      />

      {/* ─── Layer 3: Razor-Sharp Edge Specular Lighting Beam ─── */}
      <div
        className={`glass-edge absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r ${variantTokens.beamGradient} pointer-events-none z-[3]`}
      />

      {/* ─── Layer 4: Content Layer — 100% Sharp Typography & Icons, NEVER Obscured ─── */}
      <div
        className={`glass-content relative z-[10] flex items-center ${sizeStyles.gap} pointer-events-auto leading-none ${sizeStyles.text} ${variantTokens.textColor} font-black uppercase tracking-wider`}
      >
        {icon && (
          <span
            className={`shrink-0 transition-transform duration-300 group-hover/badge:scale-110 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${variantTokens.accentColor}`}
          >
            {icon}
          </span>
        )}

        <span className="truncate leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
          {children}
        </span>
      </div>
    </div>
  );
}
