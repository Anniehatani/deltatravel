'use client';

import { useRef, useCallback } from 'react';
import type { GlassConfig } from '@/lib/liquidglass';

export interface UseLiquidGlassOptions {
  rootRef?: React.RefObject<HTMLElement | null>;
  rootSelector?: string;
  glassSelector?: string;
  glassElements?: HTMLElement[];
  defaults?: Partial<GlassConfig>;
  delay?: number;
  enabled?: boolean;
}

/**
 * Lightweight safe no-op hook for useLiquidGlass.
 * WebGL canvas injection and heavy screenshot loops are disabled to prevent lag,
 * keeping the website 100% smooth, lightweight, and sharp.
 */
export function useLiquidGlass({
  enabled = true,
}: UseLiquidGlassOptions = {}) {
  const instanceRef = useRef<any>(null);

  const cleanup = useCallback(() => {}, []);
  const markChanged = useCallback((_element?: HTMLElement) => {}, []);

  return {
    instance: instanceRef.current,
    isReady: true,
    fps: 60,
    cleanup,
    markChanged,
  };
}
