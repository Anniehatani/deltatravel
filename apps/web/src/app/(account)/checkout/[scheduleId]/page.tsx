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
import { useLanguage } from '@/providers/language-provider';
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
  const { t, lang } = useLanguage();

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
          setQuoteError(err instanceof Error ? err.message : (lang === 'en' ? 'Unable to calculate quote.' : 'Không thể tính toán chi phí.'));
        }
      })
      .finally(() => {
        if (active) setQuoteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [scheduleId, adults, childrenCount, lang]);

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
          : (lang === 'en' ? 'Unable to create reservation. Please review your details.' : 'Không thể tạo đơn giữ chỗ. Quý khách vui lòng kiểm tra lại thông tin.'),
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
              <span>{t('chk_passenger_section')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-xl border border-stone-200 bg-[#faf9f5] p-5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-stone-900 block text-sm">{t('bk_adult_unit')}</span>
                  <span className="text-xs text-stone-500">{t('chk_adult_desc')}</span>
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
                  <span className="font-semibold text-stone-900 block text-sm">{t('bk_child_unit')}</span>
                  <span className="text-xs text-stone-500">{t('chk_child_desc')}</span>
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
              <span className="text-stone-500">{t('chk_realtime_seats')}</span>
              {availabilityError ? (
                <span className="font-medium text-amber-700">{t('chk_cant_check_seats')}</span>
              ) : schedule ? (
                <span
                  className={`font-semibold ${
                    isSeatExceeded ? 'text-neutral-500 line-through' : 'text-black'
                  }`}
                >
                  {schedule.availableSeats > 0
                    ? `${t('chk_remaining_seats')} ${schedule.availableSeats} ${t('chk_seats_unit')}`
                    : t('chk_sold_out')}
                </span>
              ) : (
                <span className="text-stone-400">{t('chk_checking_seats')}</span>
              )}
            </div>

            {isSeatExceeded && (
              <p role="alert" className="mt-2 text-xs text-red-600 font-medium">
                {t('chk_seat_exceeded_detail')}
              </p>
            )}
          </div>

          {/* Contact Information Form */}
          <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-luxury">
            <h2 className="font-serif text-xl font-bold text-stone-900 mb-2">
              {t('chk_contact_section')}
            </h2>
            <p className="text-xs text-stone-500 mb-6">
              {t('chk_contact_sub')}
            </p>

            <div className="space-y-5">
              <div>
                <label htmlFor="contactName">{t('chk_rep_name_label')}</label>
                <input
                  id="contactName"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder={lang === 'en' ? 'e.g. John Doe' : 'Ví dụ: Nguyễn Minh Anh'}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contactEmail">{t('chk_rep_email_label')}</label>
                  <input
                    id="contactEmail"
                    type="email"
                    required
                    placeholder="guest@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="contactPhone">{t('chk_rep_phone_label')}</label>
                  <input
                    id="contactPhone"
                    type="tel"
                    required
                    pattern="^(?:\+84|0)[0-9]{9,10}$"
                    placeholder="0912345678"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    {t('chk_phone_format_hint')}
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
              <span>{t('chk_security_note')}</span>
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
              {submitting ? t('chk_holding') : t('chk_btn_hold')}
            </Button>
          </div>
        </form>
      </div>

      {/* Right: Booking Summary Card */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-luxury">
          <h3 className="font-serif text-xl font-bold text-stone-900 pb-4 border-b border-stone-100">
            {t('chk_summary_section')}
          </h3>

          <div className="mt-5 space-y-4 text-xs">
            {schedule && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#faf9f5] border border-stone-200/80">
                <Calendar className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-stone-900 block text-sm">
                    {t('chk_departure_prefix')} {formatDate(schedule.departureAt)}
                  </span>
                  <span className="text-stone-500 mt-0.5 block">
                    {t('chk_dep_location')}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2 py-3 border-y border-stone-100 text-stone-600">
              <div className="flex justify-between">
                <span>{t('bk_ticket_adult')} ({adults} {t('chk_seats_unit')}):</span>
                <span className="font-medium text-stone-900">
                  {formatVND(adults * (quote?.adultPrice ?? schedule?.adultPrice ?? 0))}
                </span>
              </div>
              {childrenCount > 0 && (
                <div className="flex justify-between">
                  <span>{t('bk_ticket_child')} ({childrenCount} {t('chk_seats_unit')}):</span>
                  <span className="font-medium text-stone-900">
                    {formatVND(childrenCount * (quote?.childPrice ?? schedule?.childPrice ?? 0))}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-baseline justify-between">
              <div>
                <span className="font-semibold text-stone-900 block text-sm">{t('bk_total_summary')}</span>
                <span className="text-[10px] text-stone-400">{t('chk_tax_included')}</span>
              </div>
              <span className="font-serif text-2xl font-bold text-amber-900">
                {quoteLoading
                  ? t('chk_calculating')
                  : quote
                  ? formatVND(quote.totalAmount)
                  : schedule
                  ? formatVND(adults * schedule.adultPrice + childrenCount * schedule.childPrice)
                  : '—'}
              </span>
            </div>

            {quoteError && <p className="text-xs text-red-600">{quoteError}</p>}

            <div className="mt-6 rounded-xl bg-amber-50/60 border border-amber-200/60 p-4 space-y-2 text-stone-600">
              <div className="flex items-center gap-1.5 font-semibold text-amber-900 text-xs">
                <Clock className="h-3.5 w-3.5" />
                <span>{t('chk_hold_rule_title')}</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {t('chk_hold_rule_desc')}
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
  const { t } = useLanguage();

  return (
    <PageShell
      badge={t('chk_shell_badge')}
      title={t('chk_shell_title')}
      description={t('chk_shell_desc')}
    >
      <Suspense fallback={<div className="p-12 text-center text-sm text-stone-500">{t('chk_loading_page')}</div>}>
        <CheckoutContent scheduleId={scheduleId} />
      </Suspense>
    </PageShell>
  );
}

