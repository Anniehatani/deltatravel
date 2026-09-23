'use client';

import { useRef } from 'react';

/**
 * Lightweight safe no-op hook for useLiquidGL.
 * LiquidGL WebGL runtime is completely disabled per user request for maximum speed,
 * zero lag, and pristine 100% sharp typography & glass rendering.
 */
export function useLiquidGL(_options: any = {}, _deps: any[] = []) {
  const instanceRef = useRef<any>(null);
  return instanceRef;
}
