'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User, Menu, X } from 'lucide-react';
import type { User as AuthUser } from '@tour/shared';

interface NavLinkItem {
  href: string;
  label: string;
}

interface GlassMobileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  navLinks: NavLinkItem[];
  isLinkActive: (href: string) => boolean;
  user: AuthUser | null;
  onOpenAccount: () => void;
  manageAccountLabel: string;
  isTransparent?: boolean;
}

export function GlassMobileMenu({
  isOpen,
  onToggle,
  onClose,
  navLinks,
  isLinkActive,
  user,
  onOpenAccount,
  manageAccountLabel,
  isTransparent = false,
}: GlassMobileMenuProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    onClose();

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
    <>
      {/* Hamburger Toggle Button */}
      <button
        type="button"
        onClick={onToggle}
        className={`lg:hidden relative z-20 p-2 rounded-full transition-all duration-300 active:scale-95 ${
          isTransparent
            ? 'border border-white/25 bg-white/[0.08] text-white hover:bg-white/[0.18] shadow-[0_2px_10px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-xl'
            : 'border border-black/[0.08] bg-white/70 text-black hover:bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.95)] backdrop-blur-xl'
        }`}
        aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
      >
        {isOpen ? (
          <X className={`h-4 w-4 ${isTransparent ? 'text-white' : 'text-black'}`} />
        ) : (
          <Menu className={`h-4 w-4 ${isTransparent ? 'text-white' : 'text-black'}`} />
        )}
      </button>

      {/* Mobile Drawer Dropdown */}
      {isOpen && (
        <div
          className={`lg:hidden absolute top-full left-0 right-0 z-50 p-4 transition-all duration-300 animate-fade-in ${
            isTransparent
              ? 'bg-[#0f0f14]/90 border-b border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl'
              : 'bg-white/95 border-b border-black/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.12)] backdrop-blur-3xl'
          }`}
        >
          {/* Specular Top Rim */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

          <div className="flex flex-col gap-1.5 max-w-md mx-auto">
            {navLinks.map((item) => {
              const active = isLinkActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleLinkClick(e, item.href)}
                  className={`py-2.5 px-4 rounded-2xl text-sm font-semibold flex items-center justify-between transition-all duration-200 ${
                    isTransparent
                      ? active
                        ? 'text-white bg-white/20 font-black shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.6)] border border-white/30'
                        : 'text-neutral-300 hover:text-white hover:bg-white/10'
                      : active
                      ? 'text-black bg-black/[0.06] font-black shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.9)] border border-black/10'
                      : 'text-neutral-700 hover:text-black hover:bg-black/[0.03]'
                  }`}
                >
                  <span>{item.label}</span>
                  {active && (
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isTransparent
                          ? 'bg-amber-300 shadow-[0_0_8px_rgba(253,224,71,1)]'
                          : 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.9)]'
                      }`}
                    />
                  )}
                </Link>
              );
            })}

            {user && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAccount();
                }}
                className={`mt-2 py-3 px-4 rounded-2xl text-sm font-bold text-left flex items-center gap-2.5 transition-all ${
                  isTransparent
                    ? 'text-amber-200 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-300/30'
                    : 'text-amber-900 bg-amber-100/80 hover:bg-amber-200/90 border border-amber-300/60'
                }`}
              >
                <User className="h-4 w-4" />
                <span>{manageAccountLabel}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
