'use client';

import { FormEvent, use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Booking, Payment } from '@tour/shared';
import { BOOKING_LABELS } from '@tour/shared';
import { adminApi } from '@/lib/api';
import { formatDate, formatDateTime, formatVND } from '@/lib/format';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Mail,
  Phone,
  RefreshCcw,
  User,
  X,
  XCircle,
} from 'lucide-react';

export default function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([adminApi.booking(id), adminApi.payments()])
      .then(([bookingData, paymentPage]) => {
        setBooking(bookingData);
        setPayments(paymentPage.items.filter((payment) => payment.bookingId === id));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải chi tiết đơn.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const canCancel = booking && !['CANCELLED', 'COMPLETED'].includes(booking.status);
  const primaryAction = useMemo(() => {
    if (booking?.status === 'PAID') return { status: 'CONFIRMED' as const, label: 'Xác nhận đơn' };
    if (booking?.status === 'CONFIRMED')
      return { status: 'COMPLETED' as const, label: 'Đánh dấu hoàn thành' };
    return null;
  }, [booking]);

  const transition = async () => {
    if (!primaryAction) return;
    setActing(true);
    setActionError(null);
    try {
      await adminApi.updateBookingStatus(id, primaryAction.status);
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái.');
    } finally {
      setActing(false);
    }
  };

  const cancel = async (event: FormEvent) => {
    event.preventDefault();
    if (cancelReason.trim().length < 3) return;
    setActing(true);
    setActionError(null);
    try {
      await adminApi.cancelBooking(id, cancelReason.trim());
      setCancelOpen(false);
      setCancelReason('');
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể hủy đơn.');
    } finally {
      setActing(false);
    }
  };

  return (
    <PageShell
      badge="BOOKING OPERATIONS"
      title={booking ? booking.tourTitle : 'Chi tiết đơn đặt'}
      description={
        booking ? `Mã đơn ${booking.id}` : 'Đọc dữ liệu booking trực tiếp từ backend quản trị.'
      }
      action={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="text-xs gap-1.5">
            <Link href="/admin/bookings">
              <ArrowLeft className="h-4 w-4" /> Danh sách đơn
            </Link>
          </Button>
          <Button variant="outline" onClick={load} className="text-xs gap-1.5">
            <RefreshCcw className="h-4 w-4" /> Tải lại
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="h-64 animate-pulse rounded-3xl border bg-white" />
      ) : error || !booking ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
          <AlertCircle className="mx-auto mb-3 h-9 w-9 text-red-700" />
          <p className="font-bold text-red-900">{error ?? 'Không tìm thấy booking.'}</p>
          <Button variant="outline" onClick={load} className="mt-4">
            Thử lại
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {actionError && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700"
            >
              {actionError}
            </p>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                    Trạng thái
                  </div>
                  <div className="mt-1 text-lg font-black text-stone-950">
                    {BOOKING_LABELS[booking.status]}
                  </div>
                </div>
                <div className="flex gap-2">
                  {primaryAction && (
                    <Button
                      disabled={acting}
                      onClick={() => void transition()}
                      className="bg-stone-950 text-white"
                    >
                      {primaryAction.label}
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      disabled={acting}
                      variant="outline"
                      onClick={() => setCancelOpen(true)}
                      className="border-red-200 text-red-700"
                    >
                      Hủy đơn
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 text-xs sm:grid-cols-2">
                <Info
                  icon={<User className="h-4 w-4" />}
                  label="Khách hàng"
                  value={booking.contactName}
                />
                <Info
                  icon={<Phone className="h-4 w-4" />}
                  label="Điện thoại"
                  value={booking.contactPhone}
                />
                <Info
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  value={booking.contactEmail}
                />
                <Info label="Ngày đặt" value={formatDateTime(booking.createdAt)} />
                <Info label="Ngày khởi hành" value={formatDate(booking.departureAt)} />
                <Info label="Tổng tiền" value={formatVND(booking.totalAmount)} />
                <Info
                  label="Số khách"
                  value={`${booking.adults} người lớn • ${booking.children} trẻ em`}
                />
                <Info label="Hạn giữ chỗ" value={formatDateTime(booking.expiresAt)} />
              </div>

              {booking.cancelReason && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                  <strong>Lý do hủy:</strong> {booking.cancelReason}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="font-black text-stone-950">Chi tiết giá snapshot</h2>
              <div className="mt-4 space-y-3 text-xs">
                {booking.details.map((detail) => (
                  <div key={detail.kind} className="flex justify-between gap-4 border-b pb-3">
                    <span>
                      {detail.kind === 'ADULT' ? 'Người lớn' : 'Trẻ em'} × {detail.quantity}
                    </span>
                    <span className="font-bold">{formatVND(detail.lineTotal)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1 text-sm font-black">
                  <span>Tổng</span>
                  <span>{formatVND(booking.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <h2 className="font-black">Giao dịch liên quan</h2>
            </div>
            {payments.length === 0 ? (
              <p className="text-xs text-stone-500">Chưa có payment record cho booking này.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="border-b text-[10px] uppercase text-stone-500">
                    <tr>
                      <th className="py-3">Provider</th>
                      <th>Trạng thái</th>
                      <th>Số tiền</th>
                      <th>Khởi tạo</th>
                      <th>Mã payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="py-3 font-bold">{payment.provider}</td>
                        <td>{payment.status}</td>
                        <td>{formatVND(payment.amount)}</td>
                        <td>{formatDateTime(payment.createdAt)}</td>
                        <td className="font-mono text-[10px]">{payment.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {cancelOpen && booking && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={cancel}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">Hủy booking</h2>
              <button type="button" onClick={() => setCancelOpen(false)} aria-label="Đóng">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-stone-600">
              Vận hành phải ghi lý do để lưu audit và đối soát.
            </p>
            <textarea
              required
              minLength={3}
              maxLength={500}
              rows={4}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-4 w-full"
              placeholder="Lý do hủy..."
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
                Đóng
              </Button>
              <Button type="submit" disabled={acting} className="bg-red-700 text-white">
                {acting ? 'Đang hủy...' : 'Xác nhận hủy'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </PageShell>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-stone-50 p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-stone-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 break-words font-semibold text-stone-900">{value}</div>
    </div>
  );
}
