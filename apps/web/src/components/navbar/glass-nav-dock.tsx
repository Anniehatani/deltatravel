'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import type { User as AuthUser } from '@tour/shared';

interface NavLinkItem {
  href: string;
  label: string;
}

interface GlassNavDockProps {
  navLinks: NavLinkItem[];
  user: AuthUser | null;
  adminLabel: string;
  isTransparent?: boolean;
}

export function GlassNavDock({
  navLinks,
  user,
  adminLabel,
  isTransparent = false,
}: GlassNavDockProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const region = searchParams.get('region') || '';

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname, region]);

  // Check if a link is currently active
  const isLinkActive = useMemo(() => {
    return (href: string) => {
      if (pendingHref !== null) return pendingHref === href;
      if (href === '/') return pathname === '/' && !region;
      if (href === '/tours?region=bac') return (pathname === '/tours' || pathname === '/') && region === 'bac';
      if (href === '/tours?region=trung') return (pathname === '/tours' || pathname === '/') && region === 'trung';
      if (href === '/tours?region=nam') return (pathname === '/tours' || pathname === '/') && region === 'nam';
      if (href === '/tours') return pathname === '/tours' && !region;
      if (href === '/bookings') return pathname.startsWith('/bookings');
      if (href === '/assistant') return pathname.startsWith('/assistant');
      return false;
    };
  }, [pathname, region, pendingHref]);

  const activeIndex = useMemo(
    () => navLinks.findIndex((item) => isLinkActive(item.href)),
    [navLinks, isLinkActive],
  );

  // Position & dimension calculations for the moving glass capsule
  const [gliderStyle, setGliderStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  useEffect(() => {
    const updateGlider = () => {
      const targetIdx = hoveredIndex !== null ? hoveredIndex : activeIndex;
      if (targetIdx !== -1 && linksRef.current[targetIdx] && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const linkRect = linksRef.current[targetIdx]!.getBoundingClientRect();
        setGliderStyle({
          left: linkRect.left - containerRect.left,
          width: linkRect.width,
          opacity: 1,
        });
      } else {
        setGliderStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    };

    updateGlider();
    window.addEventListener('resize', updateGlider);
    return () => window.removeEventListener('resize', updateGlider);
  }, [hoveredIndex, activeIndex, pathname, region]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setPendingHref(href);

    // If on homepage:
    if (pathname === '/') {
      if (href === '/') {
        e.preventDefault();
        router.push('/', { scroll: false });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (href.startsWith('/tours?region=')) {
        e.preventDefault();
        const targetRegion = href.replace('/tours?region=', '');
        router.push(`/?region=${targetRegion}`, { scroll: false });
        const section = document.getElementById('tours-section');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }
    }

    // If on /tours page:
    if (pathname === '/tours') {
      if (href.startsWith('/tours?region=')) {
        e.preventDefault();
        const targetRegion = href.replace('/tours?region=', '');
        router.push(`/tours?region=${targetRegion}`);
        return;
      }
      if (href === '/tours') {
        e.preventDefault();
        router.push('/tours');
        return;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseLeave={() => setHoveredIndex(null)}
      className={`liquid-nav-dock hidden lg:flex items-center gap-0.5 p-1 rounded-full relative isolate transition-all duration-500 select-none ${
        isTransparent
          ? 'bg-white/[0.12] border border-white/30 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.25),inset_0_1.5px_2px_rgba(255,255,255,0.7),inset_0_-1px_1.5px_rgba(0,0,0,0.15)] backdrop-blur-2xl'
          : 'bg-white/70 border border-black/[0.08] shadow-[0_4px_24px_-2px_rgba(0,0,0,0.05),inset_0_1.5px_2px_rgba(255,255,255,0.95),inset_0_-1px_1.5px_rgba(0,0,0,0.03)] backdrop-blur-2xl'
      }`}
      style={{
        boxShadow: isTransparent
          ? '0 12px 36px -4px rgba(0, 0, 0, 0.3), inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.8), inset 0 -1.5px 1.5px 0 rgba(0, 0, 0, 0.15)'
          : '0 6px 24px -2px rgba(0, 0, 0, 0.04), inset 0 1.5px 2px 0 rgba(255, 255, 255, 1), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Top Edge Specular Rim Beam */}
      <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none z-20" />

      {/* ─── Moving Liquid Glass Capsule Glider ─── */}
      <div
        className={`liquid-moving-capsule absolute top-1 bottom-1 rounded-full pointer-events-none transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] z-[5] overflow-hidden ${
          isTransparent
            ? 'bg-white/[0.22] border border-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.25)]'
            : 'bg-white/85 border border-white/95 shadow-[0_4px_14px_rgba(0,0,0,0.08)]'
        }`}
        style={{
          left: `${gliderStyle.left}px`,
          width: `${gliderStyle.width}px`,
          opacity: gliderStyle.opacity,
          boxShadow: isTransparent
            ? '0 6px 20px -2px rgba(0, 0, 0, 0.25), inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.1)'
            : '0 4px 14px -1px rgba(0, 0, 0, 0.06), inset 0 1.5px 2px 0 rgba(255, 255, 255, 1), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Upper Half Specular Glare Reflection */}
        <div className="absolute inset-x-1.5 top-0.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/85 via-white/20 to-transparent pointer-events-none" />
        {/* Razor-sharp Specular Beam */}
        <div className="absolute inset-x-2 top-0.5 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />
      </div>

      {/* ─── Navigation Link Items ─── */}
      {navLinks.map((item, idx) => {
        const active = isLinkActive(item.href);
        const isHovered = hoveredIndex === idx;

        return (
          <Link
            key={item.href}
            ref={(el) => {
              linksRef.current[idx] = el;
            }}
            href={item.href}
            onMouseEnter={() => setHoveredIndex(idx)}
            onClick={(e) => handleLinkClick(e, item.href)}
            className={`group relative z-10 px-3.5 py-1.5 rounded-full text-[13px] tracking-tight transition-all duration-300 flex items-center justify-center select-none cursor-pointer pointer-events-auto ${
              isTransparent
                ? active
                  ? 'text-white font-extrabold drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]'
                  : isHovered
                  ? 'text-white font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]'
                  : 'text-white/80 hover:text-white font-medium'
                : active
                ? 'text-black font-extrabold'
                : isHovered
                ? 'text-black font-bold'
                : 'text-neutral-700 hover:text-black font-semibold'
            }`}
            style={{
              transform: isHovered ? 'translateY(-0.5px)' : 'translateY(0)',
            }}
          >
            <span className="relative z-10 transition-colors duration-200">
              {item.label}
            </span>

            {/* Subtle Glowing Active Indicator Bead */}
            {active && (
              <span
                className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full transition-all duration-300 ${
                  isTransparent
                    ? 'bg-amber-300 shadow-[0_0_8px_rgba(253,224,71,1)]'
                    : 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.9)]'
                }`}
              />
            )}
          </Link>
        );
      })}

      {/* Admin Quick Action (if privileged) */}
      {user && user.role !== 'CUSTOMER' && (
        <Link
          href="/admin"
          className={`relative z-10 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full transition-all duration-300 ml-1 ${
            isTransparent
              ? 'border border-amber-300/50 bg-amber-400/25 text-amber-200 hover:bg-amber-400/35 shadow-[0_2px_12px_rgba(251,191,36,0.3)]'
              : 'border border-amber-400/80 bg-amber-100/80 text-amber-900 hover:bg-amber-200/90 shadow-sm'
          }`}
        >
          <ShieldAlert className="h-3 w-3 text-current" />
          <span>{adminLabel}</span>
        </Link>
      )}
    </div>
  );
}
