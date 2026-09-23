'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface GlassBrandLogoProps {
  isTransparent?: boolean;
  tagline: string;
}

export function GlassBrandLogo({ isTransparent = false, tagline }: GlassBrandLogoProps) {
  return (
    <Link
      href="/"
      className="group relative z-10 flex items-center gap-2.5 select-none shrink-0 transition-transform duration-300 active:scale-[0.98]"
      aria-label="DELTA TRAVEL - Trang chủ"
    >
      {/* Brand Icon with Specular Crystal Ring */}
      <div className="relative h-9 w-9 flex items-center justify-center rounded-2xl p-1.5 transition-all duration-300 group-hover:scale-105">
        <Image
          src="/favicon_logo_delta.png"
          alt="DELTA TRAVEL Logo"
          width={32}
          height={32}
          className="object-contain transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110"
          priority
        />
      </div>

      {/* Typography: Luxury Brand Name & Region Tagline */}
      <div className="flex flex-col justify-center">
        <span
          className={`text-base sm:text-lg font-black tracking-wider transition-colors duration-500 flex items-center gap-1.5 ${
            isTransparent
              ? 'text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]'
              : 'text-black drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]'
          }`}
        >
          DELTA TRAVEL
        </span>
        <span
          className={`hidden text-[9.5px] font-bold uppercase tracking-[0.2em] sm:inline-block transition-colors duration-500 ${
            isTransparent
              ? 'text-amber-200/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]'
              : 'text-neutral-600'
          }`}
        >
          {tagline}
        </span>
      </div>
    </Link>
  );
}
