'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import {
  Compass,
  Ticket,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCcw,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

type SummaryData = {
  tours: number;
  bookings: number;
  pendingRefunds: number;
};

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = () => {
    setLoading(true);
    setError(null);
    adminApi
      .summary()
      .then((data) => {
        setSummary(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không thể tải thống kê vận hành.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <PageShell
      badge="Tổng Quan Điều Hành"
      title="Bảng Điều Khiển Vận Hành"
      description="Giám sát thời gian thực các tour nội địa, lưu lượng đặt chỗ và đối soát dòng tiền."
      action={
        <Button variant="outline" onClick={fetchSummary} className="gap-2 text-xs">
          <RefreshCcw className="h-3.5 w-3.5" />
          <span>Làm mới số liệu</span>
        </Button>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-stone-200 bg-white p-6 shadow-sm h-36"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-stone-700 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchSummary} className="gap-2">
            <RefreshCcw className="h-4 w-4" /> Thử lại
          </Button>
        </div>
      ) : summary ? (
        <div className="space-y-10">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tours KPI */}
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-luxury flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Tổng Số Hành Trình
                </span>
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                  <Compass className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-serif text-4xl font-bold text-stone-900">
                  {summary.tours}
                </span>
                <span className="text-xs text-stone-500 ml-2">tour trong hệ thống</span>
              </div>
              <div className="mt-4 pt-4 border-t border-stone-100">
                <Link
                  href="/admin/tours"
                  className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center justify-between"
                >
                  <span>Quản lý danh sách tour</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Bookings KPI */}
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-luxury flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Tổng Đơn Giữ & Đặt Chỗ
                </span>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-800">
                  <Ticket className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-serif text-4xl font-bold text-stone-900">
                  {summary.bookings}
                </span>
                <span className="text-xs text-stone-500 ml-2">giao dịch ghi nhận</span>
              </div>
              <div className="mt-4 pt-4 border-t border-stone-100">
                <Link
                  href="/admin/bookings"
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center justify-between"
                >
                  <span>Xử lý & đối soát đơn</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Pending Refunds KPI */}
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-luxury flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Đơn Chờ Hoàn Tiền
                </span>
                <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-serif text-4xl font-bold text-red-700">
                  {summary.pendingRefunds}
                </span>
                <span className="text-xs text-stone-500 ml-2">cần ghi nhận hoàn tất</span>
              </div>
              <div className="mt-4 pt-4 border-t border-stone-100">
                <Link
                  href="/admin/payments"
                  className="text-xs font-semibold text-red-700 hover:text-red-800 flex items-center justify-between"
                >
                  <span>Mở danh mục đối soát</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-luxury">
            <h3 className="font-serif text-xl font-bold text-stone-900 mb-4">
              Lối Tắt Vận Hành Trọng Yếu
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/admin/tours"
                className="p-4 rounded-xl border border-stone-200 bg-[#faf9f5] hover:border-amber-400 hover:bg-amber-50/50 transition duration-150 block group"
              >
                <Compass className="h-5 w-5 text-amber-700 mb-2" />
                <h4 className="font-semibold text-stone-900 text-sm group-hover:text-amber-900">
                  Thiết Lập Tour Mới
                </h4>
                <p className="text-xs text-stone-500 mt-1">Khởi tạo và biên tập nội dung tour nội địa</p>
              </Link>

              <Link
                href="/admin/schedules"
                className="p-4 rounded-xl border border-stone-200 bg-[#faf9f5] hover:border-amber-400 hover:bg-amber-50/50 transition duration-150 block group"
              >
                <Calendar className="h-5 w-5 text-amber-700 mb-2" />
                <h4 className="font-semibold text-stone-900 text-sm group-hover:text-amber-900">
                  Mở Lịch & Kho Chỗ
                </h4>
                <p className="text-xs text-stone-500 mt-1">Cấu hình giá người lớn, trẻ em và sức chứa</p>
              </Link>

              <Link
                href="/admin/bookings"
                className="p-4 rounded-xl border border-stone-200 bg-[#faf9f5] hover:border-amber-400 hover:bg-amber-50/50 transition duration-150 block group"
              >
                <Ticket className="h-5 w-5 text-amber-700 mb-2" />
                <h4 className="font-semibold text-stone-900 text-sm group-hover:text-amber-900">
                  Xác Nhận Đơn Hàng
                </h4>
                <p className="text-xs text-stone-500 mt-1">Đổi trạng thái đơn đã thanh toán sang CONFIRMED</p>
              </Link>

              <Link
                href="/admin/audit-logs"
                className="p-4 rounded-xl border border-stone-200 bg-[#faf9f5] hover:border-amber-400 hover:bg-amber-50/50 transition duration-150 block group"
              >
                <ShieldCheck className="h-5 w-5 text-amber-700 mb-2" />
                <h4 className="font-semibold text-stone-900 text-sm group-hover:text-amber-900">
                  Kiểm Toán Hoạt Động
                </h4>
                <p className="text-xs text-stone-500 mt-1">Xem lịch sử can thiệp hệ thống của người quản trị</p>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

