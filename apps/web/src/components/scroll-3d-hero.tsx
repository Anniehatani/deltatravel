'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, MapPin, Sparkles } from 'lucide-react';
import NextImage from 'next/image';
import { useLanguage } from '@/providers/language-provider';
import { frameCache, getFramePath, preloadFrame, TOTAL_FRAMES } from '@/lib/asset-preloader';

export function Scroll3DHero() {
  const router = useRouter();
  const { t } = useLanguage();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Smooth lerp state
  const targetProgress = useRef<number>(0);
  const currentProgress = useRef<number>(0);
  const lastDrawnFrame = useRef<number>(-1);
  const isRunning = useRef<boolean>(true);

  const [uiProgress, setUiProgress] = useState<number>(0);

  // High-performance canvas draw function with 'object-fit: cover' behavior
  const drawFrame = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Get preloaded image from cache
    let img = frameCache.get(frameIdx);

    // If frame is still loading, fallback to nearest available frame to avoid blank flickers
    if (!img || !img.complete) {
      if (lastDrawnFrame.current > 0 && frameCache.has(lastDrawnFrame.current)) {
        img = frameCache.get(lastDrawnFrame.current);
      } else {
        // Trigger load in background
        preloadFrame(frameIdx);
        return;
      }
    }

    if (!img || !img.complete) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || 1920;
    const ih = img.naturalHeight || 1080;

    // Calculate 'cover' crop coordinates
    const scale = Math.max(cw / iw, ch / ih);
    const nw = iw * scale;
    const nh = ih * scale;
    const cx = (cw - nw) / 2;
    const cy = (ch - nh) / 2;

    ctx.drawImage(img, cx, cy, nw, nh);
    lastDrawnFrame.current = frameIdx;
  }, []);

  // Handle canvas sizing for crisp display across Retina / 4K / mobile displays
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for optimal GPU memory
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    // Force redraw current frame on resize
    const rawFrame = Math.round(currentProgress.current * (TOTAL_FRAMES - 1)) + 1;
    const frame = Math.min(TOTAL_FRAMES, Math.max(1, rawFrame));
    drawFrame(frame);
  }, [drawFrame]);

  // Continuous buttery 60fps lerp animation loop for inertial scroll
  useEffect(() => {
    isRunning.current = true;
    handleResize();

    // Draw initial frame 1 as soon as available
    preloadFrame(1).then(() => {
      drawFrame(1);
    });

    const renderLoop = () => {
      if (!isRunning.current) return;

      const diff = targetProgress.current - currentProgress.current;

      if (Math.abs(diff) > 0.0001) {
        currentProgress.current += diff * 0.22; // Snappy 60fps damping
        const rawFrame = Math.round(currentProgress.current * (TOTAL_FRAMES - 1)) + 1;
        const frame = Math.min(TOTAL_FRAMES, Math.max(1, rawFrame));

        if (frame !== lastDrawnFrame.current) {
          drawFrame(frame);
        }
        setUiProgress(currentProgress.current);
      } else if (currentProgress.current !== targetProgress.current) {
        currentProgress.current = targetProgress.current;
        const rawFrame = Math.round(currentProgress.current * (TOTAL_FRAMES - 1)) + 1;
        const frame = Math.min(TOTAL_FRAMES, Math.max(1, rawFrame));

        if (frame !== lastDrawnFrame.current) {
          drawFrame(frame);
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
    window.addEventListener('resize', handleResize, { passive: true });
    onScroll();

    return () => {
      isRunning.current = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [drawFrame, handleResize]);

  return (
    <div id="hero-3d-section" ref={containerRef} className="relative w-full h-[360vh] bg-black text-white">
      {/* Sticky Fullscreen Scrubber covering 100% viewport */}
      <div className="sticky top-0 h-screen min-h-[100dvh] w-full overflow-hidden flex items-center justify-center bg-black">
        {/* Hardware-accelerated GPU Canvas for 60fps stutter-free 3D playback */}
        <canvas
          ref={canvasRef}
          aria-label="DELTA 3D Interactive Experience"
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
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/50 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-white shadow-lg mb-4">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span className="tracking-wider uppercase">{t('hero_stage3_tag')}</span>
            </div>

            {/* Title: crisp white with deep dark cinematic drop-shadow, no ugly white blur */}
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)] max-w-2xl mx-auto leading-tight uppercase tracking-tight">
              {t('hero_stage3_title')}
            </h2>

            {/* Subtitle: elegant white/95 with dark drop-shadow */}
            <p className="mt-3 text-xs sm:text-sm font-medium text-white/95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] max-w-md mx-auto leading-relaxed">
              {t('hero_stage3_desc')}
            </p>

            {/* Quick 3-Region Ultra-Refined Liquid Glass Pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/tours?region=bac"
                className="group rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-2xl border border-white/50 hover:border-white text-white px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.7),0_10px_25px_-5px_rgba(0,0,0,0.4)] flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:scale-125 transition-transform" />
                <span>{t('btn_tour_north')}</span>
              </Link>

              <Link
                href="/tours?region=trung"
                className="group rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-2xl border border-white/50 hover:border-white text-white px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.7),0_10px_25px_-5px_rgba(0,0,0,0.4)] flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:scale-125 transition-transform" />
                <span>{t('btn_tour_central')}</span>
              </Link>

              <Link
                href="/tours?region=nam"
                className="group rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-2xl border border-white/50 hover:border-white text-white px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.7),0_10px_25px_-5px_rgba(0,0,0,0.4)] flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:scale-125 transition-transform" />
                <span>{t('btn_tour_south')}</span>
              </Link>
            </div>

            {/* Main Luxury Liquid Glass Call to Action */}
            <div className="mt-6 flex items-center justify-center">
              <Link
                href="/tours"
                className="group inline-flex items-center gap-3 rounded-full bg-black/75 hover:bg-black text-white px-8 py-3.5 text-xs font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_15px_35px_-5px_rgba(0,0,0,0.6)] border border-white/30 hover:border-amber-400/80 backdrop-blur-2xl"
              >
                <span>{t('hero_btn_explore_all')}</span>
                <span className="text-amber-300 transition-transform duration-300 group-hover:translate-x-1 font-bold">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Delta Logo & Ultra-fine Thread Scrubber */}
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
