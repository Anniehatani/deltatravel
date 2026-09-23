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
      className="liquid-nav-dock hidden lg:flex items-center gap-0.5 p-1 rounded-full relative isolate transition-all duration-300 select-none bg-neutral-950/85 border border-white/20 shadow-[0_12px_36px_-4px_rgba(0,0,0,0.4),inset_0_1.5px_2px_0_rgba(255,255,255,0.3)] backdrop-blur-2xl"
    >
      {/* Top Edge Specular Rim Beam */}
      <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none z-20" />

      {/* ─── Moving Liquid Glass Capsule Glider ─── */}
      <div
        className="liquid-moving-capsule absolute top-1 bottom-1 rounded-full pointer-events-none transition-all duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] z-[5] overflow-hidden bg-white/20 border border-white/40 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
        style={{
          left: `${gliderStyle.left}px`,
          width: `${gliderStyle.width}px`,
          opacity: gliderStyle.opacity,
        }}
      >
        {/* Upper Half Specular Glare Reflection */}
        <div className="absolute inset-x-1.5 top-0.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/60 via-white/10 to-transparent pointer-events-none" />
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
            className={`group relative z-10 px-3.5 py-1.5 rounded-full text-[13px] tracking-tight transition-all duration-200 flex items-center justify-center select-none cursor-pointer pointer-events-auto ${
              active
                ? 'text-white font-black'
                : isHovered
                ? 'text-white font-bold'
                : 'text-neutral-300 hover:text-white font-medium'
            }`}
          >
            <span className="relative z-10 transition-colors duration-200">
              {item.label}
            </span>

            {/* Subtle Glowing Active Indicator Bead */}
            {active && (
              <span
                className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]"
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
