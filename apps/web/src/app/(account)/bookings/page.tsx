'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { bookingApi } from '@/lib/api';
import type { Booking } from '@tour/shared';
import { BOOKING_LABELS } from '@tour/shared';
import { formatVND, formatDate } from '@/lib/format';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/providers/language-provider';
import {
  Ticket,
  Calendar,
  Users,
  Clock,
  ArrowRight,
  Compass,
  RefreshCcw,
  CreditCard,
  XCircle,
  Trash2,
} from 'lucide-react';

const STATUS_COLOR_MAP: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-900 border border-amber-300',
  PAID: 'bg-black text-white border border-black',
  CONFIRMED: 'bg-emerald-50 text-emerald-900 border border-emerald-300',
  COMPLETED: 'bg-black text-white border border-black',
  CANCELLED: 'bg-stone-100 text-neutral-500 border border-dashed border-stone-300',
};

export default function BookingsListPage() {
  const { t, lang } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const suggestedCancelReasons = lang === 'en'
    ? [
        'Change in business or personal schedule',
        'Unexpected family emergency',
        'Wrong departure date or guest count',
        'Prefer to switch to another tour package',
      ]
    : [
        'Thay đổi kế hoạch công tác / gia đình',
        'Có việc bận đột xuất',
        'Đặt nhầm ngày hoặc số lượng khách',
        'Muốn đổi sang hành trình khác',
      ];

  // Cancellation state
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Deletion state
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchBookings = () => {
    setLoading(true);
    setError(null);
    bookingApi
      .list()
      .then((res) => {
        setBookings(res.items);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : (lang === 'en' ? 'Unable to load bookings.' : 'Không thể tải danh sách đơn.'));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;

    setCancelling(true);
    setCancelError(null);

    const reason = cancelReason.trim() || (lang === 'en' ? 'User requested cancellation' : 'Người dùng yêu cầu hủy đơn');

    try {
      const updated = await bookingApi.cancel(cancelTarget.id, reason);
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? { ...b, status: 'CANCELLED', cancelReason: reason } : b)),
      );
      setCancelTarget(null);
      setCancelReason('');
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : (lang === 'en' ? 'Unable to cancel booking. Please try again.' : 'Không thể hủy đơn. Vui lòng thử lại sau.'));
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await bookingApi.delete(deleteTarget.id);
      setBookings((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : (lang === 'en' ? 'Unable to delete booking.' : 'Không thể xóa đơn hàng.'));
    } finally {
      setDeleting(false);
    }
  };

  const statusKeyMap: Record<string, string> = {
    PENDING_PAYMENT: 'bk_status_pending_label',
    PAID: 'bk_status_paid_label',
    CONFIRMED: 'bk_status_confirmed_label',
    COMPLETED: 'bk_status_completed_label',
    CANCELLED: 'bk_status_cancelled_label',
  };

  return (
    <PageShell
      badge={t('bk_list_badge')}
      title={t('bk_list_title')}
      description={t('bk_list_desc')}
    >
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-stone-200 bg-white p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="w-full md:w-2/3 space-y-2">
                <div className="h-6 w-1/3 rounded bg-stone-100" />
                <div className="h-4 w-1/2 rounded bg-stone-100" />
              </div>
              <div className="h-10 w-28 rounded bg-stone-100" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-medium text-stone-700 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchBookings} className="gap-2">
            <RefreshCcw className="h-4 w-4" /> {t('bk_detail_retry')}
          </Button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-14 text-center">
          <Ticket className="mx-auto h-12 w-12 text-stone-400 mb-3" />
          <h3 className="font-serif text-xl font-bold text-stone-900">
            {t('bk_empty_title')}
          </h3>
          <p className="mt-2 text-sm text-stone-500 max-w-md mx-auto">
            {t('bk_empty_desc')}
          </p>
          <Button asChild className="mt-6 bg-stone-900 hover:bg-black text-white rounded-lg">
            <Link href="/tours">{t('bk_explore_now')}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {bookings.map((booking) => {
            const statusLabel = statusKeyMap[booking.status] ? t(statusKeyMap[booking.status]) : (BOOKING_LABELS[booking.status] || booking.status);
            const badgeClass =
              STATUS_COLOR_MAP[booking.status] || 'bg-stone-100 text-stone-800 border-stone-200';
            const canCancel = booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED';

            return (
              <div
                key={booking.id}
                className="group rounded-2xl border border-stone-200/80 bg-white p-6 shadow-luxury hover:shadow-luxury-hover transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Booking Info */}
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeClass}`}
                    >
                      {statusLabel}
                    </span>
                    <span className="text-xs text-stone-400 font-mono">
                      {t('bk_code_prefix')} {booking.id.slice(0, 8)}...
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-amber-900 transition">
                    {booking.tourTitle}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-stone-400" />
                      {t('bk_dep_prefix')} <strong className="text-stone-800">{formatDate(booking.departureAt)}</strong>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-stone-400" />
                      {booking.adults} {t('bk_adult_unit')} {booking.children > 0 && `, ${booking.children} ${t('bk_child_unit')}`}
                    </span>
                    <span>·</span>
                    <span>
                      {t('bk_created_prefix')} {formatDate(booking.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Pricing & Actions */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-4 md:pt-0 border-stone-100 gap-3">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                      {t('bk_total_price')}
                    </span>
                    <span className="font-serif text-xl font-bold text-amber-900">
                      {formatVND(booking.totalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => {
                          setCancelTarget(booking);
                          setCancelReason('');
                          setCancelError(null);
                        }}
                        className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 rounded-xl transition border border-red-200"
                        title={t('bk_btn_cancel')}
                      >
                        {t('bk_btn_cancel')}
                      </button>
                    )}

                    {booking.status === 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget(booking);
                          setDeleteError(null);
                        }}
                        className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 rounded-xl transition border border-red-200 flex items-center gap-1.5"
                        title={t('bk_btn_delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{t('bk_btn_delete')}</span>
                      </button>
                    )}

                    <Link
                      href={`/bookings/${booking.id}`}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition shadow-sm ${
                        booking.status === 'PENDING_PAYMENT'
                          ? 'bg-amber-700 text-white hover:bg-amber-800'
                          : 'bg-stone-900 text-white hover:bg-stone-800'
                      }`}
                    >
                      <span>{booking.status === 'PENDING_PAYMENT' ? t('bk_btn_pay') : t('bk_btn_detail')}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Cancel Modal */}
      {cancelTarget && (
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
                <span className="text-xs text-neutral-500">{cancelTarget.tourTitle}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              {t('bk_cancel_modal_warning')}
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label htmlFor="modalCancelReason" className="text-xs font-bold text-stone-800 block mb-1">
                  {t('bk_cancel_reason_label')}
                </label>

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
                  id="modalCancelReason"
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
                  onClick={() => setCancelTarget(null)}
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
      {deleteTarget && (
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
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="text-xs rounded-full px-5"
              >
                {t('bk_cancel_btn_close')}
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
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
