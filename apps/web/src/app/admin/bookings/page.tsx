'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import type { Booking } from '@tour/shared';
import { BOOKING_LABELS } from '@tour/shared';
import { formatVND, formatDate, formatDateTime } from '@/lib/format';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import {
  Ticket,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Calendar,
  Phone,
  User,
  AlertCircle,
  X,
} from 'lucide-react';

const STATUS_BADGE_STYLE: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-900 border-amber-300',
  PAID: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  CONFIRMED: 'bg-blue-100 text-blue-900 border-blue-300',
  COMPLETED: 'bg-stone-100 text-stone-800 border-stone-300',
  CANCELLED: 'bg-red-100 text-red-900 border-red-300',
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancel Modal
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchBookings = () => {
    setLoading(true);
    setError(null);
    adminApi
      .bookings()
      .then((res) => {
        setBookings(res.items);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách đơn đặt.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'CONFIRMED' | 'COMPLETED') => {
    try {
      await adminApi.updateBookingStatus(id, status);
      fetchBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái đơn.');
    }
  };

  const handleAdminCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalId || cancelReason.trim().length < 3) return;

    setCancelling(true);
    setCancelError(null);

    try {
      await adminApi.cancelBooking(cancelModalId, cancelReason.trim());
      setCancelModalId(null);
      setCancelReason('');
      fetchBookings();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Không thể hủy đơn.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <PageShell
      badge="Điều Hành Đơn Đặt"
      title="Danh Sách Đơn Đặt Toàn Hệ Thống"
      description="Giám sát đơn giữ chỗ, xác nhận các đơn đã thanh toán và chuyển trạng thái hoàn thành."
      action={
        <Button variant="outline" onClick={fetchBookings} className="text-xs gap-1.5">
          <RefreshCcw className="h-3.5 w-3.5" />
          <span>Tải lại</span>
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white border p-6 h-24" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-stone-700 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchBookings}>Thử lại</Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/80 bg-white shadow-luxury">
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-[#faf9f5] text-stone-500 font-semibold uppercase tracking-wider border-b border-stone-200/80">
              <tr>
                <th className="py-4 px-6">Mã đơn & Tour</th>
                <th className="py-4 px-6">Khách hàng</th>
                <th className="py-4 px-6">Khởi hành</th>
                <th className="py-4 px-6">Tổng tiền</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6 text-right">Thao tác vận hành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {bookings.map((booking) => {
                const label = BOOKING_LABELS[booking.status] || booking.status;
                const badge = STATUS_BADGE_STYLE[booking.status] || 'bg-stone-100 text-stone-800';

                return (
                  <tr key={booking.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-4 px-6">
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="font-bold text-stone-900 hover:text-amber-800 transition block"
                      >
                        {booking.tourTitle}
                      </Link>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {booking.id}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <strong className="text-stone-900 block">{booking.contactName}</strong>
                      <span className="text-stone-500 text-[11px] block">{booking.contactPhone}</span>
                      <span className="text-stone-400 text-[10px] block">{booking.contactEmail}</span>
                    </td>
                    <td className="py-4 px-6 font-medium text-stone-800">
                      {formatDate(booking.departureAt)}
                      <span className="text-[11px] text-stone-500 block">
                        {booking.adults} Lớn · {booking.children} Trẻ
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-amber-900">
                      {formatVND(booking.totalAmount)}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${badge}`}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {booking.status === 'PAID' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                            className="bg-blue-700 hover:bg-blue-800 text-white text-[11px] h-7 px-2.5"
                          >
                            Xác nhận
                          </Button>
                        )}
                        {booking.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                            className="bg-stone-900 hover:bg-stone-800 text-white text-[11px] h-7 px-2.5"
                          >
                            Hoàn thành
                          </Button>
                        )}
                        {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCancelModalId(booking.id)}
                            className="text-red-700 border-red-200 hover:bg-red-50 text-[11px] h-7 px-2.5"
                          >
                            Hủy đơn
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-stone-200">
            <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
              Hủy Đơn Đặt Chỗ (Vận Hành)
            </h3>
            <p className="text-xs text-stone-600 mb-4">
              Hành động này sẽ hủy đơn và giải phóng kho chỗ đã giữ trên hệ thống.
            </p>

            <form onSubmit={handleAdminCancel} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700">Lý do hủy đơn * (tối thiểu 3 ký tự)</label>
                <textarea
                  rows={3}
                  required
                  minLength={3}
                  maxLength={500}
                  placeholder="Ghi rõ lý do hủy từ phía vận hành..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>

              {cancelError && (
                <p role="alert" className="text-red-700 font-medium">
                  {cancelError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setCancelModalId(null)}>
                  Đóng lại
                </Button>
                <Button type="submit" disabled={cancelling} className="bg-red-700 hover:bg-red-800 text-white">
                  {cancelling ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}

