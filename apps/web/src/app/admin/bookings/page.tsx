'use client';

import { useEffect, useState, useMemo, FormEvent } from 'react';
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
  Search,
  Download,
  Printer,
  X,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  Clock,
  ShieldCheck,
  CreditCard,
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

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Cancel Modal
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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

    const handleUpdate = () => {
      fetchBookings();
    };
    window.addEventListener('delta_bookings_updated', handleUpdate);
    return () => window.removeEventListener('delta_bookings_updated', handleUpdate);
  }, []);

  // Filter Bookings in real time
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = (b.id || '').toLowerCase().includes(q);
        const matchName = (b.contactName || '').toLowerCase().includes(q);
        const matchPhone = (b.contactPhone || '').toLowerCase().includes(q);
        const matchEmail = (b.contactEmail || '').toLowerCase().includes(q);
        const matchTour = (b.tourTitle || '').toLowerCase().includes(q);
        if (!matchId && !matchName && !matchPhone && !matchEmail && !matchTour) return false;
      }

      if (startDate) {
        const bDate = new Date(b.createdAt).getTime();
        const sDate = new Date(startDate).getTime();
        if (bDate < sDate) return false;
      }

      if (endDate) {
        const bDate = new Date(b.createdAt).getTime();
        const eDate = new Date(endDate).getTime() + 86400000; // End of that day
        if (bDate > eDate) return false;
      }

      return true;
    });
  }, [bookings, searchQuery, statusFilter, startDate, endDate]);

  // Financial Statement Summary (Real calculations)
  const statementSummary = useMemo(() => {
    const totalCount = filteredBookings.length;

    let revenueCollected = 0; // PAID, CONFIRMED, COMPLETED
    let pendingAmount = 0; // PENDING_PAYMENT
    let cancelledCount = 0;
    let completedCount = 0;

    filteredBookings.forEach((b) => {
      const amount = Number(b.totalAmount) || 0;
      if (b.status === 'PAID' || b.status === 'CONFIRMED' || b.status === 'COMPLETED') {
        revenueCollected += amount;
      }
      if (b.status === 'PENDING_PAYMENT') {
        pendingAmount += amount;
      }
      if (b.status === 'CANCELLED') {
        cancelledCount += 1;
      }
      if (b.status === 'COMPLETED') {
        completedCount += 1;
      }
    });

    return {
      totalCount,
      revenueCollected,
      pendingAmount,
      cancelledCount,
      completedCount,
    };
  }, [filteredBookings]);

  const handleUpdateStatus = async (id: string, status: 'CONFIRMED' | 'COMPLETED') => {
    try {
      await adminApi.updateBookingStatus(id, status);
      showToast(
        status === 'CONFIRMED'
          ? 'Đã xác nhận đơn hàng thành công!'
          : 'Đã cập nhật đơn hàng thành trạng thái Hoàn thành!',
      );
      fetchBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái đơn.');
    }
  };

  const handleAdminCancel = async (e: FormEvent) => {
    e.preventDefault();
    if (!cancelModalId || cancelReason.trim().length < 3) return;

    setCancelling(true);
    setCancelError(null);

    try {
      await adminApi.cancelBooking(cancelModalId, cancelReason.trim());
      showToast('Đã hủy đơn hàng và cập nhật sao kê thành công.');
      setCancelModalId(null);
      setCancelReason('');
      fetchBookings();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Không thể hủy đơn.');
    } finally {
      setCancelling(false);
    }
  };

  // Export Financial Statement CSV
  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      alert('Không có dữ liệu đơn hàng để xuất sao kê.');
      return;
    }

    const headers = [
      'Mã Đơn',
      'Tên Khách Hàng',
      'Số Điện Thoại',
      'Email',
      'Tên Tour',
      'Ngày Khởi Hành',
      'Số Người Lớn',
      'Số Trẻ Em',
      'Tổng Tiền (VND)',
      'Trạng Thái',
      'Ngày Đặt',
      'Lý Do Hủy',
    ];

    const rows = filteredBookings.map((b) => [
      `"${b.id}"`,
      `"${b.contactName || ''}"`,
      `"${b.contactPhone || ''}"`,
      `"${b.contactEmail || ''}"`,
      `"${(b.tourTitle || '').replace(/"/g, '""')}"`,
      `"${formatDate(b.departureAt)}"`,
      b.adults,
      b.children,
      b.totalAmount,
      `"${BOOKING_LABELS[b.status] || b.status}"`,
      `"${formatDateTime(b.createdAt)}"`,
      `"${(b.cancelReason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sao_ke_don_hang_delta_travel_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã xuất file sao kê CSV thành công!');
  };

  return (
    <PageShell
      badge="HỆ THỐNG ĐIỀU HÀNH & SAO KÊ"
      title="Quản Lý Đơn Đặt & Bảng Sao Kê Doanh Thu"
      description="Giám sát đơn đặt tour thời gian thực, quản lý đối soát giao dịch, cập nhật tiến trình thanh toán và xuất sao kê tài chính chuẩn thương mại."
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchBookings} className="text-xs gap-1.5 shadow-sm">
            <RefreshCcw className="h-3.5 w-3.5" />
            <span>Tải lại</span>
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs gap-1.5 shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-emerald-700" />
            <span>Xuất Sao Kê (CSV)</span>
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="text-xs gap-1.5 shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>In Sao Kê</span>
          </Button>
        </div>
      }
    >
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-stone-950 text-white px-5 py-3 rounded-2xl shadow-2xl border border-amber-400/40 flex items-center gap-3 animate-fade-in-scale">
          <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* ─── FINANCIAL STATEMENT KPI METRICS (REAL DATA) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Bookings */}
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tổng Đơn Đặt</span>
            <Ticket className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-serif font-black text-stone-900">
              {statementSummary.totalCount}
            </div>
            <span className="text-[11px] text-stone-500">giao dịch trong bảng sao kê</span>
          </div>
        </div>

        {/* Real Revenue Collected */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Doanh Thu Thực Nhận</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-serif font-black text-emerald-900">
              {formatVND(statementSummary.revenueCollected)}
            </div>
            <span className="text-[11px] text-emerald-700">từ đơn Đã thanh toán & Xác nhận</span>
          </div>
        </div>

        {/* Pending Orders Amount */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Đang Chờ Thanh Toán</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-serif font-black text-amber-900">
              {formatVND(statementSummary.pendingAmount)}
            </div>
            <span className="text-[11px] text-amber-700">chờ khách hoàn tất giao dịch</span>
          </div>
        </div>

        {/* Cancelled Bookings */}
        <div className="rounded-2xl border border-stone-200/80 bg-stone-50 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Đơn Đã Hủy</span>
            <XCircle className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-serif font-black text-stone-700">
              {statementSummary.cancelledCount}
            </div>
            <span className="text-[11px] text-stone-500">đã giải phóng kho chỗ</span>
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER TOOLBAR ─── */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-5 shadow-sm mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã đơn, Tên khách hàng, SĐT, Email, Tên tour..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2.5 px-3 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="PENDING_PAYMENT">Chờ thanh toán (PENDING)</option>
            <option value="PAID">Đã thanh toán (PAID)</option>
            <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
            <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Từ ngày"
              className="py-2 px-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-800 focus:bg-white focus:outline-none"
            />
            <span>—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Đến ngày"
              className="py-2 px-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-800 focus:bg-white focus:outline-none"
            />
          </div>

          {(searchQuery || statusFilter !== 'all' || startDate || endDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs h-9"
            >
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      {/* ─── REAL DATA TABLE ─── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white border p-6 h-24" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-bold text-stone-800 mb-1">Lỗi tải danh sách đơn</p>
          <p className="text-xs text-stone-500 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchBookings}>Thử lại</Button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <FileSpreadsheet className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-base text-stone-900">
            {bookings.length === 0
              ? 'Chưa có đơn đặt hàng nào trong hệ thống'
              : 'Không có đơn nào khớp với bộ lọc'}
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
            {bookings.length === 0
              ? 'Dữ liệu sao kê hiện tại hoàn toàn trống. Khi khách hàng đặt tour trên trang web, toàn bộ thông tin đơn hàng và giao dịch thực tế sẽ tự động hiển thị tại đây.'
              : 'Thử kiểm tra lại từ khóa tìm kiếm hoặc đặt lại bộ lọc để xem toàn bộ danh sách đơn đặt.'}
          </p>
          {bookings.length === 0 ? (
            <div className="mt-5">
              <Link href="/tours" target="_blank">
                <Button className="bg-stone-900 text-white text-xs">
                  Xem trang web và thử đặt tour
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-5">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs"
              >
                Xóa bộ lọc tìm kiếm
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/80 bg-white shadow-sm">
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-[#faf9f5] text-stone-500 font-bold uppercase tracking-wider border-b border-stone-200/80">
              <tr>
                <th className="py-4 px-4 sm:px-6">Mã Đơn & Tour</th>
                <th className="py-4 px-4 sm:px-6">Khách Hàng</th>
                <th className="py-4 px-4 sm:px-6">Khởi Hành & Số Lượng</th>
                <th className="py-4 px-4 sm:px-6">Tổng Tiền (Sao kê)</th>
                <th className="py-4 px-4 sm:px-6">Trạng Thái</th>
                <th className="py-4 px-4 sm:px-6">Thời Gian Đặt</th>
                <th className="py-4 px-4 sm:px-6 text-right">Thao Tác Vận Hành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredBookings.map((booking) => {
                const label = BOOKING_LABELS[booking.status] || booking.status;
                const badge = STATUS_BADGE_STYLE[booking.status] || 'bg-stone-100 text-stone-800';

                return (
                  <tr key={booking.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-4 px-4 sm:px-6 max-w-xs">
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="font-bold text-stone-900 hover:text-amber-800 transition block truncate text-xs"
                      >
                        {booking.tourTitle}
                      </Link>
                      <span className="text-[10px] text-stone-400 font-mono block mt-0.5">
                        Mã: {booking.id}
                      </span>
                    </td>

                    <td className="py-4 px-4 sm:px-6">
                      <strong className="text-stone-900 block">{booking.contactName}</strong>
                      <span className="text-stone-600 text-[11px] block">{booking.contactPhone}</span>
                      <span className="text-stone-400 text-[10px] block">{booking.contactEmail}</span>
                    </td>

                    <td className="py-4 px-4 sm:px-6 font-medium text-stone-800">
                      <div>{formatDate(booking.departureAt)}</div>
                      <span className="text-[11px] text-stone-500 block">
                        {booking.adults} Lớn {booking.children > 0 ? `· ${booking.children} Trẻ` : ''}
                      </span>
                    </td>

                    <td className="py-4 px-4 sm:px-6 font-bold text-amber-900 text-xs">
                      {formatVND(booking.totalAmount)}
                    </td>

                    <td className="py-4 px-4 sm:px-6">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${badge}`}
                      >
                        {label}
                      </span>
                      {booking.cancelReason && (
                        <span className="block text-[10px] text-red-600 mt-1 italic">
                          Lý do: {booking.cancelReason}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-[11px] text-stone-500">
                      {formatDateTime(booking.createdAt)}
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {booking.status === 'PAID' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] h-7 px-2.5"
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

      {/* ─── CANCEL MODAL ─── */}
      {cancelModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-stone-200 animate-scale-up">
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">
              Hủy Đơn Đặt Chỗ (Vận Hành)
            </h3>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Thao tác này sẽ đánh dấu đơn hàng là CANCELLED và cập nhật trạng thái trong sổ sao kê doanh thu.
            </p>

            <form onSubmit={handleAdminCancel} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Lý do hủy đơn * (tối thiểu 3 ký tự)
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={3}
                  maxLength={500}
                  placeholder="Ghi rõ lý do hủy để đối soát (ví dụ: Khách yêu cầu hủy qua hotline)..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {cancelError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold">
                  {cancelError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="outline" onClick={() => setCancelModalId(null)}>
                  Đóng lại
                </Button>
                <Button
                  type="submit"
                  disabled={cancelling}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  {cancelling ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
