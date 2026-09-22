'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, MapPin } from 'lucide-react';
import NextImage from 'next/image';
import { useLanguage } from '@/providers/language-provider';

const TOTAL_FRAMES = 150;

function getFramePath(idx: number): string {
  const pad = idx.toString().padStart(3, '0');
  return `/frames/ezgif-frame-${pad}.png`;
}

export function Scroll3DHero() {
  const router = useRouter();
  const { t } = useLanguage();

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Smooth lerp state
  const targetProgress = useRef<number>(0);
  const currentProgress = useRef<number>(0);
  const lastDrawnFrame = useRef<number>(1);
  const isRunning = useRef<boolean>(true);

  const [uiProgress, setUiProgress] = useState<number>(0);

  // Preload frames in background to populate browser cache
  useEffect(() => {
    // 1. Fast initial preload for frames 1-30
    for (let i = 1; i <= 30; i++) {
      const img = new Image();
      img.src = getFramePath(i);
    }

    // 2. Preload key milestones across the entire 150-frame journey
    const milestones = [45, 60, 75, 90, 105, 120, 135, 150];
    milestones.forEach((m) => {
      const img = new Image();
      img.src = getFramePath(m);
    });

    // 3. Rapid sequential preload for all remaining frames
    let cur = 31;
    const preloadRest = () => {
      for (let j = 0; j < 6 && cur <= TOTAL_FRAMES; j++, cur++) {
        const img = new Image();
        img.src = getFramePath(cur);
      }
      if (cur <= TOTAL_FRAMES) {
        setTimeout(preloadRest, 20);
      }
    };
    const timer = setTimeout(preloadRest, 60);

    return () => clearTimeout(timer);
  }, []);

  // Continuous buttery 60fps lerp animation loop for inertial scroll
  useEffect(() => {
    isRunning.current = true;

    const renderLoop = () => {
      if (!isRunning.current) return;

      const diff = targetProgress.current - currentProgress.current;

      if (Math.abs(diff) > 0.0001) {
        currentProgress.current += diff * 0.2; // Snappy 60fps damping
        const rawFrame = Math.round(currentProgress.current * (TOTAL_FRAMES - 1)) + 1;
        const frame = Math.min(TOTAL_FRAMES, Math.max(1, rawFrame));

        if (frame !== lastDrawnFrame.current) {
          lastDrawnFrame.current = frame;
          if (imgRef.current) {
            imgRef.current.src = getFramePath(frame);
          }
        }
        setUiProgress(currentProgress.current);
      } else if (currentProgress.current !== targetProgress.current) {
        currentProgress.current = targetProgress.current;
        const rawFrame = Math.round(currentProgress.current * (TOTAL_FRAMES - 1)) + 1;
        const frame = Math.min(TOTAL_FRAMES, Math.max(1, rawFrame));

        if (frame !== lastDrawnFrame.current) {
          lastDrawnFrame.current = frame;
          if (imgRef.current) {
            imgRef.current.src = getFramePath(frame);
          }
        }
        setUiProgress(currentProgress.current);
      }

      requestAnimationFrame(renderLoop);
    };

    const animId = requestAnimationFrame(renderLoop);

    const onScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      const scrollable = container.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;

      const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const progress = Math.max(0, Math.min(1, scrollTop / scrollable));
      targetProgress.current = progress;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      isRunning.current = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div id="hero-3d-section" ref={containerRef} className="relative w-full h-[360vh] bg-black text-white">
      {/* Sticky Fullscreen Scrubber covering 100% viewport */}
      <div className="sticky top-0 h-screen min-h-[100dvh] w-full overflow-hidden flex items-center justify-center bg-black">
        {/* Hardware-accelerated native 3D sequence flipbook */}
        <img
          ref={imgRef}
          src="/frames/ezgif-frame-001.png"
          alt="DELTA 3D Experience"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Minimal Vignette for Contrast without washing out 3D */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30"
          style={{ zIndex: 5 }}
        />

        {/* Dynamic Story Overlays */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center pointer-events-none">
          {/* Stage 1: Earth in Space (0% - 28%) */}
          <div
            className={`transition-all duration-500 pointer-events-auto ${
              uiProgress < 0.28
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 -translate-y-6 pointer-events-none hidden'
            }`}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/50 backdrop-blur-sm px-3.5 py-1 text-xs font-bold text-white shadow-sm mb-4">
              <span>{t('hero_tag')}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] max-w-3xl mx-auto leading-tight uppercase">
              {t('hero_title_1')}
              <br />
              <span className="underline decoration-2 underline-offset-8">
                {t('hero_title_2')}
              </span>
            </h1>
            <p className="mt-5 text-sm sm:text-base font-medium text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)] max-w-xl mx-auto leading-relaxed">
              {t('hero_desc')}
            </p>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] animate-bounce">
              <ArrowDown className="h-4 w-4 text-white" />
              <span>{t('hero_scroll_hint')}</span>
            </div>
          </div>

          {/* Stage 2: Descending over Vietnam (30% - 65%) */}
          <div
            className={`transition-all duration-500 pointer-events-auto ${
              uiProgress >= 0.28 && uiProgress < 0.68
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-6 pointer-events-none hidden'
            }`}
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-black/50 backdrop-blur-sm px-3.5 py-1 text-xs font-bold text-white mb-3">
              <MapPin className="h-3.5 w-3.5 text-white" />
              <span>{t('hero_stage2_tag')}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] max-w-2xl mx-auto leading-tight uppercase">
              {t('hero_stage2_title')}
            </h2>
            <p className="mt-3 text-xs sm:text-sm font-medium text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)] max-w-lg mx-auto leading-relaxed">
              {t('hero_stage2_desc')}
            </p>
          </div>

          {/* Stage 3: Landing at Ha Long & Navigation (68% - 100%) */}
          <div
            className={`transition-all duration-500 pointer-events-auto ${
              uiProgress >= 0.68
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-6 pointer-events-none hidden'
            }`}
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border border-black/40 bg-white/90 backdrop-blur-sm px-3.5 py-1 text-xs font-bold text-black mb-3">
              <span>{t('hero_stage3_tag')}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-black drop-shadow-[0_1px_6px_rgba(255,255,255,0.9)] max-w-2xl mx-auto leading-tight uppercase">
              {t('hero_stage3_title')}
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm font-bold text-black drop-shadow-[0_1px_4px_rgba(255,255,255,0.9)] max-w-md mx-auto">
              {t('hero_stage3_desc')}
            </p>

            {/* Quick 3-Region Liquid Glass Pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/tours?region=bac"
                className="liquid-glass-pill px-5 py-2.5 text-xs font-bold text-black hover:scale-105 transition-all duration-300 shadow-sm flex items-center gap-1.5"
              >
                <span>{t('btn_tour_north')}</span>
              </Link>
              <Link
                href="/tours?region=trung"
                className="liquid-glass-pill px-5 py-2.5 text-xs font-bold text-black hover:scale-105 transition-all duration-300 shadow-sm flex items-center gap-1.5"
              >
                <span>{t('btn_tour_central')}</span>
              </Link>
              <Link
                href="/tours?region=nam"
                className="liquid-glass-pill px-5 py-2.5 text-xs font-bold text-black hover:scale-105 transition-all duration-300 shadow-sm flex items-center gap-1.5"
              >
                <span>{t('btn_tour_south')}</span>
              </Link>
            </div>

            {/* Main Luxury Call to Action */}
            <div className="mt-5 flex items-center justify-center">
              <Link
                href="/tours"
                className="group inline-flex items-center gap-2.5 rounded-full bg-black/90 hover:bg-black text-white px-7 py-3 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)] border border-white/20 backdrop-blur-md"
              >
                <span>Khám Phá Toàn Bộ Hành Trình</span>
                <span className="text-amber-300 transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Delta Logo & Ultra-fine Thread Scrubber - Strictly NO background box and NO black border */}
        <div className="absolute bottom-6 left-6 right-6 max-w-md mx-auto z-20 flex items-center gap-3 pointer-events-none">
          {/* Logo Delta */}
          <div className="relative h-4 w-4 shrink-0 flex items-center justify-center">
            <NextImage
              src="/favicon_logo_delta.png"
              alt="DELTA"
              width={16}
              height={16}
              className="object-contain"
              priority
            />
          </div>

          {/* Ultra-fine straight thread progress line (crisp 1.5px hairline) */}
          <div className="relative flex-1 h-[1.5px] bg-neutral-300/80 overflow-hidden rounded-full">
            <div
              className="h-full transition-all duration-75 rounded-full"
              style={{
                width: `${Math.round(uiProgress * 100)}%`,
                backgroundColor: '#EDCB8E',
                boxShadow: '0 0 3px #EDCB8E',
              }}
            />
          </div>

          {/* Progress Percentage matching logo gold color */}
          <span
            className="text-xs font-mono font-bold min-w-[34px] text-right"
            style={{ color: '#EDCB8E' }}
          >
            {Math.round(uiProgress * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
