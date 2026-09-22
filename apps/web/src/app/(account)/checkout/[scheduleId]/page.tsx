'use client';

import { Suspense, useEffect, useState, use, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAvailability } from '@/hooks/use-availability';
import { bookingApi } from '@/lib/api';
import type { z } from 'zod';
import { useAuth } from '@/providers/auth-provider';
import type { QuoteResultSchema } from '@tour/shared';
import { formatVND, formatDate } from '@/lib/format';

type QuoteResult = z.infer<typeof QuoteResultSchema>;

import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Users,
  ShieldCheck,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

function CheckoutContent({ scheduleId }: { scheduleId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const initialAdults = Math.max(1, parseInt(searchParams.get('adults') || '2', 10));
  const initialChildren = Math.max(0, parseInt(searchParams.get('children') || '0', 10));

  const [adults, setAdults] = useState<number>(initialAdults);
  const [childrenCount, setChildrenCount] = useState<number>(initialChildren);

  const [contactName, setContactName] = useState(user?.name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState('');

  // Polling availability every 3 seconds
  const { data: schedule, error: availabilityError } = useAvailability(scheduleId);

  // Quote
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Submitting state & error
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Idempotency Key: maintained for network retry; regenerated only if party changes
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => crypto.randomUUID());

  // Regenerate key when adults or children change
  const partyKey = useMemo(() => `${adults}-${childrenCount}`, [adults, childrenCount]);
  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, [partyKey]);

  // Fetch official quote
  useEffect(() => {
    let active = true;
    setQuoteLoading(true);
    setQuoteError(null);

    bookingApi
      .quote({
        scheduleId,
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
          setQuoteError(err instanceof Error ? err.message : 'Không thể tính toán chi phí.');
        }
      })
      .finally(() => {
        if (active) setQuoteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [scheduleId, adults, childrenCount]);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await bookingApi.create(
        {
          scheduleId,
          adults,
          children: childrenCount,
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
        },
        idempotencyKey,
      );

      // Redirect immediately to booking detail page
      router.push(`/bookings/${result.id}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Không thể tạo đơn giữ chỗ. Cậu vui lòng kiểm tra lại thông tin.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const totalGuests = adults + childrenCount;
  const isSeatExceeded = schedule ? totalGuests > schedule.availableSeats : false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* Left: Contact Form & Passenger Config */}
      <div className="lg:col-span-2 space-y-8">
        <form onSubmit={handleSubmitBooking} className="space-y-8">
          {/* Passenger Count Selector */}
          <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-luxury">
            <h2 className="font-serif text-xl font-bold text-stone-900 mb-6 flex items-center gap-2 pb-4 border-b border-stone-100">
              <Users className="h-5 w-5 text-amber-700" />
              <span>Số Lượng Hành Khách</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-xl border border-stone-200 bg-[#faf9f5] p-5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-stone-900 block text-sm">Người lớn</span>
                  <span className="text-xs text-stone-500">Từ 12 tuổi trở lên</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={adults <= 1}
                    onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                    className="h-8 w-8 rounded-full border border-stone-300 bg-white flex items-center justify-center font-bold text-stone-700 disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-bold text-sm">{adults}</span>
                  <button
                    type="button"
                    disabled={adults >= 100}
                    onClick={() => setAdults((prev) => prev + 1)}
                    className="h-8 w-8 rounded-full border border-stone-300 bg-white flex items-center justify-center font-bold text-stone-700 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-[#faf9f5] p-5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-stone-900 block text-sm">Trẻ em</span>
                  <span className="text-xs text-stone-500">Dưới 12 tuổi</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={childrenCount <= 0}
                    onClick={() => setChildrenCount((prev) => Math.max(0, prev - 1))}
                    className="h-8 w-8 rounded-full border border-stone-300 bg-white flex items-center justify-center font-bold text-stone-700 disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-bold text-sm">{childrenCount}</span>
                  <button
                    type="button"
                    disabled={childrenCount >= 100}
                    onClick={() => setChildrenCount((prev) => prev + 1)}
                    className="h-8 w-8 rounded-full border border-stone-300 bg-white flex items-center justify-center font-bold text-stone-700 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Realtime availability badge */}
            <div className="mt-6 flex items-center justify-between text-xs px-1">
              <span className="text-stone-500">Kho chỗ khả dụng thời gian thực:</span>
              {availabilityError ? (
                <span className="font-medium text-amber-700">Chưa kiểm tra được chỗ</span>
              ) : schedule ? (
                <span
                  className={`font-semibold ${
                    isSeatExceeded ? 'text-neutral-500 line-through' : 'text-black'
                  }`}
                >
                  {schedule.availableSeats > 0
                    ? `Còn lại ${schedule.availableSeats} chỗ trống`
                    : 'Đã hết chỗ'}
                </span>
              ) : (
                <span className="text-stone-400">Đang kiểm tra kho chỗ...</span>
              )}
            </div>

            {isSeatExceeded && (
              <p role="alert" className="mt-2 text-xs text-red-600 font-medium">
                Số lượng khách ({totalGuests} người) vượt quá số chỗ khả dụng ({schedule?.availableSeats} chỗ). Vui lòng giảm số người.
              </p>
            )}
          </div>

          {/* Contact Information Form */}
          <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-luxury">
            <h2 className="font-serif text-xl font-bold text-stone-900 mb-2">
              Thông Tin Đại Diện Đặt Tour
            </h2>
            <p className="text-xs text-stone-500 mb-6">
              Hệ thống sẽ gửi xác nhận đặt chỗ và mã vé điện tử tới email và số điện thoại này.
            </p>

            <div className="space-y-5">
              <div>
                <label htmlFor="contactName">Họ và tên người đại diện *</label>
                <input
                  id="contactName"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Ví dụ: Nguyễn Minh Anh"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contactEmail">Địa chỉ Email *</label>
                  <input
                    id="contactEmail"
                    type="email"
                    required
                    placeholder="minhanh@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="contactPhone">Số điện thoại liên hệ *</label>
                  <input
                    id="contactPhone"
                    type="tel"
                    required
                    pattern="^(?:\+84|0)[0-9]{9,10}$"
                    placeholder="0912345678 hoặc +84912345678"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    Định dạng Việt Nam: 09... hoặc +84... (10 số)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-start gap-2" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Lock className="h-4 w-4 text-stone-400" />
              <span>Bảo mật dữ liệu cá nhân & Giao dịch Serializable</span>
            </div>

            <Button
              type="submit"
              disabled={
                submitting ||
                quoteLoading ||
                !quote ||
                isSeatExceeded ||
                !contactName ||
                !contactEmail ||
                !contactPhone
              }
              className="w-full sm:w-auto bg-stone-900 hover:bg-stone-800 text-white px-8 py-3 rounded-xl shadow-md text-sm font-semibold"
            >
              {submitting ? 'Đang khởi tạo đơn...' : 'Xác nhận giữ chỗ (15 phút)'}
            </Button>
          </div>
        </form>
      </div>

      {/* Right: Booking Summary Card */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-luxury">
          <h3 className="font-serif text-xl font-bold text-stone-900 pb-4 border-b border-stone-100">
            Tóm Tắt Giữ Chỗ
          </h3>

          <div className="mt-5 space-y-4 text-xs">
            {schedule && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#faf9f5] border border-stone-200/80">
                <Calendar className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-stone-900 block text-sm">
                    Khởi hành: {formatDate(schedule.departureAt)}
                  </span>
                  <span className="text-stone-500 mt-0.5 block">
                    Xuất phát tại Việt Nam
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2 py-3 border-y border-stone-100 text-stone-600">
              <div className="flex justify-between">
                <span>Người lớn ({adults} khách):</span>
                <span className="font-medium text-stone-900">
                  {quote ? formatVND(adults * quote.adultPrice) : '...'}
                </span>
              </div>
              {childrenCount > 0 && (
                <div className="flex justify-between">
                  <span>Trẻ em ({childrenCount} khách):</span>
                  <span className="font-medium text-stone-900">
                    {quote ? formatVND(childrenCount * quote.childPrice) : '...'}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-baseline justify-between">
              <div>
                <span className="font-semibold text-stone-900 block text-sm">Tổng thanh toán</span>
                <span className="text-[10px] text-stone-400">Đã bao gồm thuế & bảo hiểm</span>
              </div>
              <span className="font-serif text-2xl font-bold text-amber-900">
                {quoteLoading ? 'Đang tính...' : quote ? formatVND(quote.totalAmount) : '—'}
              </span>
            </div>

            {quoteError && <p className="text-xs text-red-600">{quoteError}</p>}

            <div className="mt-6 rounded-xl bg-amber-50/60 border border-amber-200/60 p-4 space-y-2 text-stone-600">
              <div className="flex items-center gap-1.5 font-semibold text-amber-900 text-xs">
                <Clock className="h-3.5 w-3.5" />
                <span>Quy định giữ chỗ 15 phút</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Sau khi nhấn nút xác nhận, hệ thống sẽ cấp mã đơn và giữ chỗ trong vòng 15 phút để bạn chọn cổng thanh toán an toàn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage({ params }: { params: Promise<{ scheduleId: string }> }) {
  const resolvedParams = use(params);
  const scheduleId = resolvedParams.scheduleId;

  return (
    <PageShell
      badge="Khóa Chỗ An Toàn"
      title="Thông Tin Đặt Chỗ"
      description="Kiểm tra thông tin hành khách và người đại diện để hoàn tất giữ chỗ 15 phút."
    >
      <Suspense fallback={<div className="p-12 text-center text-sm text-stone-500">Đang chuẩn bị trang đặt tour...</div>}>
        <CheckoutContent scheduleId={scheduleId} />
      </Suspense>
    </PageShell>
  );
}

