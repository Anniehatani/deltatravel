'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { bookingApi } from '@/lib/api';
import type { Booking } from '@tour/shared';
import { BOOKING_LABELS } from '@tour/shared';
import { formatVND, formatDate } from '@/lib/format';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import {
  Ticket,
  Calendar,
  Users,
  Clock,
  ArrowRight,
  Compass,
  RefreshCcw,
  CreditCard,
} from 'lucide-react';

const STATUS_COLOR_MAP: Record<string, string> = {
  PENDING_PAYMENT: 'bg-white text-black border border-black',
  PAID: 'bg-black text-white border border-black',
  CONFIRMED: 'bg-black text-white border border-black',
  COMPLETED: 'bg-black text-white border border-black',
  CANCELLED: 'bg-white text-neutral-500 border border-dashed border-neutral-400',
};

export default function BookingsListPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = () => {
    setLoading(true);
    setError(null);
    bookingApi
      .list()
      .then((res) => {
        setBookings(res.items);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách đơn.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <PageShell
      badge="Hồ Sơ Đơn Hàng"
      title="Đơn Của Tôi"
      description="Theo dõi tình trạng giữ chỗ, thời hạn thanh toán và lịch sử các chuyến du ngoạn."
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
            <RefreshCcw className="h-4 w-4" /> Thử lại
          </Button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-14 text-center">
          <Ticket className="mx-auto h-12 w-12 text-stone-400 mb-3" />
          <h3 className="font-serif text-xl font-bold text-stone-900">
            Bạn chưa có đơn đặt tour nào
          </h3>
          <p className="mt-2 text-sm text-stone-500 max-w-md mx-auto">
            Hãy khám phá các danh thắng và điểm đến hấp dẫn trên khắp 3 miền Việt Nam để bắt đầu chuyến đi của bạn.
          </p>
          <Button asChild className="mt-6 bg-stone-900 hover:bg-black text-white rounded-lg">
            <Link href="/tours">Khám phá tour ngay</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {bookings.map((booking) => {
            const statusLabel = BOOKING_LABELS[booking.status] || booking.status;
            const badgeClass =
              STATUS_COLOR_MAP[booking.status] || 'bg-stone-100 text-stone-800 border-stone-200';

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
                      Mã: {booking.id.slice(0, 8)}...
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-amber-900 transition">
                    {booking.tourTitle}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-stone-400" />
                      Khởi hành: <strong className="text-stone-800">{formatDate(booking.departureAt)}</strong>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-stone-400" />
                      {booking.adults} Người lớn {booking.children > 0 && `, ${booking.children} Trẻ em`}
                    </span>
                    <span>·</span>
                    <span>
                      Tạo lúc: {formatDate(booking.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Pricing & Action */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-4 md:pt-0 border-stone-100 gap-3">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                      Tổng tiền
                    </span>
                    <span className="font-serif text-xl font-bold text-amber-900">
                      {formatVND(booking.totalAmount)}
                    </span>
                  </div>

                  <Link
                    href={`/bookings/${booking.id}`}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition shadow-sm ${
                      booking.status === 'PENDING_PAYMENT'
                        ? 'bg-amber-700 text-white hover:bg-amber-800'
                        : 'bg-stone-900 text-white hover:bg-stone-800'
                    }`}
                  >
                    <span>{booking.status === 'PENDING_PAYMENT' ? 'Thanh toán ngay' : 'Chi tiết đơn'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

