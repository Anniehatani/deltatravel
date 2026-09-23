'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { bookingApi, paymentApi } from '@/lib/api';
import type { Booking, Provider } from '@tour/shared';
import { BOOKING_LABELS } from '@tour/shared';
import { formatVND, formatDate, formatDateTime } from '@/lib/format';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Phone,
  Mail,
  User,
  RefreshCcw,
  ArrowLeft,
  Banknote,
  Building2,
  MapPin,
  Sparkles,
  Wallet,
  Coins,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '@/providers/language-provider';

type PaymentMethod = Provider | 'DIRECT';

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  badge?: string;
  desc: string;
  icon: React.ReactNode;
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.id;
  const router = useRouter();
  const { t, lang } = useLanguage();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paymentOptions: PaymentOption[] = [
    {
      id: 'DIRECT',
      label: t('bk_pay_direct_label'),
      desc: t('bk_pay_direct_desc'),
      icon: <Banknote className="h-5 w-5 text-emerald-600" />,
    },
    {
      id: 'VNPAY',
      label: t('bk_pay_vnpay_label'),
      desc: t('bk_pay_vnpay_desc'),
      icon: <CreditCard className="h-5 w-5 text-blue-600" />,
    },
    {
      id: 'MOMO',
      label: t('bk_pay_momo_label'),
      desc: t('bk_pay_momo_desc'),
      icon: <Wallet className="h-5 w-5 text-pink-600" />,
    },
    {
      id: 'ZALOPAY',
      label: t('bk_pay_zalopay_label'),
      desc: t('bk_pay_zalopay_desc'),
      icon: <Coins className="h-5 w-5 text-cyan-600" />,
    },
  ];

  const suggestedCancelReasons = lang === 'en'
    ? [
        'Change in business or personal schedule',
        'Unexpected family emergency',
        'Wrong departure date or guest count',
        'Prefer to switch to another tour package',
        'Health reasons or personal circumstances',
      ]
    : [
        'Thay đổi lịch trình công tác / cá nhân',
        'Có việc gia đình bận đột xuất',
        'Đặt nhầm số lượng khách hoặc ngày khởi hành',
        'Muốn chuyển sang hành trình tour khác',
        'Lý do sức khỏe hoặc phát sinh riêng',
      ];

  // Countdown timer logic
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);

  // Payment processing state
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('DIRECT');
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [directPaymentSuccess, setDirectPaymentSuccess] = useState(false);

  // Cancel booking modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Delete booking modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchBooking = () => {
    setLoading(true);
    setError(null);
    bookingApi
      .get(bookingId)
      .then((data) => {
        setBooking(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không thể tải chi tiết đơn hàng.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Accurate countdown based on expiresAt and serverTime
  useEffect(() => {
    if (!booking || booking.status !== 'PENDING_PAYMENT') {
      setTimeLeftMs(null);
      return;
    }

    const expiresTime = new Date(booking.expiresAt).getTime();
    const serverTime = new Date(booking.serverTime).getTime();
    const mountClientTime = performance.now();

    const updateTimer = () => {
      const elapsedSinceMount = performance.now() - mountClientTime;
      const currentSimulatedTime = serverTime + elapsedSinceMount;
      const remaining = Math.max(0, expiresTime - currentSimulatedTime);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        fetchBooking();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  const handlePay = async () => {
    if (!booking) return;
    setPaying(true);
    setPaymentError(null);

    // Direct Payment Flow
    if (selectedMethod === 'DIRECT') {
      try {
        const updated: Booking = {
          ...booking,
          status: 'CONFIRMED',
          paidAt: new Date().toISOString(),
        };

        if (typeof window !== 'undefined') {
          try {
            const items: Booking[] = JSON.parse(localStorage.getItem('tour_local_bookings') || '[]');
            const idx = items.findIndex((b) => b.id === booking.id);
            if (idx !== -1) {
              items[idx] = updated;
            } else {
              items.push(updated);
            }
            localStorage.setItem('tour_local_bookings', JSON.stringify(items));
          } catch {}
        }

        setBooking(updated);
        setDirectPaymentSuccess(true);
      } catch (err) {
        setPaymentError('Không thể xác nhận thanh toán trực tiếp. Vui lòng thử lại.');
      } finally {
        setPaying(false);
      }
      return;
    }

    // Online Gateway Payment Flow (VNPay, MoMo, ZaloPay)
    try {
      const payment = await paymentApi.create({
        bookingId: booking.id,
        provider: selectedMethod,
      });

      if (payment.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
      } else {
        setPaymentError('Không nhận được liên kết thanh toán từ cổng.');
      }
    } catch (err) {
      setPaymentError(
        err instanceof Error
          ? err.message
          : 'Cổng thanh toán chưa sẵn sàng hoặc gặp sự cố kết nối.',
      );
    } finally {
      setPaying(false);
    }
  };

  const handleCancelBooking = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!booking) return;

    setCancelling(true);
    setCancelError(null);

    const reason = cancelReason.trim() || 'Khách hàng yêu cầu hủy đơn';

    try {
      const updated = await bookingApi.cancel(booking.id, reason);
      setBooking(updated);
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err) {
      setCancelError(
        err instanceof Error ? err.message : 'Không thể hủy đơn. Vui lòng thử lại sau.',
      );
    } finally {
      setCancelling(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!booking) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await bookingApi.delete(booking.id);
      router.push('/bookings');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Không thể xóa đơn.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded bg-stone-200" />
          <div className="h-48 rounded-2xl bg-stone-100" />
          <div className="h-64 rounded-2xl bg-stone-100" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="rounded-2xl border border-stone-200 bg-white p-12 shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-stone-400 mb-4" />
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            {t('bk_detail_not_found')}
          </h2>
          <p className="mt-2 text-sm text-stone-600 mb-6">
            {error || t('bk_detail_not_found_desc')}
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={fetchBooking} className="gap-2">
              <RefreshCcw className="h-4 w-4" /> {t('bk_detail_retry')}
            </Button>
            <Button asChild className="bg-stone-900 text-white">
              <Link href="/bookings">{t('bk_detail_back')}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isPending = booking.status === 'PENDING_PAYMENT';
  const isPaid = booking.status === 'PAID';
  const isConfirmed = booking.status === 'CONFIRMED';
  const isCancelled = booking.status === 'CANCELLED';
  const canCancel = !isCancelled && booking.status !== 'COMPLETED';

  const statusKeyMap: Record<string, string> = {
    PENDING_PAYMENT: 'bk_status_pending_label',
    PAID: 'bk_status_paid_label',
    CONFIRMED: 'bk_status_confirmed_label',
    COMPLETED: 'bk_status_completed_label',
    CANCELLED: 'bk_status_cancelled_label',
  };
  const statusLabel = statusKeyMap[booking.status] ? t(statusKeyMap[booking.status]) : booking.status;

  const formatCountdown = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <PageShell
      badge={t('bk_detail_badge')}
      title={booking.tourTitle}
      description={`${t('bk_code_prefix')} ${booking.id} · ${t('bk_created_prefix')} ${formatDateTime(booking.createdAt)}`}
      action={
        <div className="flex items-center gap-2.5">
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(true)}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 text-xs font-bold gap-1.5 shadow-sm"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>{t('bk_btn_cancel')}</span>
            </Button>
          )}

          {isCancelled && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              className="text-red-700 border-red-300 bg-red-50 hover:bg-red-100 text-xs font-bold gap-1.5 shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t('bk_btn_delete')}</span>
            </Button>
          )}

          <Button asChild variant="outline" className="gap-2 text-xs">
            <Link href="/bookings">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t('bk_detail_back')}</span>
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Booking Details & Contact Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Status Alert Banner */}
          {isPending && (
            <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-black text-sm uppercase tracking-wide">
                      {t('bk_status_pending_title')}
                    </h3>
                    <p className="text-xs text-neutral-600 mt-0.5 font-medium">
                      {t('bk_status_pending_sub')}
                    </p>
                  </div>
                </div>

                {timeLeftMs !== null && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-black tracking-widest text-neutral-400 block">
                      {t('bk_status_remaining')}
                    </span>
                    <span className="font-mono text-2xl font-black text-amber-600">
                      {formatCountdown(timeLeftMs)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {isConfirmed && (
            <div className="rounded-2xl border-2 border-emerald-600 bg-emerald-50/80 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-emerald-950 text-base uppercase">
                    {t('bk_status_confirmed_title')}
                  </h3>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    {t('bk_status_confirmed_sub')}
                  </p>
                  <div className="mt-3 pt-3 border-t border-emerald-200 text-xs text-emerald-900 font-semibold flex flex-wrap gap-4">
                    <span>{t('bk_office_locations')}</span>
                    <span>Hotline: 1900 6868</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isPaid && (
            <div className="rounded-2xl border-2 border-black bg-black text-white p-6 shadow-sm flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-amber-300 shrink-0" />
              <div>
                <h3 className="font-black text-white text-sm uppercase">{t('bk_status_paid_title')}</h3>
                <p className="text-xs text-neutral-300 mt-0.5">
                  {t('bk_status_paid_sub')}
                </p>
              </div>
            </div>
          )}

          {isCancelled && (
            <>
              <div className="rounded-2xl border-2 border-dashed border-red-300 bg-red-50/50 p-6 flex items-start gap-4">
                <XCircle className="h-7 w-7 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-black text-red-900 text-sm uppercase">{t('bk_status_cancelled_title')}</h3>
                  <p className="text-xs text-red-700 mt-0.5">
                    {t('bk_reason_prefix')} <strong>{booking.cancelReason || t('bk_default_cancel_reason')}</strong>
                  </p>
                  <p className="text-xs text-neutral-500 mt-2">
                    {t('bk_status_cancelled_sub')}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">{t('bk_delete_box_title')}</h4>
                    <p className="text-xs text-neutral-500 mt-0.5">{t('bk_delete_box_desc')}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full px-6 py-2.5 gap-2 shrink-0 shadow-sm transition"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{t('bk_btn_delete')}</span>
                </Button>
              </div>
            </>
          )}

          {/* Departure & Schedule Summary */}
          <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-luxury">
            <h2 className="font-serif text-xl font-bold text-stone-900 mb-6 flex items-center gap-2 pb-4 border-b border-stone-100">
              <Calendar className="h-5 w-5 text-amber-700" />
              <span>{t('bk_itinerary_title')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-[#faf9f5] border border-stone-200/70">
                <span className="text-xs text-stone-500 block">{t('bk_dep_date_label')}</span>
                <span className="font-semibold text-stone-900 text-base mt-1 block">
                  {formatDate(booking.departureAt)}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#faf9f5] border border-stone-200/70">
                <span className="text-xs text-stone-500 block">{t('bk_guest_count_label')}</span>
                <span className="font-semibold text-stone-900 text-base mt-1 block">
                  {booking.adults} {t('bk_adult_unit')} {booking.children > 0 && `, ${booking.children} ${t('bk_child_unit')}`}
                </span>
              </div>
            </div>

            {/* Price Line Breakdown */}
            <div className="mt-6 border-t border-stone-100 pt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">
                {t('bk_financial_breakdown')}
              </h4>
              <div className="space-y-3">
                {booking.details.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-stone-600">
                      {item.kind === 'ADULT' ? t('bk_ticket_adult') : t('bk_ticket_child')} × {item.quantity}
                    </span>
                    <span className="font-semibold text-stone-900">
                      {formatVND(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Representative */}
          <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-luxury">
            <h2 className="font-serif text-xl font-bold text-stone-900 mb-4 flex items-center gap-2 pb-4 border-b border-stone-100">
              <User className="h-5 w-5 text-amber-700" />
              <span>{t('bk_rep_info')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-600">
              <div>
                <span className="text-stone-400 block mb-1">{t('bk_rep_name')}</span>
                <strong className="text-stone-900 text-sm">{booking.contactName}</strong>
              </div>
              <div>
                <span className="text-stone-400 block mb-1">{t('bk_rep_email')}</span>
                <strong className="text-stone-900 text-sm">{booking.contactEmail}</strong>
              </div>
              <div>
                <span className="text-stone-400 block mb-1">{t('bk_rep_phone')}</span>
                <strong className="text-stone-900 text-sm">{booking.contactPhone}</strong>
              </div>
            </div>
          </div>

          {/* Cancellation Section */}
          {canCancel && (
            <div className="rounded-2xl border border-red-100 bg-red-50/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-red-950 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>{t('bk_cancel_box_title')}</span>
                </h4>
                <p className="text-xs text-neutral-600 mt-1">
                  {t('bk_cancel_box_desc')}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(true)}
                className="text-red-700 border-red-300 hover:bg-red-100 text-xs font-bold shrink-0"
              >
                {t('bk_cancel_box_btn')}
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Payment & Total Amount */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-luxury space-y-6">
            <div className="pb-4 border-b border-stone-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                {t('bk_total_summary')}
              </span>
              <span className="font-serif text-3xl font-bold text-amber-900 block mt-1">
                {formatVND(booking.totalAmount)}
              </span>
              <span className="text-xs text-stone-500 mt-1 block">
                {t('bk_status_label')}{' '}
                <strong className={isConfirmed ? 'text-emerald-700' : isCancelled ? 'text-red-600' : 'text-stone-900'}>
                  {statusLabel}
                </strong>
              </span>
            </div>

            {/* Payment Method Selector (When PENDING_PAYMENT) */}
            {isPending && (
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-wider text-stone-700 block">
                  {t('bk_payment_method_label')}
                </label>

                <div className="space-y-3">
                  {paymentOptions.map((opt) => {
                    const isSelected = selectedMethod === opt.id;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedMethod(opt.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-black bg-stone-50 shadow-sm ring-1 ring-black'
                            : 'border-stone-200 hover:border-stone-400 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {opt.icon}
                            <span className="font-bold text-xs sm:text-sm text-stone-900">
                              {opt.label}
                            </span>
                          </div>
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={isSelected}
                            onChange={() => setSelectedMethod(opt.id)}
                            className="w-4 h-4 text-black cursor-pointer"
                          />
                        </div>
                        {opt.badge && (
                          <span className="inline-block mt-1 text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {opt.badge}
                          </span>
                        )}
                        <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                          {opt.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {paymentError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 flex items-start gap-2" role="alert">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <Button
                  onClick={handlePay}
                  disabled={paying}
                  className={`w-full py-4 rounded-full shadow-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    selectedMethod === 'DIRECT'
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      : 'bg-black hover:bg-neutral-800 text-white'
                  }`}
                >
                  {selectedMethod === 'DIRECT' ? (
                    <>
                      <Banknote className="h-4 w-4 text-emerald-200" />
                      <span>{paying ? t('bk_confirming') : t('bk_confirm_direct')}</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 text-amber-300" />
                      <span>{paying ? t('bk_connecting_gateway') : `${t('bk_pay_via')} ${selectedMethod}`}</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Direct payment instructions */}
            <div className="pt-2 text-stone-600 text-[11px] leading-relaxed border-t border-stone-100 space-y-2">
              <div className="flex items-start gap-1.5">
                <Building2 className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>{t('bk_office_network')}</strong> {t('bk_office_locations')}
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{t('bk_hotline_support')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal Confirmation */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 sm:p-8 shadow-2xl border border-stone-200 animate-fade-in-scale">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  {t('bk_cancel_modal_title')}
                </h3>
                <span className="text-xs text-neutral-500">{t('bk_code_prefix')} {booking.id.slice(0, 13)}...</span>
              </div>
            </div>

            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              {t('bk_cancel_modal_warning')}
            </p>

            <form onSubmit={handleCancelBooking} className="space-y-4">
              <div>
                <label htmlFor="cancelReason" className="text-xs font-bold text-stone-800 block mb-1">
                  {t('bk_cancel_reason_label')}
                </label>

                {/* Quick suggestion chips */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {suggestedCancelReasons.map((r, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCancelReason(r)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                        cancelReason === r
                          ? 'bg-black text-white border-black font-semibold'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <textarea
                  id="cancelReason"
                  rows={3}
                  placeholder={t('bk_cancel_reason_placeholder')}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {cancelError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                  {cancelError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="text-xs rounded-full px-5"
                >
                  {t('bk_cancel_btn_close')}
                </Button>
                <Button
                  type="submit"
                  disabled={cancelling}
                  className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-full px-6 shadow-md"
                >
                  {cancelling ? t('bk_cancelling') : t('bk_cancel_btn_confirm')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 sm:p-8 shadow-2xl border border-stone-200 animate-fade-in-scale text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
              {t('bk_delete_modal_title')}
            </h3>
            <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
              {t('bk_delete_modal_desc')}
            </p>

            {deleteError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                {deleteError}
              </div>
            )}

            <div className="flex justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="text-xs rounded-full px-5"
              >
                {t('bk_cancel_btn_close')}
              </Button>
              <Button
                type="button"
                onClick={handleDeleteBooking}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full px-6 shadow-md"
              >
                {deleting ? t('bk_deleting') : t('bk_btn_delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
