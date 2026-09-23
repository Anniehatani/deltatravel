'use client';

import React, { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import { AccountModal } from '@/components/account-modal';

import { HeaderAmbientGlow } from '@/components/navbar/header-ambient-glow';
import { GlassBrandLogo } from '@/components/navbar/glass-brand-logo';
import { GlassNavDock } from '@/components/navbar/glass-nav-dock';
import { GlassLanguageSwitcher } from '@/components/navbar/glass-language-switcher';
import { GlassUserMenu } from '@/components/navbar/glass-user-menu';
import { GlassMobileMenu } from '@/components/navbar/glass-mobile-menu';

function NavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const region = searchParams.get('region') || '';

  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [isOver3D, setIsOver3D] = useState(pathname === '/');
  const [isScrolled, setIsScrolled] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>('');



  // Load customized avatar from local storage
  useEffect(() => {
    const updateAvatar = () => {
      if (typeof window !== 'undefined' && user) {
        const stored =
          localStorage.getItem(`tour_avatar_${user.email}`) ||
          localStorage.getItem('tour_avatar') ||
          '';
        setUserAvatar(stored);
      }
    };
    updateAvatar();
    window.addEventListener('tour_avatar_updated', updateAvatar);
    return () => window.removeEventListener('tour_avatar_updated', updateAvatar);
  }, [user, accountModalOpen]);

  // Track hero 3D overlay state and scroll distance
  useEffect(() => {
    const checkScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      if (pathname === '/') {
        const heroEl = document.getElementById('hero-3d-section');
        if (heroEl) {
          const rect = heroEl.getBoundingClientRect();
          setIsOver3D(rect.bottom > 70);
        } else {
          setIsOver3D(scrollY < window.innerHeight * 1.8);
        }
      } else {
        setIsOver3D(false);
      }
    };

    checkScroll();
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, [pathname]);

  const isTransparent = pathname === '/' && isOver3D;

  const navLinks = useMemo(
    () => [
      { href: '/', label: t('nav_home') },
      { href: '/tours?region=bac', label: t('nav_north') },
      { href: '/tours?region=trung', label: t('nav_central') },
      { href: '/tours?region=nam', label: t('nav_south') },
      { href: '/tours', label: t('nav_all_tours') },
      { href: '/bookings', label: t('nav_my_bookings') },
      { href: '/assistant', label: t('nav_assistant') },
    ],
    [t],
  );

  const isLinkActive = useCallback(
    (href: string) => {
      if (href === '/') return pathname === '/' && !region;
      if (href === '/tours?region=bac') return (pathname === '/tours' || pathname === '/') && region === 'bac';
      if (href === '/tours?region=trung') return (pathname === '/tours' || pathname === '/') && region === 'trung';
      if (href === '/tours?region=nam') return (pathname === '/tours' || pathname === '/') && region === 'nam';
      if (href === '/tours') return pathname === '/tours' && !region;
      if (href === '/bookings') return pathname.startsWith('/bookings');
      if (href === '/assistant') return pathname.startsWith('/assistant');
      return false;
    },
    [pathname, region],
  );

  return (
    <>
      {/* ─── Fixed Header Orchestrator with Crystal Liquid Glass System ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 bg-transparent ${
          isTransparent ? 'text-white' : 'text-black'
        }`}
      >
        {/* Ambient Light Layer behind the glass */}
        <HeaderAmbientGlow isTransparent={isTransparent} isScrolled={isScrolled} />

        <nav
          aria-label="Điều hướng chính"
          className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 lg:px-8"
        >
          {/* Brand Logo & Tagline */}
          <GlassBrandLogo
            isTransparent={isTransparent}
            tagline={t('brand_tagline')}
          />

          {/* Desktop Navigation Dock with Moving Glass Capsule */}
          <GlassNavDock
            navLinks={navLinks}
            user={user}
            adminLabel={t('nav_admin')}
            isTransparent={isTransparent}
          />

          {/* Right Section: Language Switcher + User Profile Pill + Mobile Menu Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Liquid Glass Segmented Language Switcher */}
            <GlassLanguageSwitcher
              lang={lang}
              setLang={setLang}
              isTransparent={isTransparent}
            />

            {/* User Profile Glass Pill & Quick Actions */}
            <GlassUserMenu
              user={user}
              userAvatar={userAvatar}
              onOpenAccount={() => setAccountModalOpen(true)}
              onLogout={() => void logout()}
              loginLabel={t('nav_login')}
              registerLabel={t('nav_register')}
              logoutLabel={t('nav_logout')}
              manageAccountTitle={
                lang === 'en'
                  ? 'Manage account & avatar'
                  : 'Quản lý tài khoản & Đổi ảnh đại diện'
              }
              isTransparent={isTransparent}
            />

            {/* Mobile Menu Hamburger Toggle & Drawer */}
            <GlassMobileMenu
              isOpen={mobileMenuOpen}
              onToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
              onClose={() => setMobileMenuOpen(false)}
              navLinks={navLinks}
              isLinkActive={isLinkActive}
              user={user}
              onOpenAccount={() => setAccountModalOpen(true)}
              manageAccountLabel={
                lang === 'en'
                  ? 'Manage Account & Avatar'
                  : 'Quản lý tài khoản & Đổi ảnh đại diện'
              }
              isTransparent={isTransparent}
            />
          </div>
        </nav>
      </header>

      {/* Account Management & Avatar Customization Modal */}
      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
      />
    </>
  );
}

export function Nav() {
  return (
    <Suspense fallback={<div className="h-16 w-full" />}>
      <NavContent />
    </Suspense>
  );
}
