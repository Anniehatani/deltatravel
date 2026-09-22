'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { z } from 'zod';
import { tourApi, bookingApi } from '@/lib/api';
import type { Tour, Schedule, QuoteResultSchema } from '@tour/shared';
import { formatVND, formatDate } from '@/lib/format';
import { useLanguage } from '@/providers/language-provider';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';

type QuoteResult = z.infer<typeof QuoteResultSchema>;

export default function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tourId = resolvedParams.id;
  const router = useRouter();
  const { t } = useLanguage();

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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 lg:px-8 bg-white">
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
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20 text-center bg-white">
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 lg:px-8 bg-white text-black">
      {/* Breadcrumb */}
      <nav aria-label="Điều hướng phân cấp" className="flex items-center gap-2 text-xs font-bold text-neutral-500 mb-6 uppercase tracking-wider">
        <Link href="/" className="hover:text-black transition">DELTA TRAVEL</Link>
        <ChevronRight className="h-3 w-3 text-black" />
        <Link href="/tours" className="hover:text-black transition">{t('nav_all_tours')}</Link>
        <ChevronRight className="h-3 w-3 text-black" />
        <span className="text-black truncate max-w-xs">{tour.title}</span>
      </nav>

      {/* Hero Tour Banner - Strict Monochrome */}
      <div className="rounded-2xl border-2 border-black bg-black text-white p-8 md:p-12 mb-12 shadow-sm">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1 rounded border border-white px-3 py-1 text-xs font-bold text-white">
              <MapPin className="h-3.5 w-3.5 text-white" />
              {tour.destination}
            </span>
            <span className="inline-flex items-center gap-1 rounded border border-white px-3 py-1 text-xs font-bold text-white">
              <Calendar className="h-3.5 w-3.5 text-white" />
              {tour.durationDays} {t('days')} {Math.max(1, tour.durationDays - 1)} {t('nights')}
            </span>
            <span className="text-xs font-bold text-neutral-300 uppercase">Xuất phát: Việt Nam</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white uppercase">
            {tour.title}
          </h1>

          <p className="mt-4 text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl font-normal">
            {tour.description}
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
                {schedules.length} Lịch mở bán
              </span>
            </div>

            {schedules.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-black rounded-xl">
                <Calendar className="mx-auto h-8 w-8 text-black mb-2" />
                <p className="text-sm font-bold text-black">
                  Hiện chưa có lịch khởi hành mở bán cho tour này.
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  Vui lòng chọn tour khác hoặc quay lại sau ít ngày.
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

          {/* Guarantees */}
          <section className="rounded-xl border border-black bg-white p-8">
            <h3 className="text-base font-black text-black uppercase mb-4">
              Cam Kết Dịch Vụ DELTA TRAVEL
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-black">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <span>Khách sạn & điểm lưu trú sạch sẽ, tiện nghi và đạt chuẩn chất lượng.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <span>Bảo hiểm du lịch trọn gói đầy đủ theo quy định cho mọi thành viên.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <span>Hướng dẫn viên tận tình, am hiểu văn hóa và phong tục từng vùng miền.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <span>Hỗ trợ chu đáo 24/7 trước, trong và sau suốt hành trình của bạn.</span>
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
                        {formatVND(selectedSchedule.adultPrice)} / khách
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
                        {formatVND(selectedSchedule.childPrice)} / bé
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
                    <span>{adults} × Người lớn:</span>
                    <span className="font-bold">{quote ? formatVND(adults * quote.adultPrice) : '...'}</span>
                  </div>
                  {childrenCount > 0 && (
                    <div className="flex justify-between text-xs font-medium text-black">
                      <span>{childrenCount} × Trẻ em:</span>
                      <span className="font-bold">{quote ? formatVND(childrenCount * quote.childPrice) : '...'}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-black flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-black uppercase text-black block">{t('total_estimate')}</span>
                    </div>
                    <span className="text-xl font-black text-black">
                      {quoteLoading ? '...' : quote ? formatVND(quote.totalAmount) : '—'}
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
                  Chỗ được khóa an toàn 15 phút. Xác nhận minh bạch theo tiền VND.
                </p>
              </div>
            ) : (
              <p className="mt-6 text-xs font-bold text-black uppercase text-center">
                Vui lòng chọn ngày khởi hành để tiếp tục.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
