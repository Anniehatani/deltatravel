'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { tourApi } from '@/lib/api';
import type { Tour } from '@tour/shared';
import { Scroll3DHero } from '@/components/scroll-3d-hero';
import { formatVND } from '@/lib/format';
import { useLanguage } from '@/providers/language-provider';
import { FALLBACK_TOURS, filterFallbackTours, getLocalizedTour } from '@/lib/fallback-data';
import { getTourImage, getTourLuxuryTag } from '@/lib/tour-assets';
import { GiantScrollTypography } from '@/components/giant-scroll-typography';
import { LuxuryPreloader } from '@/components/luxury-preloader';
import { LiquidGlassBadge } from '@/components/ui/liquid-glass-badge';
import {
  MapPin,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Clock,
  Award,
  Sparkles,
  Star,
  Crown,
  Compass,
} from 'lucide-react';

// Apple-Grade Liquid Glass Tour Cards with scroll-triggered staggered animations
function TourCardsGrid({ tours, t, lang }: { tours: Tour[]; t: (k: string) => string; lang: 'vi' | 'en' }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [visibleSet, setVisibleSet] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.idx);
            if (!isNaN(idx)) {
              setVisibleSet((prev) => {
                const next = new Set(prev);
                next.add(idx);
                return next;
              });
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' },
    );

    const cards = grid.querySelectorAll('[data-idx]');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [tours]);

  const getTourPrice = (tour: Tour): number => {
    const match = FALLBACK_TOURS.find((f) => f.id === tour.id || f.slug === tour.slug);
    return match ? match.adultPrice : 2450000;
  };

  return (
    <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {tours.map((rawTour, i) => {
        const tour = getLocalizedTour(rawTour, lang);
        const isVisible = visibleSet.has(i);
        const price = getTourPrice(tour);
        const luxuryTag = getTourLuxuryTag(tour, lang);
        const heroImage = getTourImage(tour);

        return (
          <Link
            key={tour.id}
            href={`/tours/${tour.id}`}
            data-idx={i}
            className="group relative flex flex-col rounded-[26px] overflow-hidden liquid-glass-card hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.14)] transition-all duration-500"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.97)',
              transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s`,
            }}
          >
            {/* Hero Image with Cinematic Zoom Effect */}
            <div className="relative h-60 w-full overflow-hidden bg-neutral-900">
              <Image
                src={heroImage}
                alt={tour.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

              {/* Luxury Curated Category Badge — True Liquid Glass */}
              <div className="absolute top-4 left-4 z-10">
                <LiquidGlassBadge
                  variant="luxury"
                  icon={<Sparkles className="h-3 w-3 text-amber-300" />}
                >
                  {luxuryTag}
                </LiquidGlassBadge>
              </div>

              {/* Duration Badge — True Liquid Glass */}
              <div className="absolute top-4 right-4 z-10">
                <LiquidGlassBadge
                  variant="duration"
                  icon={<Calendar className="h-3 w-3 text-white" />}
                >
                  {tour.durationDays}{lang === 'en' ? 'D' : 'N'}{Math.max(1, tour.durationDays - 1)}{lang === 'en' ? 'N' : 'Đ'}
                </LiquidGlassBadge>
              </div>

              {/* Destination Label — True Liquid Glass */}
              <div className="absolute bottom-3.5 left-4 z-10">
                <LiquidGlassBadge
                  variant="destination"
                  icon={<MapPin className="h-3.5 w-3.5 text-amber-300 drop-shadow-md" />}
                >
                  {tour.destination}
                </LiquidGlassBadge>
              </div>

              {/* 5-Star Rating Pill — True Liquid Glass */}
              <div className="absolute bottom-3.5 right-4 z-10">
                <LiquidGlassBadge
                  variant="rating"
                  icon={<Star className="h-3 w-3 fill-amber-300 text-amber-300" />}
                >
                  {t('card_badge_luxury')}
                </LiquidGlassBadge>
              </div>
            </div>

            {/* Card Content Body */}
            <div className="flex flex-col flex-1 p-6 justify-between bg-white/95">
              <div>
                <h3 className="text-[16px] font-black text-black leading-snug line-clamp-2 group-hover:text-amber-900 transition-colors duration-300 tracking-tight">
                  {tour.title}
                </h3>

                <p className="mt-3 text-xs leading-relaxed text-neutral-600 line-clamp-3 font-normal">
                  {tour.description}
                </p>
              </div>

              {/* Bottom Bar: Price & Liquid Glass CTA */}
              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-neutral-600 block tracking-wider">
                    {t('card_price_from')}
                  </span>
                  <span className="text-sm font-black text-black tracking-tight">
                    {formatVND(price)}
                    <span className="text-[10px] font-medium text-neutral-600 ml-1">{t('card_per_guest')}</span>
                  </span>
                </div>

                <span className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-[11px] font-black text-white group-hover:bg-neutral-800 transition-all duration-300 group-hover:gap-2.5 shadow-sm">
                  <span>{t('card_view_action')}</span>
                  <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1 text-amber-300" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function HomeContent() {
  const { t, lang } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlRegion = searchParams.get('region') || '';

  const [activeTab, setActiveTab] = useState<string>(urlRegion);
  const [allTours, setAllTours] = useState<Tour[]>(() => FALLBACK_TOURS);
  const [loading, setLoading] = useState(false);

  // Sync state with URL query parameter
  useEffect(() => {
    setActiveTab(urlRegion);
  }, [urlRegion]);


  const REGIONS = [
    {
      id: 'bac',
      name: t('reg_bac_name'),
      tagline: t('reg_bac_tag'),
      description: t('reg_bac_desc'),
      image: '/tour-ha-long.jpg',
      destinations: ['Hạ Long', 'Sa Pa', 'Ninh Bình', 'Hà Nội'],
      href: '/?region=bac',
    },
    {
      id: 'trung',
      name: t('reg_trung_name'),
      tagline: t('reg_trung_tag'),
      description: t('reg_trung_desc'),
      image: '/tour-da-nang.jpg',
      destinations: ['Đà Nẵng', 'Hội An', 'Huế', 'Nha Trang'],
      href: '/?region=trung',
    },
    {
      id: 'nam',
      name: t('reg_nam_name'),
      tagline: t('reg_nam_tag'),
      description: t('reg_nam_desc'),
      image: '/tour-phu-quoc.jpg',
      destinations: ['Phú Quốc', 'Cần Thơ', 'Tây Ninh', 'Côn Đảo'],
      href: '/?region=nam',
    },
  ];

  useEffect(() => {
    let active = true;
    tourApi
      .list()
      .then((res) => {
        if (active && res.items.length > 0) {
          setAllTours(res.items);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(tabId ? `/?region=${tabId}` : '/', { scroll: false });
  };

  const handleRegionCardClick = (e: React.MouseEvent<HTMLAnchorElement>, regionId: string) => {
    e.preventDefault();
    setActiveTab(regionId);
    router.push(`/?region=${regionId}`, { scroll: false });
    const section = document.getElementById('tours-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const displayedTours = activeTab
    ? allTours.filter((tour) => {
        const fb = FALLBACK_TOURS.find((f) => f.id === tour.id || f.slug === tour.slug);
        return fb ? fb.region === activeTab : true;
      })
    : allTours;

  return (
    <div className="bg-white text-black">
      {/* Luxury Cinematic Preloader & 3D Asset Warming Engine */}
      <LuxuryPreloader />

      {/* High-Performance 3D Scroll Scrubber */}
      <Scroll3DHero />

      {/* Content wrapper with overflow-hidden to protect parallax typography without breaking sticky */}
      <div className="relative overflow-hidden">
        {/* ─── Giant Parallax Typography 1 ─── */}
        <div className="relative pt-6 pb-2 pointer-events-none -z-0">
          <GiantScrollTypography
            text="VIETNAM HERITAGE"
            direction="left"
            speed={0.95}
            outline={true}
          />
        </div>

      {/* ─── 3 Regions Section — Upgraded with Cinematic Photos & Liquid Glass ─── */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/60 bg-amber-50/50 px-4 py-1 text-xs font-black uppercase tracking-widest text-neutral-800 mb-3 backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>{t('sec_3regions_tag')}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight uppercase leading-tight">
            {t('sec_3regions_title')}
          </h2>
          <p className="mt-4 text-xs sm:text-sm font-medium text-neutral-600 leading-relaxed max-w-2xl mx-auto">
            {t('sec_3regions_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {REGIONS.map((reg) => (
            <Link
              key={reg.id}
              href={reg.href}
              onClick={(e) => handleRegionCardClick(e, reg.id)}
              className="group relative flex flex-col rounded-[28px] overflow-hidden liquid-glass-card hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.18)] transition-all duration-500 h-[420px]"
            >
              {/* Background Cover Image with Zoom Effect */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={reg.image}
                  alt={reg.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                />
                {/* Multi-layer luxury gradient scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
              </div>

              {/* Card Content atop Liquid Glass Scrim */}
              <div className="relative z-10 flex flex-col justify-between h-full p-7 text-white">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <LiquidGlassBadge variant="glass">
                      {reg.name}
                    </LiquidGlassBadge>
                    <span className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md border border-white/40 shadow-sm flex items-center justify-center text-white transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white group-hover:text-black">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>

                  <span className="text-[10px] font-black tracking-wider text-amber-300 uppercase block mb-1">
                    {reg.tagline}
                  </span>
                  <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-md">
                    {reg.name}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-white/80 font-normal line-clamp-3">
                    {reg.description}
                  </p>
                </div>

                {/* Destinations pill tags */}
                <div className="pt-4 border-t border-white/20 flex flex-wrap gap-1.5">
                  {reg.destinations.map((d) => (
                    <LiquidGlassBadge key={d} variant="glass" size="xs">
                      {d}
                    </LiquidGlassBadge>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Giant Parallax Typography 2 ─── */}
      <div className="relative pt-6 pb-2 pointer-events-none -z-0">
        <GiantScrollTypography
          text="HAUTE EXPEDITIONS"
          direction="right"
          speed={0.85}
          outline={false}
        />
      </div>

      {/* ─── Featured Tours Section — Apple Liquid Glass with All Destination Images ─── */}
      <section id="tours-section" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-28 sm:scroll-mt-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.25em] text-neutral-600 mb-2">
              <span className="w-8 h-px bg-amber-400" />
              {t('haute_tag')}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-black mt-1 uppercase tracking-tight">
              {t('haute_title')}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600 max-w-xl">
              {t('haute_desc')}
            </p>
          </div>

          {/* Region Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-full apple-glass-pill flex-wrap">
            {[
              { id: '', label: t('filter_all') },
              { id: 'bac', label: t('filter_bac') },
              { id: 'trung', label: t('filter_trung') },
              { id: 'nam', label: t('filter_nam') },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-black text-white shadow-sm'
                    : 'text-neutral-500 hover:text-black hover:bg-black/[0.04]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-[26px] border border-neutral-200 overflow-hidden bg-white">
                <div className="h-60 bg-neutral-200" />
                <div className="p-6 space-y-3">
                  <div className="h-4 w-1/3 bg-neutral-200 rounded" />
                  <div className="h-6 w-3/4 bg-neutral-200 rounded" />
                  <div className="h-16 bg-neutral-200 rounded" />
                  <div className="h-9 bg-neutral-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <TourCardsGrid tours={displayedTours} t={t} lang={lang} />
        )}

        <div className="mt-12 text-center">
          <Link
            href="/tours"
            className="group inline-flex items-center gap-3 rounded-full bg-black px-8 py-4 text-xs font-black uppercase tracking-wider text-white hover:bg-neutral-800 transition-all duration-300 shadow-lg hover:scale-105"
          >
            <span>{t('btn_explore_all')}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 text-amber-300" />
          </Link>
        </div>
      </section>

      {/* ─── Iconic Destinations Showcase Section ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-neutral-100">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-amber-600 mb-2">
            <Compass className="h-3.5 w-3.5 text-amber-500" />
            {t('dest_showcase_tag')}
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-black uppercase tracking-tight">
            {t('dest_showcase_title')}
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-2xl mx-auto">
            {t('dest_showcase_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              name: 'Vịnh Hạ Long',
              region: 'Quảng Ninh • Miền Bắc',
              image: '/tour-ha-long.jpg',
              href: '/?region=bac',
              badge: 'UNESCO World Heritage',
            },
            {
              name: 'Sa Pa & Fansipan',
              region: 'Lào Cai • Miền Bắc',
              image: '/tour-sapa.jpg',
              href: '/?region=bac',
              badge: 'Nóc Nhà Đông Dương',
            },
            {
              name: 'Quần Thể Tràng An',
              region: 'Ninh Bình • Miền Bắc',
              image: '/tour-ninh-binh.jpg',
              href: '/?region=bac',
              badge: 'Di Sản Kép Thế Giới',
            },
            {
              name: 'Đà Nẵng & Hội An',
              region: 'Đà Nẵng • Miền Trung',
              image: '/tour-da-nang.jpg',
              href: '/?region=trung',
              badge: 'Cầu Vàng & Phố Cổ',
            },
            {
              name: 'Cố Đô Huế',
              region: 'Thừa Thiên Huế • Miền Trung',
              image: '/tour-hue.jpg',
              href: '/?region=trung',
              badge: 'Hoàng Triều Di Sản',
            },
            {
              name: 'Đảo Ngọc Phú Quốc',
              region: 'Kiên Giang • Miền Nam',
              image: '/tour-phu-quoc.jpg',
              href: '/?region=nam',
              badge: 'Thiên Đường Biển Ngọc',
            },
          ].map((dest) => (
            <Link
              key={dest.name}
              href={dest.href}
              onClick={(e) => {
                const targetRegion = dest.href.replace('/?region=', '');
                handleRegionCardClick(e, targetRegion);
              }}
              className="group relative h-72 rounded-[28px] overflow-hidden liquid-glass-card hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.22)] transition-all duration-500 flex flex-col justify-end p-6"
            >
              <Image
                src={dest.image}
                alt={dest.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

              <div className="relative z-10 text-white">
                <div className="mb-2">
                  <LiquidGlassBadge variant="luxury">
                    {dest.badge}
                  </LiquidGlassBadge>
                </div>
                <h3 className="text-xl font-black tracking-tight text-white drop-shadow-md group-hover:text-amber-200 transition-colors">
                  {dest.name}
                </h3>
                <p className="text-xs text-white/80 font-medium mt-0.5">
                  {dest.region}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Signature Experiences & Activities Section ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-neutral-100">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-amber-600 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {t('exp_tag')}
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-black uppercase tracking-tight">
            {t('exp_title')}
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-2xl mx-auto">
            {t('exp_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: t('exp_1_title'),
              desc: t('exp_1_desc'),
              icon: Compass,
              tag: 'Cruise 5★',
            },
            {
              title: t('exp_2_title'),
              desc: t('exp_2_desc'),
              icon: Sparkles,
              tag: 'Skyline View',
            },
            {
              title: t('exp_3_title'),
              desc: t('exp_3_desc'),
              icon: Crown,
              tag: 'Fine Dining',
            },
            {
              title: t('exp_4_title'),
              desc: t('exp_4_desc'),
              icon: Award,
              tag: 'Heritage',
            },
          ].map((exp) => (
            <div
              key={exp.title}
              className="group liquid-glass-card rounded-[26px] p-7 transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-md group-hover:bg-neutral-900 group-hover:scale-105 transition-all">
                    <exp.icon className="h-6 w-6 text-amber-300" />
                  </div>
                  <LiquidGlassBadge variant="gold" size="xs">
                    {exp.tag}
                  </LiquidGlassBadge>
                </div>
                <h3 className="text-base font-black text-black leading-snug tracking-tight">
                  {exp.title}
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-neutral-600 font-normal">
                  {exp.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Giant Parallax Typography 3 ─── */}
      <div className="relative pt-6 pb-2 pointer-events-none -z-0">
        <GiantScrollTypography
          text="TIMELESS PRIVÉ"
          direction="left"
          speed={0.9}
          outline={true}
        />
      </div>

      {/* ─── Brand Guarantees — Apple Liquid Glass Prism Cards ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-amber-600 mb-2">
            <Crown className="h-3 w-3 text-amber-500" />
            {t('phil_tag')}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-black uppercase tracking-tight">
            {t('phil_title')}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-neutral-600 leading-relaxed">
            {t('phil_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="liquid-prism-card liquid-gl-target liquid-glass-card rounded-[26px] p-8">
            <div className="liquid-gl-content">
              <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center mb-6 shadow-md">
                <ShieldCheck className="h-6 w-6 text-amber-300" />
              </div>
              <h3 className="text-base font-black text-black uppercase tracking-tight">
                {t('phil_1_title')}
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-neutral-600 font-normal">
                {t('phil_1_desc')}
              </p>
            </div>
          </div>

          <div className="liquid-prism-card liquid-gl-target liquid-glass-card rounded-[26px] p-8">
            <div className="liquid-gl-content">
              <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center mb-6 shadow-md">
                <Clock className="h-6 w-6 text-amber-300" />
              </div>
              <h3 className="text-base font-black text-black uppercase tracking-tight">
                {t('phil_2_title')}
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-neutral-600 font-normal">
                {t('phil_2_desc')}
              </p>
            </div>
          </div>

          <div className="liquid-prism-card liquid-gl-target liquid-glass-card rounded-[26px] p-8">
            <div className="liquid-gl-content">
              <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center mb-6 shadow-md">
                <Award className="h-6 w-6 text-amber-300" />
              </div>
              <h3 className="text-base font-black text-black uppercase tracking-tight">
                {t('phil_3_title')}
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-neutral-600 font-normal">
                {t('phil_3_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4-Step Seamless Booking Process Section ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-neutral-100">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-amber-600 mb-2">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            {t('proc_tag')}
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-black uppercase tracking-tight">
            {t('proc_title')}
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-2xl mx-auto">
            {t('proc_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: t('proc_1_title'),
              desc: t('proc_1_desc'),
            },
            {
              step: '02',
              title: t('proc_2_title'),
              desc: t('proc_2_desc'),
            },
            {
              step: '03',
              title: t('proc_3_title'),
              desc: t('proc_3_desc'),
            },
            {
              step: '04',
              title: t('proc_4_title'),
              desc: t('proc_4_desc'),
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative liquid-glass-card rounded-[26px] p-7 transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between"
            >
              <div>
                <span className="text-3xl font-black text-amber-400/90 font-mono block mb-4">
                  {item.step}
                </span>
                <h3 className="text-base font-black text-black leading-snug tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-neutral-600 font-normal">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Key Statistics & Figures Section ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 rounded-[32px] p-8 md:p-12 liquid-glass-card border border-white/90 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)]">
          {[
            {
              num: t('stats_1_num'),
              label: t('stats_1_label'),
            },
            {
              num: t('stats_2_num'),
              label: t('stats_2_label'),
            },
            {
              num: t('stats_3_num'),
              label: t('stats_3_label'),
            },
            {
              num: t('stats_4_num'),
              label: t('stats_4_label'),
            },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4">
              <span className="text-3xl sm:text-5xl font-black text-black font-mono tracking-tight block">
                {stat.num}
              </span>
              <span className="mt-2 text-xs sm:text-sm font-semibold text-neutral-600 block leading-tight">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Guest Testimonials & Reviews Section ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-neutral-100">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-amber-600 mb-2">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            {t('rev_tag')}
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-black uppercase tracking-tight">
            {t('rev_title')}
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-2xl mx-auto">
            {t('rev_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: t('rev_1_name'),
              role: t('rev_1_role'),
              tour: t('rev_1_tour'),
              content: t('rev_1_content'),
            },
            {
              name: t('rev_2_name'),
              role: t('rev_2_role'),
              tour: t('rev_2_tour'),
              content: t('rev_2_content'),
            },
            {
              name: t('rev_3_name'),
              role: t('rev_3_role'),
              tour: t('rev_3_tour'),
              content: t('rev_3_content'),
            },
          ].map((rev, i) => (
            <div
              key={i}
              className="liquid-glass-card rounded-[28px] p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02]"
            >
              <div>
                {/* 5-Star Rating Row */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm leading-relaxed text-neutral-700 italic font-medium">
                  &ldquo;{rev.content}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-neutral-100">
                <h4 className="text-sm font-black text-black">{rev.name}</h4>
                <p className="text-[11px] text-neutral-500 font-medium">{rev.role}</p>
                <span className="inline-block mt-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {rev.tour}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── VIP Consultation Atelier Banner ─── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24">
        <div className="relative rounded-[32px] overflow-hidden liquid-glass-card p-10 md:p-14 border border-white/90 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.12)]">
          {/* Subtle decorative radial backdrop */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-amber-600 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                {t('bespoke_tag')}
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-black uppercase tracking-tight leading-tight">
                {t('bespoke_title')}
              </h2>
              <p className="mt-3 text-xs md:text-sm text-neutral-600 leading-relaxed font-normal">
                {t('bespoke_desc')}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 shrink-0">
              <Link
                href="/assistant"
                className="rounded-full bg-black text-white hover:bg-neutral-800 px-7 py-3.5 text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md hover:scale-105 flex items-center gap-2"
              >
                <span>{t('bespoke_btn_ai')}</span>
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              </Link>
              <Link
                href="/tours"
                className="liquid-glass-pill text-black hover:bg-white px-7 py-3.5 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <span>{t('bespoke_btn_all')}</span>
                <ArrowRight className="h-3.5 w-3.5 text-black" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <HomeContent />
    </Suspense>
  );
}
