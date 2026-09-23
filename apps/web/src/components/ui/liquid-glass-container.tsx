'use client';

import React, { useRef, useId, useEffect } from 'react';
import { useLiquidGlass } from '@/hooks/use-liquidglass';
import type { GlassConfig } from '@/lib/liquidglass';

interface LiquidGlassRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  defaults?: Partial<GlassConfig>;
  glassSelector?: string;
  delay?: number;
}

/**
 * LiquidGlassRoot container.
 * Sibling children inside this root are captured by the WebGL shader,
 * and direct child elements matching `glassSelector` become realistic liquid glass lenses.
 */
export function LiquidGlassRoot({
  children,
  className = '',
  defaults,
  glassSelector = '.liquid-glass-item',
  delay = 200,
  ...props
}: LiquidGlassRootProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLiquidGlass({
    rootRef,
    glassSelector,
    defaults,
    delay,
  });

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface LiquidGlassItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  config?: Partial<GlassConfig>;
  innerClassName?: string;
}

/**
 * LiquidGlassItem — MUST BE A DIRECT CHILD OF LiquidGlassRoot.
 * Automatically serializes config to `data-config` and wraps children with `relative z-10`
 * so buttons, text, and interactions stay pristine on top of the WebGL glass canvas.
 */
export function LiquidGlassItem({
  children,
  config,
  className = '',
  innerClassName = '',
  ...props
}: LiquidGlassItemProps) {
  const configString = config ? JSON.stringify(config) : undefined;

  return (
    <div
      data-config={configString}
      className={`liquid-glass-item relative overflow-visible ${className}`}
      {...props}
    >
      {/* Content wrapper ensuring interaction stays above injected WebGL canvas */}
      <div className={`relative z-10 pointer-events-auto h-full w-full ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
}
