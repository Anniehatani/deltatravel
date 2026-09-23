'use client';

export interface LiquidGLOptions {
  target?: string;
  snapshot?: string;
  resolution?: number;
  engine?: 'auto' | 'webgpu' | 'webgl2' | 'webgl';
  refraction?: number;
  aberration?: number;
  bevelDepth?: number;
  bevelWidth?: number;
  frost?: number;
  shadow?: boolean;
  specular?: boolean;
  reveal?: 'fade' | 'instant';
  tilt?: boolean;
  tiltFactor?: number;
  tiltEase?: number;
  magnify?: number;
  helper?: boolean;
  on?: {
    init?: (instance: any) => void;
  };
}

/**
 * Disabled liquidGL loader to eliminate lag and prevent DOM occlusion.
 */
export async function loadLiquidGLScript(): Promise<any> {
  return null;
}

export async function loadLiquidGLHelperScript(): Promise<void> {
  return;
}

export async function initLiquidGL(_options: LiquidGLOptions = {}): Promise<any> {
  return null;
}
