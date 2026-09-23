'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { z } from 'zod';
import { tourApi, bookingApi } from '@/lib/api';
import type { Tour, Schedule, QuoteResultSchema } from '@tour/shared';
import { formatVND, formatDate } from '@/lib/format';
import { useLanguage } from '@/providers/language-provider';
import { Button } from '@/components/ui/button';
import { getTourImage, getTourLuxuryTag, getTourItinerary } from '@/lib/tour-assets';
import { getLocalizedTour } from '@/lib/fallback-data';
import { LiquidGlassBadge } from '@/components/ui/liquid-glass-badge';
import {
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  RefreshCcw,
  Sparkles,
  Compass,
} from 'lucide-react';

type QuoteResult = z.infer<typeof QuoteResultSchema>;

export default function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tourId = resolvedParams.id;
  const router = useRouter();
  const { t, lang } = useLanguage();

  const [tour, setTour] = useState<Tour | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);


  const [adults, setAdults] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);

  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTourData = () => {
    setLoading(true);
    setError(null);
    Promise.all([tourApi.get(tourId), tourApi.schedules(tourId)])
      .then(([tourData, schedulesData]) => {
        setTour(tourData);
        setSchedules(schedulesData.items);
        const firstOpen = schedulesData.items.find((s) => s.status === 'OPEN' && s.availableSeats > 0);
        if (firstOpen) {
          setSelectedScheduleId(firstOpen.id);
        } else if (schedulesData.items.length > 0) {
          setSelectedScheduleId(schedulesData.items[0].id);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không thể tải chi tiết tour.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTourData();
  }, [tourId]);

  // Request quote when schedule or guest count changes
  useEffect(() => {
    if (!selectedScheduleId) {
      setQuote(null);
      return;
    }
    const currentSchedule = schedules.find((s) => s.id === selectedScheduleId);
    if (!currentSchedule || currentSchedule.status !== 'OPEN') {
      setQuote(null);
      return;
    }

    let active = true;
    setQuoteLoading(true);
    setQuoteError(null);

    bookingApi
      .quote({
        scheduleId: selectedScheduleId,
        adults,
        children: childrenCount,
      })
      .then((res) => {
        if (active) {
          setQuote(res);
          setQuoteError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setQuote(null);
          setQuoteError(err instanceof Error ? err.message : 'Không thể lấy báo giá.');
        }
      })
      .finally(() => {
        if (active) setQuoteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedScheduleId, adults, childrenCount, schedules]);

  const handleProceedCheckout = () => {
    if (!selectedScheduleId) return;
    router.push(
      `/checkout/${selectedScheduleId}?adults=${adults}&children=${childrenCount}`,
    );
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-24 sm:pt-28 lg:pt-32 pb-16 lg:px-8 bg-white">
        <div className="animate-pulse space-y-8">
          <div className="h-6 w-1/4 bg-neutral-200 rounded" />
          <div className="h-60 rounded-xl bg-neutral-200" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 h-64 rounded-xl bg-neutral-100" />
            <div className="h-64 rounded-xl bg-neutral-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-24 sm:pt-28 lg:pt-32 pb-20 text-center bg-white">
        <div className="rounded-xl border-2 border-black bg-white p-12">
          <AlertCircle className="mx-auto h-12 w-12 text-black mb-4" />
          <h2 className="text-2xl font-black text-black uppercase">
            Không tìm thấy thông tin hành trình
          </h2>
          <p className="mt-2 text-sm font-medium text-neutral-600 mb-6">
            {error || 'Tour này có thể đã kết thúc hoặc không khả dụng.'}
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={loadTourData} className="gap-2 border border-black text-black hover:bg-black hover:text-white uppercase font-bold">
              <RefreshCcw className="h-4 w-4 text-current" /> Thử lại
            </Button>
            <Button asChild className="bg-black text-white hover:bg-neutral-800 uppercase font-bold">
              <Link href="/tours">Xem tất cả tour</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);
  const displayTour = tour ? getLocalizedTour(tour, lang) : null;
  const itinerary = tour ? getTourItinerary(tour, lang) : [];
  const heroImage = tour ? getTourImage(tour) : '/tour-ha-long.jpg';
  const luxuryTag = tour ? getTourLuxuryTag(tour, lang) : '';

  if (!displayTour) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-24 sm:pt-28 lg:pt-32 pb-16 lg:px-8 bg-white text-black">
      {/* Breadcrumb */}
      <nav aria-label="Điều hướng phân cấp" className="flex items-center gap-2 text-xs font-bold text-neutral-500 mb-6 uppercase tracking-wider">
        <Link href="/" className="hover:text-black transition">DELTA TRAVEL</Link>
        <ChevronRight className="h-3 w-3 text-black" />
        <Link href="/tours" className="hover:text-black transition">{t('nav_all_tours')}</Link>
        <ChevronRight className="h-3 w-3 text-black" />
        <span className="text-black truncate max-w-xs">{displayTour.title}</span>
      </nav>

      {/* Hero Tour Banner - Replaced plain black box with Cinematic Photograph Banner */}
      <div className="relative rounded-[28px] overflow-hidden border border-black/10 min-h-[380px] md:min-h-[440px] flex flex-col justify-end p-6 sm:p-10 md:p-14 mb-12 shadow-2xl group bg-neutral-900">
        {/* High-Resolution Destination Photograph */}
        <Image
          src={heroImage}
          alt={displayTour.title}
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1200px"
          className="object-cover object-center transform group-hover:scale-105 transition-transform duration-1000 ease-out"
        />

        {/* Cinematic Multi-Layer Dark Vignette & Gradient for 100% crystal-clear readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30 z-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent z-0" />

        {/* Banner Editorial Content */}
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <LiquidGlassBadge
              variant="destination"
              size="md"
              icon={<MapPin className="h-3.5 w-3.5 text-amber-300" />}
            >
              {displayTour.destination}
            </LiquidGlassBadge>
            <LiquidGlassBadge
              variant="duration"
              size="md"
              icon={<Calendar className="h-3.5 w-3.5 text-amber-300" />}
            >
              {displayTour.durationDays} {t('days')} {Math.max(1, displayTour.durationDays - 1)} {t('nights')}
            </LiquidGlassBadge>
            <LiquidGlassBadge
              variant="luxury"
              size="md"
              icon={<Sparkles className="h-3.5 w-3.5 text-amber-300" />}
            >
              {luxuryTag}
            </LiquidGlassBadge>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            {displayTour.title}
          </h1>

          <p className="mt-4 text-xs sm:text-sm text-neutral-200 leading-relaxed max-w-2xl font-normal drop-shadow-md">
            {displayTour.description}
          </p>
        </div>
      </div>

      {/* Main Grid: Details + Booking Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Schedules & Info */}
        <div className="lg:col-span-2 space-y-10">
          {/* Schedules Section */}
          <section className="rounded-xl border-2 border-black bg-white p-8">
            <div className="flex items-center justify-between pb-5 border-b border-black/10 mb-6">
              <div>
                <h2 className="text-xl font-black text-black uppercase">
                  {t('sched_title')}
                </h2>
                <p className="text-xs text-neutral-600 mt-1 font-medium">
                  {t('sched_subtitle')}
                </p>
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-black border border-black px-2.5 py-1 rounded">
                {schedules.length} {lang === 'en' ? 'Departures' : 'Lịch mở bán'}
              </span>
            </div>

            {schedules.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-black rounded-xl">
                <Calendar className="mx-auto h-8 w-8 text-black mb-2" />
                <p className="text-sm font-bold text-black">
                  {lang === 'en' ? 'No departures currently open for this tour.' : 'Hiện chưa có lịch khởi hành mở bán cho tour này.'}
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  {lang === 'en' ? 'Please choose another tour or return shortly.' : 'Vui lòng chọn tour khác hoặc quay lại sau ít ngày.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {schedules.map((schedule) => {
                  const isSelected = selectedScheduleId === schedule.id;
                  const isAvailable = schedule.status === 'OPEN' && schedule.availableSeats > 0;

                  return (
                    <button
                      key={schedule.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedScheduleId(schedule.id)}
                      className={`relative flex flex-col justify-between p-5 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-2 border-black bg-black text-white shadow-sm'
                          : isAvailable
                          ? 'border border-black bg-white text-black hover:bg-neutral-50'
                          : 'border border-neutral-300 bg-neutral-100 opacity-50 cursor-not-allowed text-neutral-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className={`text-xs uppercase font-bold ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                            {t('dep_date')}
                          </span>
                          <p className="text-sm font-black mt-0.5">
                            {formatDate(schedule.departureAt)}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black">
                            <CheckCircle2 className="h-3.5 w-3.5 text-black" />
                          </span>
                        )}
                      </div>

                      <div className={`pt-3 border-t flex items-center justify-between text-xs ${isSelected ? 'border-neutral-700' : 'border-neutral-200'}`}>
                        <div>
                          <span className={isSelected ? 'text-neutral-300' : 'text-neutral-600'}>
                            {t('ticket_price')}{' '}
                          </span>
                          <span className="font-black">
                            {formatVND(schedule.adultPrice)}
                          </span>
                        </div>
                        <span className="font-black uppercase">
                          {isAvailable ? `${t('seats_left')} ${schedule.availableSeats} ${t('seats_unit')}` : t('sold_out')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Detailed Day-by-Day Itinerary Section */}
          <section className="rounded-2xl border-2 border-black bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-5 border-b border-black/10 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-amber-600 mb-1 tracking-wider">
                  <Compass className="h-4 w-4 text-amber-500" />
                  <span>
                    {t('detail_itinerary_badge')} • {displayTour.durationDays} {lang === 'en' ? 'DAYS' : 'NGÀY'} {Math.max(1, displayTour.durationDays - 1)} {lang === 'en' ? 'NIGHTS' : 'ĐÊM'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight">
                  {t('detail_itinerary_title')}
                </h2>
                <p className="text-xs text-neutral-600 mt-1 font-medium">
                  {t('detail_itinerary_desc')}
                </p>
              </div>
              <span className="hidden sm:inline-flex text-xs font-black uppercase tracking-wider text-black border border-black px-3 py-1.5 rounded-full bg-neutral-50">
                {itinerary.length} {t('detail_itinerary_days_suffix')}
              </span>
            </div>

            <div className="space-y-6">
              {itinerary.map((item) => (
                <div
                  key={item.day}
                  className="relative rounded-2xl border border-neutral-200/90 bg-neutral-50/50 p-5 sm:p-6 transition hover:shadow-md hover:border-black/40"
                >
                  {/* Day header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center rounded-xl bg-black text-white font-black text-xs px-3 py-1.5 shrink-0 shadow-sm">
                        {t('detail_day_prefix')} {item.day}
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-black tracking-tight leading-snug">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  {/* Day activities list */}
                  <ul className="mt-4 space-y-2.5">
                    {item.activities.map((act, actIdx) => (
                      <li key={actIdx} className="flex items-start gap-2.5 text-xs text-neutral-700 leading-relaxed font-normal">
                        <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Meal & Hotel badges */}
                  {(item.meals || item.stay) && (
                    <div className="mt-4 pt-3 border-t border-neutral-200/80 flex flex-wrap gap-2 text-[11px]">
                      {item.meals && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white border border-neutral-300 px-3 py-1 font-bold text-neutral-800 shadow-2xs">
                          <span className="text-amber-600 font-black">{t('detail_cuisine')}</span> {item.meals}
                        </span>
                      )}
                      {item.stay && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white border border-neutral-300 px-3 py-1 font-bold text-neutral-800 shadow-2xs">
                          <span className="text-amber-600 font-black">{t('detail_lodging')}</span> {item.stay}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Guarantees */}
          <section className="rounded-xl border border-black bg-white p-8">
            <h3 className="text-base font-black text-black uppercase mb-4">
              {t('detail_commit_title')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-black">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <span>{t('detail_commit_1')}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <span>{t('detail_commit_2')}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <span>{t('detail_commit_3')}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <span>{t('detail_commit_4')}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Quote Calculation & Booking Widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border-2 border-black bg-white p-6">
            <div className="flex items-center gap-2 pb-4 border-b border-black/10">
              <ShieldCheck className="h-5 w-5 text-black" />
              <h3 className="text-lg font-black text-black uppercase">
                {t('quote_title')}
              </h3>
            </div>

            {selectedSchedule ? (
              <div className="mt-6 space-y-6">
                <div>
                  <label className="text-xs font-black uppercase text-black mb-1.5">
                    {t('dep_date')}
                  </label>
                  <div className="rounded-lg border border-black p-3 text-sm font-black text-black bg-white">
                    {formatDate(selectedSchedule.departureAt)}
                  </div>
                </div>

                {/* Guest Selectors */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-black block">
                        {t('quote_adult')}
                      </span>
                      <span className="text-xs text-neutral-600">
                        {formatVND(selectedSchedule.adultPrice)} {t('card_per_guest')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={adults <= 1}
                        onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                        className="h-7 w-7 rounded border border-black flex items-center justify-center font-black text-black hover:bg-black hover:text-white disabled:opacity-30 transition"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-black text-sm text-black">{adults}</span>
                      <button
                        type="button"
                        disabled={adults >= 100}
                        onClick={() => setAdults((prev) => prev + 1)}
                        className="h-7 w-7 rounded border border-black flex items-center justify-center font-black text-black hover:bg-black hover:text-white disabled:opacity-30 transition"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-black/10">
                    <div>
                      <span className="text-xs font-black text-black block">
                        {t('quote_child')}
                      </span>
                      <span className="text-xs text-neutral-600">
                        {formatVND(selectedSchedule.childPrice)} {lang === 'en' ? '/ child' : '/ bé'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={childrenCount <= 0}
                        onClick={() => setChildrenCount((prev) => Math.max(0, prev - 1))}
                        className="h-7 w-7 rounded border border-black flex items-center justify-center font-black text-black hover:bg-black hover:text-white disabled:opacity-30 transition"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-black text-sm text-black">{childrenCount}</span>
                      <button
                        type="button"
                        disabled={childrenCount >= 100}
                        onClick={() => setChildrenCount((prev) => prev + 1)}
                        className="h-7 w-7 rounded border border-black flex items-center justify-center font-black text-black hover:bg-black hover:text-white disabled:opacity-30 transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="rounded-lg border border-black bg-white p-4 space-y-2 text-black">
                  <div className="flex justify-between text-xs font-medium text-black">
                    <span>{adults} × {lang === 'en' ? 'Adults:' : 'Người lớn:'}</span>
                    <span className="font-bold">
                      {formatVND(adults * (quote?.adultPrice ?? selectedSchedule.adultPrice))}
                    </span>
                  </div>
                  {childrenCount > 0 && (
                    <div className="flex justify-between text-xs font-medium text-black">
                      <span>{childrenCount} × {lang === 'en' ? 'Children:' : 'Trẻ em:'}</span>
                      <span className="font-bold">
                        {formatVND(childrenCount * (quote?.childPrice ?? selectedSchedule.childPrice))}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-black flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-black uppercase text-black block">{t('total_estimate')}</span>
                    </div>
                    <span className="text-xl font-black text-black">
                      {quoteLoading
                        ? '...'
                        : formatVND(
                            quote?.totalAmount ??
                              adults * selectedSchedule.adultPrice +
                                childrenCount * selectedSchedule.childPrice,
                          )}
                    </span>
                  </div>
                </div>

                {quoteError && (
                  <p role="alert" className="text-xs font-bold text-black border border-black p-2 rounded">
                    {quoteError}
                  </p>
                )}

                {/* Action CTA */}
                <Button
                  onClick={handleProceedCheckout}
                  disabled={quoteLoading || !quote || selectedSchedule.availableSeats < adults + childrenCount}
                  className="w-full bg-black hover:bg-neutral-800 text-white py-3 rounded text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <span>{t('btn_book_now')}</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </Button>

                <p className="text-[11px] text-center text-neutral-500 font-medium">
                  {t('detail_hold_hint')}
                </p>
              </div>
            ) : (
              <p className="mt-6 text-xs font-bold text-black uppercase text-center">
                {t('detail_select_date_hint')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
