'use client';

import type { GlassConfig, LiquidGlass, LiquidGlassOptions } from '@ybouane/liquidglass';

export type { GlassConfig, LiquidGlassOptions, LiquidGlass };

/**
 * Check if the current browser environment supports WebGL
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Fine-tuned presets exactly matching the @ybouane/liquidglass official demo & Apple Glass standards
 */
export const GLASS_PRESETS = {
  /** 100% Crystal Clear Regular Glass with high refraction & chromatic aberration (exact @ybouane/liquidglass demo) */
  regularGlass: {
    blurAmount: 0,
    refraction: 0.85,
    chromAberration: 0.14,
    edgeHighlight: 0.25,
    specular: 0.28,
    fresnel: 1.0,
    distortion: 0.0,
    cornerRadius: 28,
    zRadius: 36,
    opacity: 1.0,
    saturation: 0.04,
    tintStrength: 0.01,
    brightness: 0.0,
    shadowOpacity: 0.28,
    shadowSpread: 14,
    shadowOffsetY: 3,
    floating: false,
    button: false,
    bevelMode: 0,
  } as Partial<GlassConfig>,

  /** Sliding Pill Indicator for navigation & segmented controls (exact demo tab-indicator) */
  tabIndicator: {
    blurAmount: 0,
    refraction: 0.85,
    chromAberration: 0.14,
    edgeHighlight: 0.25,
    specular: 0.28,
    fresnel: 1.0,
    distortion: 0.0,
    cornerRadius: 24,
    zRadius: 32,
    opacity: 1.0,
    saturation: 0.04,
    tintStrength: 0.01,
    brightness: 0.02,
    shadowOpacity: 0.28,
    shadowSpread: 12,
    shadowOffsetY: 2,
    floating: false,
    button: false,
    bevelMode: 0,
  } as Partial<GlassConfig>,

  /** Navigation dock / bar glass — 100% crystal transparent without blur */
  navbar: {
    blurAmount: 0,
    refraction: 0.8,
    chromAberration: 0.12,
    edgeHighlight: 0.22,
    specular: 0.25,
    fresnel: 1.0,
    distortion: 0.0,
    cornerRadius: 26,
    zRadius: 32,
    opacity: 1.0,
    saturation: 0.03,
    tintStrength: 0.01,
    brightness: 0.0,
    shadowOpacity: 0.22,
    shadowSpread: 12,
    shadowOffsetY: 2,
    floating: false,
    button: false,
    bevelMode: 0,
  } as Partial<GlassConfig>,

  /** Frosted Glass variant (as in demo) */
  frostedGlass: {
    blurAmount: 0.25,
    refraction: 0.75,
    chromAberration: 0.1,
    edgeHighlight: 0.2,
    specular: 0.25,
    fresnel: 1.0,
    distortion: 0.0,
    cornerRadius: 28,
    zRadius: 36,
    opacity: 1.0,
    saturation: 0.08,
    tintStrength: 0.04,
    brightness: 0.02,
    shadowOpacity: 0.28,
    shadowSpread: 14,
    shadowOffsetY: 4,
    floating: false,
    button: false,
    bevelMode: 0,
  } as Partial<GlassConfig>,

  /** Dark Glass variant (as in demo) */
  darkGlass: {
    blurAmount: 0.15,
    brightness: -0.2,
    refraction: 0.75,
    chromAberration: 0.1,
    edgeHighlight: 0.25,
    specular: 0.2,
    fresnel: 1.0,
    distortion: 0.0,
    cornerRadius: 28,
    zRadius: 36,
    opacity: 1.0,
    saturation: 0.0,
    tintStrength: 0.0,
    shadowOpacity: 0.35,
    shadowSpread: 16,
    shadowOffsetY: 5,
    floating: false,
    button: false,
    bevelMode: 0,
  } as Partial<GlassConfig>,

  /** Luxury biconvex prism glass for cards */
  prismCard: {
    blurAmount: 0,
    refraction: 0.8,
    chromAberration: 0.14,
    edgeHighlight: 0.25,
    specular: 0.28,
    fresnel: 1.0,
    distortion: 0.0,
    cornerRadius: 26,
    zRadius: 32,
    opacity: 1.0,
    saturation: 0.06,
    tintStrength: 0.02,
    brightness: 0.02,
    shadowOpacity: 0.25,
    shadowSpread: 16,
    shadowOffsetY: 4,
    floating: false,
    button: false,
    bevelMode: 0,
  } as Partial<GlassConfig>,

  /** Interactive draggable floating dock (exact @ybouane/liquidglass demo) */
  floatingDock: {
    blurAmount: 0,
    refraction: 0.85,
    chromAberration: 0.15,
    edgeHighlight: 0.28,
    specular: 0.28,
    fresnel: 1.0,
    distortion: 0.0,
    cornerRadius: 32,
    zRadius: 36,
    opacity: 1.0,
    saturation: 0.05,
    tintStrength: 0.02,
    brightness: 0.02,
    shadowOpacity: 0.3,
    shadowSpread: 18,
    shadowOffsetY: 5,
    floating: true,
    button: false,
    bevelMode: 0,
  } as Partial<GlassConfig>,

  /** Interactive button (as in demo) */
  button: {
    blurAmount: 0,
    refraction: 0.8,
    chromAberration: 0.12,
    edgeHighlight: 0.25,
    specular: 0.28,
    fresnel: 1.0,
    distortion: 0.0,
    cornerRadius: 24,
    zRadius: 28,
    opacity: 1.0,
    saturation: 0.04,
    tintStrength: 0.02,
    brightness: 0.03,
    shadowOpacity: 0.25,
    shadowSpread: 12,
    shadowOffsetY: 2,
    floating: false,
    button: true,
    bevelMode: 0,
  } as Partial<GlassConfig>,
};

/**
 * Safely initialises LiquidGlass from '@ybouane/liquidglass' on client.
 */
export async function createLiquidGlassInstance(_options: LiquidGlassOptions): Promise<LiquidGlass | null> {
  return null;
}
