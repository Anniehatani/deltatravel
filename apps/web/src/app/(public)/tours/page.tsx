'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { tourApi } from '@/lib/api';
import type { Tour } from '@tour/shared';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/providers/language-provider';
import { filterFallbackTours, FALLBACK_TOURS, getLocalizedTour } from '@/lib/fallback-data';
import { getTourImage, getTourLuxuryTag } from '@/lib/tour-assets';
import { GiantScrollTypography } from '@/components/giant-scroll-typography';
import { formatVND } from '@/lib/format';
import { LiquidGlassBadge } from '@/components/ui/liquid-glass-badge';
import {
  MapPin,
  Calendar,
  ArrowRight,
  RefreshCcw,
  Compass,
  Sparkles,
  Shield,
  Star,
} from 'lucide-react';

function ToursListContent() {
  const { t, lang } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRegion = searchParams.get('region') || '';

  const [activeRegion, setActiveRegion] = useState(initialRegion);
  const [tours, setTours] = useState<Tour[]>(() => filterFallbackTours('', initialRegion, lang).items);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const REGION_TABS = [
    { id: '', label: t('tours_tab_all'), subtitle: t('tours_tab_all_sub') },
    { id: 'bac', label: t('reg_bac_name'), subtitle: t('tours_tab_bac_sub') },
    { id: 'trung', label: t('reg_trung_name'), subtitle: t('tours_tab_trung_sub') },
    { id: 'nam', label: t('reg_nam_name'), subtitle: t('tours_tab_nam_sub') },
  ];

  const fetchTours = (region: string) => {
    setLoading(true);
    setError(null);
    tourApi
      .list('', region)
      .then((res) => {
        setTours(res.items.length > 0 ? res.items : filterFallbackTours('', region, lang).items);
      })
      .catch(() => {
        // Use rich fallback tours with proper filtering
        setTours(filterFallbackTours('', region, lang).items);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const reg = searchParams.get('region') || '';
    setActiveRegion(reg);
    fetchTours(reg);

    const onUpdate = () => {
      fetchTours(reg);
    };
    window.addEventListener('delta_tours_updated', onUpdate);
    return () => window.removeEventListener('delta_tours_updated', onUpdate);
  }, [searchParams, lang]);

  const handleRegionChange = (regId: string) => {
    setActiveRegion(regId);
    const params = new URLSearchParams();
    if (regId) params.set('region', regId);
    router.push(`/tours${regId ? `?region=${regId}` : ''}`);
  };

  // Helper to get pricing from commercial tour data
  const getTourPrice = (tour: Tour): number => {
    if ('adultPrice' in tour && typeof (tour as any).adultPrice === 'number' && (tour as any).adultPrice > 0) {
      return (tour as any).adultPrice;
    }
    const match = FALLBACK_TOURS.find((f) => f.id === tour.id || f.slug === tour.slug);
    return match ? match.adultPrice : 2450000;
  };

  return (
    <div className="relative space-y-12 text-black overflow-hidden pb-16">
      {/* Background Giant Parallax Typography 1 */}
      <div className="absolute top-4 left-0 right-0 pointer-events-none -z-10">
        <GiantScrollTypography
          text="CURATED ODYSSEY"
          direction="left"
          speed={0.95}
          outline={true}
        />
      </div>

      {/* Apple Liquid Glass Segmented Region Switcher (No Search Bar) */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-2">
        <div className="inline-flex p-1.5 rounded-full bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_15px_35px_-10px_rgba(0,0,0,0.07)] gap-1.5 flex-wrap justify-center max-w-full">
          {REGION_TABS.map((tab) => {
            const isActive = activeRegion === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleRegionChange(tab.id)}
                className={`group relative px-6 py-2.5 rounded-full text-xs font-black transition-all duration-400 flex items-center gap-2 ${
                  isActive
                    ? 'bg-black text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)] scale-[1.02]'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-100/70'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full transition-colors ${
                    isActive
                      ? 'bg-white/20 text-amber-200'
                      : 'bg-black/5 text-neutral-500 group-hover:bg-black/10'
                  }`}
                >
                  {tab.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Collection Counter & Editorial Tagline */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between border-b border-neutral-200/80 pb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#edcb8e]" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-neutral-800">
            {activeRegion
              ? `${t('tours_counter_prefix')} ${REGION_TABS.find((r) => r.id === activeRegion)?.label.toUpperCase()} • ${tours.length} ${t('tours_counter_suffix')}`
              : t('tours_counter_all')}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-600">
          <Shield className="h-3.5 w-3.5 text-amber-600" />
          <span>{t('tours_guarantee_text')}</span>
        </div>
      </div>

      {/* Main Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-3xl border border-neutral-200/80 bg-white p-4 space-y-4 shadow-sm">
              <div className="h-56 bg-neutral-200 rounded-2xl" />
              <div className="space-y-2 p-2">
                <div className="h-4 w-1/3 bg-neutral-200 rounded-full" />
                <div className="h-6 w-3/4 bg-neutral-200 rounded" />
                <div className="h-12 bg-neutral-100 rounded" />
                <div className="h-10 bg-neutral-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="liquid-glass-card rounded-3xl p-12 text-center max-w-lg mx-auto">
          <p className="text-sm font-bold text-black mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => fetchTours(activeRegion)}
            className="inline-flex items-center gap-2 rounded-full border border-black hover:bg-black hover:text-white text-xs font-bold uppercase px-6 py-2.5"
          >
            <RefreshCcw className="h-4 w-4 text-current" />
            <span>{lang === 'en' ? 'Reload Voyages' : 'Tải Lại Hành Trình'}</span>
          </Button>
        </div>
      ) : tours.length === 0 ? (
        <div className="liquid-glass-card rounded-3xl p-16 text-center max-w-xl mx-auto">
          <Compass className="mx-auto h-12 w-12 text-black/60 mb-4" />
          <h3 className="text-xl font-black text-black uppercase tracking-tight">
            {lang === 'en' ? 'No Open Voyages in this Region' : 'Chưa có hành trình mở bán'}
          </h3>
          <p className="mt-2 text-xs font-medium text-neutral-600 max-w-md mx-auto leading-relaxed">
            {lang === 'en'
              ? 'This realm is currently undergoing high-season itinerary curation. Please select another realm.'
              : 'Hiện khu vực này đang được nâng cấp lịch trình mùa cao điểm. Quý khách vui lòng chọn phân vùng khác.'}
          </p>
          <Button
            variant="outline"
            onClick={() => handleRegionChange('')}
            className="mt-6 text-xs font-bold rounded-full border border-black hover:bg-black hover:text-white uppercase px-6 py-2.5"
          >
            {lang === 'en' ? 'View All Masterpieces' : 'Xem Toàn Bộ Tuyệt Tác'}
          </Button>
        </div>
      ) : (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tours.map((rawTour, index) => {
            const tour = getLocalizedTour(rawTour, lang);
            const price = getTourPrice(tour);
            const luxuryTag = getTourLuxuryTag(tour, lang);
            const heroImage = getTourImage(tour);

            return (
              <Link
                key={tour.id}
                href={`/tours/${tour.id}`}
                className="group relative flex flex-col rounded-[26px] overflow-hidden liquid-glass-card hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.14)] transition-all duration-500"
                style={{
                  animationDelay: `${index * 0.08}s`,
                }}
              >
                {/* Hero Photograph Container with Apple-like Zoom & Depth */}
                <div className="relative h-60 w-full overflow-hidden bg-neutral-900">
                  <Image
                    src={heroImage}
                    alt={tour.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                    priority={index < 3}
                  />

                  {/* Cinematic Ambient Dark Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

                  {/* Top-Left: Luxury Curated Tag */}
                  <div className="absolute top-4 left-4 z-10">
                    <LiquidGlassBadge
                      variant="luxury"
                      icon={<Sparkles className="h-3 w-3 text-amber-300" />}
                    >
                      {luxuryTag}
                    </LiquidGlassBadge>
                  </div>

                  {/* Top-Right: Duration Liquid Glass Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <LiquidGlassBadge
                      variant="duration"
                      icon={<Calendar className="h-3 w-3 text-white" />}
                    >
                      {tour.durationDays}{lang === 'en' ? 'D' : 'N'}{Math.max(1, tour.durationDays - 1)}{lang === 'en' ? 'N' : 'Đ'}
                    </LiquidGlassBadge>
                  </div>

                  {/* Bottom-Left: Location Pin Label */}
                  <div className="absolute bottom-3.5 left-4 z-10">
                    <LiquidGlassBadge
                      variant="destination"
                      icon={<MapPin className="h-3.5 w-3.5 text-amber-300 drop-shadow-md" />}
                    >
                      {tour.destination}
                    </LiquidGlassBadge>
                  </div>

                  {/* Bottom-Right: 5-Star Rating Pill */}
                  <div className="absolute bottom-3.5 right-4 z-10">
                    <LiquidGlassBadge
                      variant="rating"
                      icon={<Star className="h-3 w-3 fill-amber-300 text-amber-300" />}
                    >
                      {t('card_badge_luxury')}
                    </LiquidGlassBadge>
                  </div>
                </div>

                {/* Card Editorial Content Body */}
                <div className="flex flex-col flex-1 p-6 justify-between bg-white/95">
                  <div>
                    <h3 className="text-[16px] font-black text-black leading-snug line-clamp-2 group-hover:text-amber-900 transition-colors duration-300 tracking-tight">
                      {tour.title}
                    </h3>

                    <p className="mt-3 text-xs leading-relaxed text-neutral-600 line-clamp-3 font-normal">
                      {tour.description}
                    </p>
                  </div>

                  {/* Bottom Price & Apple CTA Action */}
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
      )}

      {/* Secondary Background Giant Parallax Typography 2 */}
      <div className="relative pointer-events-none -z-10 pt-4">
        <GiantScrollTypography
          text="SANCTUARY RETREAT"
          direction="right"
          speed={0.85}
          outline={false}
        />
      </div>
    </div>
  );
}

export default function Page() {
  const { t, lang } = useLanguage();

  return (
    <PageShell
      badge={t('tours_header_badge')}
      title={t('tours_header_title')}
      description={t('tours_header_desc')}
    >
      <Suspense fallback={<div className="p-16 text-center text-xs font-black text-black uppercase tracking-widest">{lang === 'en' ? 'Loading curated collection...' : 'Đang tải bộ sưu tập tinh hoa...'}</div>}>
        <ToursListContent />
      </Suspense>
    </PageShell>
  );
}
