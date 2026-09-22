'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import { AccountModal } from '@/components/account-modal';
import { LogOut, ShieldAlert, Menu, X, Globe, User, Settings } from 'lucide-react';

function NavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const region = searchParams.get('region') || '';

  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [isOver3D, setIsOver3D] = useState(pathname === '/');
  const [userAvatar, setUserAvatar] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const stored = localStorage.getItem(`tour_avatar_${user.email}`) || localStorage.getItem('tour_avatar') || '';
      setUserAvatar(stored);
    }
  }, [user, accountModalOpen]);

  useEffect(() => {
    if (pathname !== '/') {
      setIsOver3D(false);
      return;
    }

    const checkScroll = () => {
      const heroEl = document.getElementById('hero-3d-section');
      if (heroEl) {
        const rect = heroEl.getBoundingClientRect();
        setIsOver3D(rect.bottom > 80);
      } else {
        setIsOver3D(window.scrollY < window.innerHeight * 2.5);
      }
    };

    checkScroll();
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, [pathname]);

  const isTransparent = pathname === '/' && isOver3D;

  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname, region]);

  // Active tab check: match either optimistic click or exact route & query param
  const isLinkActive = (href: string) => {
    if (pendingHref !== null) return pendingHref === href;
    if (href === '/') return pathname === '/' && !region;
    if (href === '/tours?region=bac') return pathname === '/tours' && region === 'bac';
    if (href === '/tours?region=trung') return pathname === '/tours' && region === 'trung';
    if (href === '/tours?region=nam') return pathname === '/tours' && region === 'nam';
    if (href === '/tours') return pathname === '/tours' && !region;
    if (href === '/bookings') return pathname.startsWith('/bookings');
    if (href === '/assistant') return pathname.startsWith('/assistant');
    return false;
  };

  const navLinks = [
    { href: '/', label: t('nav_home') },
    { href: '/tours?region=bac', label: t('nav_north') },
    { href: '/tours?region=trung', label: t('nav_central') },
    { href: '/tours?region=nam', label: t('nav_south') },
    { href: '/tours', label: t('nav_all_tours') },
    { href: '/bookings', label: t('nav_my_bookings') },
    { href: '/assistant', label: t('nav_assistant') },
  ];

  return (
    <>
      <header
        className={`transition-all duration-500 ${
          isTransparent
            ? 'fixed top-0 left-0 right-0 z-50 bg-transparent border-b border-transparent'
            : 'sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_10px_30px_-10px_rgba(0,0,0,0.06)]'
        }`}
      >
        <nav
          aria-label="Điều hướng chính"
          className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 lg:px-8"
        >
          {/* Brand Logo DELTA TRAVEL */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="relative h-8 w-8 flex items-center justify-center">
              <Image
                src="/favicon_logo_delta.png"
                alt="DELTA TRAVEL"
                width={32}
                height={32}
                className="object-contain transition-transform duration-300 group-hover:scale-110"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span
                className={`text-base sm:text-lg font-black tracking-wider transition-colors ${
                  isTransparent ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]' : 'text-black'
                }`}
              >
                DELTA TRAVEL
              </span>
              <span
                className={`hidden text-[10px] font-bold uppercase tracking-widest sm:inline-block transition-colors ${
                  isTransparent ? 'text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'text-neutral-500'
                }`}
              >
                {t('brand_tagline')}
              </span>
            </div>
          </Link>

          {/* Desktop Primary Navigation with Prominent Active Underlines */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((item) => {
              const active = isLinkActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setPendingHref(item.href)}
                  className={`group relative py-2 text-xs sm:text-sm font-black tracking-tight transition-all duration-200 ${
                    isTransparent
                      ? active
                        ? 'text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]'
                        : 'text-white/75 hover:text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]'
                      : active
                      ? 'text-black'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  <span>{item.label}</span>

                  {/* Active Underline Bar — clearly marks whichever tab is clicked/active */}
                  {active ? (
                    <span
                      className={`absolute -bottom-1 left-0 right-0 h-[3px] rounded-full transition-all duration-300 ${
                        isTransparent
                          ? 'bg-amber-300 shadow-[0_0_10px_rgba(253,224,71,0.9)]'
                          : 'bg-black shadow-sm'
                      }`}
                    />
                  ) : (
                    <span
                      className={`absolute -bottom-1 left-0 right-0 h-[2px] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ${
                        isTransparent ? 'bg-white/40' : 'bg-black/20'
                      }`}
                    />
                  )}
                </Link>
              );
            })}

            {user && user.role !== 'CUSTOMER' && (
              <Link
                href="/admin"
                className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full transition ${
                  isTransparent
                    ? 'border border-white/60 bg-black/40 text-white hover:bg-white hover:text-black'
                    : 'liquid-glass-pill border border-black/80 text-black hover:bg-black hover:text-white'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5 text-current" />
                <span>{t('nav_admin')}</span>
              </Link>
            )}
          </div>

          {/* Right Section: Flags Language Switcher + User Account */}
          <div className="flex items-center gap-3">
            {/* Language Switcher with Flags */}
            <div
              className={`flex items-center rounded-full p-1 text-xs font-bold transition-all ${
                isTransparent
                  ? 'border border-white/40 bg-black/40 backdrop-blur-md'
                  : 'liquid-glass-pill border border-neutral-200/90'
              }`}
            >
              <button
                type="button"
                onClick={() => setLang('vi')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black transition-all ${
                  lang === 'vi'
                    ? isTransparent
                      ? 'bg-white text-black shadow-sm'
                      : 'bg-black text-white shadow-sm'
                    : isTransparent
                    ? 'text-white/80 hover:text-white'
                    : 'text-neutral-600 hover:text-black'
                }`}
                title="Tiếng Việt"
              >
                <span className="text-xs">🇻🇳</span>
                <span className="text-[11px]">VI</span>
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black transition-all ${
                  lang === 'en'
                    ? isTransparent
                      ? 'bg-white text-black shadow-sm'
                      : 'bg-black text-white shadow-sm'
                    : isTransparent
                    ? 'text-white/80 hover:text-white'
                    : 'text-neutral-600 hover:text-black'
                }`}
                title="English"
              >
                <span className="text-xs">🇬🇧</span>
                <span className="text-[11px]">EN</span>
              </button>
            </div>

            {/* User Account / Avatar & Profile Actions */}
            {user ? (
              <div className="flex items-center gap-2">
                {/* Clickable Profile Pill with Avatar Image */}
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(true)}
                  className={`group flex items-center gap-2.5 rounded-full pl-1.5 pr-3 py-1 transition-all duration-300 ${
                    isTransparent
                      ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white'
                      : 'liquid-glass-pill border border-neutral-200/90 hover:border-neutral-300 hover:shadow-md text-black'
                  }`}
                  title="Quản lý tài khoản & Đổi ảnh đại diện"
                >
                  {/* Avatar Circle with Real Photo or Initial */}
                  <div className="relative h-7 w-7 rounded-full overflow-hidden border border-amber-400/80 bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
                    {userAvatar ? (
                      <img src={userAvatar} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                    )}
                  </div>

                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-black leading-tight tracking-tight">
                      {user.name}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-amber-500">
                      VIP Member
                    </span>
                  </div>
                </button>

                {/* Quick Logout Button */}
                <button
                  onClick={() =>
                    void logout().catch(() => setError('Chưa đăng xuất được. Vui lòng thử lại.'))
                  }
                  title={t('nav_logout')}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                    isTransparent
                      ? 'border border-white/40 bg-black/30 text-white hover:bg-white hover:text-black'
                      : 'liquid-glass-pill text-neutral-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <LogOut className="h-3.5 w-3.5 text-current" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${
                    isTransparent
                      ? 'border border-white/70 bg-black/30 backdrop-blur-sm text-white hover:bg-white hover:text-black'
                      : 'liquid-glass-pill border border-neutral-300 text-black hover:bg-black hover:text-white'
                  }`}
                >
                  {t('nav_login')}
                </Link>
                <Link
                  href="/register"
                  className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${
                    isTransparent
                      ? 'bg-white text-black hover:bg-neutral-200'
                      : 'bg-black text-white hover:bg-neutral-800'
                  }`}
                >
                  {t('nav_register')}
                </Link>
              </div>
            )}

            {/* Mobile hamburger menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-full border transition ${
                isTransparent
                  ? 'border-white/70 bg-black/30 text-white'
                  : 'border-neutral-200 text-black liquid-glass-pill'
              }`}
              aria-label="Mở menu"
            >
              {mobileMenuOpen ? (
                <X className={`h-4 w-4 ${isTransparent ? 'text-white' : 'text-black'}`} />
              ) : (
                <Menu className={`h-4 w-4 ${isTransparent ? 'text-white' : 'text-black'}`} />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Dropdown with Liquid Glass */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-neutral-200/80 bg-white/95 backdrop-blur-2xl px-6 py-5 shadow-xl animate-fade-in">
            <div className="flex flex-col gap-3">
              {navLinks.map((item) => {
                const active = isLinkActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`py-2 text-sm font-black border-b border-neutral-100 flex items-center justify-between ${
                      active ? 'text-black font-black' : 'text-neutral-600'
                    }`}
                  >
                    <span>{item.label}</span>
                    {active && <span className="h-2 w-2 rounded-full bg-amber-400" />}
                  </Link>
                );
              })}

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAccountModalOpen(true);
                  }}
                  className="py-2 text-sm font-black text-amber-800 border-b border-neutral-100 text-left flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  <span>Quản lý tài khoản & Đổi ảnh đại diện</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Account Management Modal */}
      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
      />
    </>
  );
}

export function Nav() {
  return (
    <Suspense fallback={<div className="h-16 w-full bg-white/80" />}>
      <NavContent />
    </Suspense>
  );
}
