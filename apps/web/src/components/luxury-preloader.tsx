'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  preloadCriticalAssets,
  startBackgroundFramePreload,
} from '@/lib/asset-preloader';
import { useLanguage } from '@/providers/language-provider';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export function LuxuryPreloader() {
  const { t } = useLanguage();
  const [percent, setPercent] = useState(0);
  const [statusText, setStatusText] = useState(t('preloader_status_1'));
  const [isFinished, setIsFinished] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const animRef = useRef<number | null>(null);

  // References for reliable real-time tracking across closures
  const targetPercentRef = useRef<number>(0);
  const currentPercentRef = useRef<number>(0);
  const isVideoEndedRef = useRef<boolean>(false);
  const isPageReadyRef = useRef<boolean>(false);
  const isTerminatedRef = useRef<boolean>(false);

  // Check if intro has already run in current session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const alreadyPlayed = sessionStorage.getItem('delta_intro_played');
      if (alreadyPlayed === 'true') {
        setIsVisible(false);
        return;
      }
      setIsVisible(true);
    }
  }, []);

  const completePreloader = useCallback(() => {
    if (isTerminatedRef.current) return;
    isTerminatedRef.current = true;

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('delta_intro_played', 'true');
    }

    targetPercentRef.current = 100;
    currentPercentRef.current = 100;
    setPercent(100);
    setStatusText(t('preloader_status_ready'));
    setIsFinished(true);

    startBackgroundFramePreload();

    setTimeout(() => {
      document.body.style.overflow = '';
      setIsVisible(false);
    }, 650);
  }, [t]);

  useEffect(() => {
    if (!isVisible) return;
    document.body.style.overflow = 'hidden';

    // Start video playback immediately
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {});
    }

    // High-precision smooth progress counter interpolation loop
    const tick = () => {
      if (isTerminatedRef.current) return;

      // Real-time video progress sampling
      if (video && video.duration && !video.paused && video.currentTime > 0) {
        const vPercent = Math.min(99, (video.currentTime / video.duration) * 100);
        targetPercentRef.current = Math.max(targetPercentRef.current, vPercent);
      }

      // Smooth lerp step towards targetPercent
      const target = targetPercentRef.current;
      if (currentPercentRef.current < target) {
        const delta = target - currentPercentRef.current;
        const step = Math.max(0.4, delta * 0.14);
        currentPercentRef.current = Math.min(target, currentPercentRef.current + step);
        setPercent(Math.floor(currentPercentRef.current));
      }

      // Dynamic cinematic status messages
      const cur = currentPercentRef.current;
      if (cur < 25) {
        setStatusText(t('preloader_status_1'));
      } else if (cur < 55) {
        setStatusText(t('preloader_status_2'));
      } else if (cur < 85) {
        setStatusText(t('preloader_status_3'));
      } else if (cur < 99) {
        setStatusText(t('preloader_status_4'));
      }

      // Check if both video reached the end AND page assets are loaded
      if (isVideoEndedRef.current && isPageReadyRef.current) {
        completePreloader();
        return;
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    // Preload critical assets in background
    preloadCriticalAssets((progress) => {
      targetPercentRef.current = Math.max(targetPercentRef.current, Math.round(progress * 0.9));
    }).then(() => {
      isPageReadyRef.current = true;
      // If video has already ended, we can finish now!
      if (isVideoEndedRef.current) {
        completePreloader();
      }
    });

    // Failsafe maximum timer: if page is ready or 8s passed, ensure site is accessible
    const failsafeTimer = setTimeout(() => {
      isPageReadyRef.current = true;
      completePreloader();
    }, 8000);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      clearTimeout(failsafeTimer);
      document.body.style.overflow = '';
    };
  }, [isVisible, completePreloader, t]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration) {
      const vProgress = Math.min(99, Math.round((video.currentTime / video.duration) * 100));
      targetPercentRef.current = Math.max(targetPercentRef.current, vProgress);
    }
  };

  const handleVideoEnded = () => {
    // Video has played from A to Z!
    isVideoEndedRef.current = true;

    const video = videoRef.current;
    if (video) {
      video.pause();
    }

    if (isPageReadyRef.current) {
      completePreloader();
    } else {
      targetPercentRef.current = 99;
      setStatusText(t('preloader_status_frozen'));
    }
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('delta_intro_played', 'true');
    }
    completePreloader();
  };

  if (!isVisible) return null;

  return (
    <div
      data-liquid-ignore="true"
      aria-label="Đang tải trang web DELTA TRAVEL..."
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-black text-white select-none transition-all duration-700 ease-out ${
        isFinished
          ? 'opacity-0 scale-[1.03] pointer-events-none'
          : 'opacity-100 scale-100 pointer-events-auto'
      }`}
    >
      {/* ─── Cinematic Fullscreen Space-to-Vietnam Intro Video ─── */}
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Luxury Cinematic Scrim & Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/80 z-[1] pointer-events-none" />
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.08) 0%, rgba(0, 0, 0, 0.6) 65%, #000000 100%)',
        }}
      />

      {/* Top Bar with Brand & Skip Action */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-6 sm:pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center">
            <Image
              src="/favicon_logo_delta.png"
              alt="DELTA Logo"
              width={22}
              height={22}
              priority
              className="object-contain"
            />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-black tracking-widest text-white uppercase block">
              DELTA TRAVEL
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] text-amber-300 uppercase block">
              {t('preloader_collection')}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-white transition-all duration-300 cursor-pointer shadow-lg active:scale-95"
        >
          <span>{t('preloader_skip')}</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-300 transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </header>

      {/* Center Cinematic Focus */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-amber-400/40 backdrop-blur-md mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{t('preloader_heritage_tag')}</span>
          <Sparkles className="w-3 h-3 text-amber-400" />
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
          {t('preloader_headline')}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-white/80 max-w-md font-medium leading-relaxed drop-shadow-md">
          {t('preloader_desc')}
        </p>
      </div>

      {/* Bottom Progress HUD */}
      <footer className="relative z-10 w-full max-w-md mx-auto px-6 pb-8 sm:pb-10 flex flex-col items-center text-center">
        {/* Dynamic Numerical Counter */}
        <div className="flex items-baseline justify-center mb-3 font-mono">
          <span className="text-3xl sm:text-4xl font-black text-white tracking-tighter drop-shadow-lg">
            {percent.toString().padStart(2, '0')}
          </span>
          <span className="text-sm font-bold text-amber-400 ml-1">%</span>
        </div>

        {/* Liquid Gold Progress Bar */}
        <div className="relative w-full h-[3px] bg-white/15 rounded-full overflow-hidden mb-4 backdrop-blur-md">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-amber-300 to-yellow-100 rounded-full transition-all duration-150 ease-out shadow-[0_0_16px_rgba(245,158,11,1)]"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-white/15 text-[11px] font-medium text-neutral-300 backdrop-blur-md shadow-md max-w-sm">
          {percent >= 100 ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
          )}
          <span className="truncate">{statusText}</span>
        </div>
      </footer>
    </div>
  );
}
