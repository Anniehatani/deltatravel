'use client';

import React from 'react';

interface HeaderAmbientGlowProps {
  isTransparent?: boolean;
  isScrolled?: boolean;
}

/**
 * Atmospheric light layer placed behind the fixed header.
 * Provides subtle luminous photons, champagne warmth, and azure mist
 * for the Liquid Glass WebGPU/WebGL shader to refract, bend, and disperse.
 * Keeps the overall website clean, white, and ultra-luxurious.
 */
export function HeaderAmbientGlow({ isTransparent = false, isScrolled = false }: HeaderAmbientGlowProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden z-0 transition-opacity duration-700 select-none"
      style={{
        opacity: isTransparent ? 0.9 : isScrolled ? 0.75 : 0.6,
      }}
    >
      {/* Central Radiance Beam */}
      <div
        className="absolute left-1/2 -top-12 -translate-x-1/2 w-[680px] h-28 rounded-full blur-[48px] transition-all duration-1000"
        style={{
          background: isTransparent
            ? 'radial-gradient(ellipse at center, rgba(253, 224, 71, 0.18) 0%, rgba(56, 189, 248, 0.15) 45%, transparent 75%)'
            : 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.12) 0%, rgba(14, 165, 233, 0.10) 45%, transparent 75%)',
        }}
      />

      {/* Left Golden Flare */}
      <div
        className="absolute left-[15%] -top-10 w-72 h-24 rounded-full blur-[40px] opacity-70 animate-pulse"
        style={{
          animationDuration: '7s',
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.14) 0%, transparent 70%)',
        }}
      />

      {/* Right Cyan Aurora Whisper */}
      <div
        className="absolute right-[15%] -top-10 w-72 h-24 rounded-full blur-[40px] opacity-70 animate-pulse"
        style={{
          animationDuration: '9s',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.14) 0%, transparent 70%)',
        }}
      />

      {/* Razor-thin Sub-Surface Optical Prism Horizon Line */}
      <div
        className="absolute inset-x-0 bottom-0 h-[1px] transition-opacity duration-500"
        style={{
          background: isTransparent
            ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 20%, rgba(253,224,71,0.3) 50%, rgba(56,189,248,0.2) 80%, transparent 100%)'
            : isScrolled
            ? 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.04) 20%, rgba(245,158,11,0.15) 50%, rgba(14,165,233,0.1) 80%, transparent 100%)'
            : 'transparent',
        }}
      />
    </div>
  );
}
