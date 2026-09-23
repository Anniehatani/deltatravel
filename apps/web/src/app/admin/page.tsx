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
  Cpu,
  Zap,
  Activity,
  CreditCard,
  Lock,
  Layers,
  Server,
} from 'lucide-react';
import { getSystemConfig, type SystemConfig } from '@/lib/system-config';

type SummaryData = {
  tours: number;
  bookings: number;
  pendingRefunds: number;
};

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sysConfig, setSysConfig] = useState<SystemConfig | null>(null);

  const fetchSummary = () => {
    setLoading(true);
    setError(null);
    setSysConfig(getSystemConfig());
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
      badge="SUPER MAX OPERATIONAL DASHBOARD"
      title="Bảng Điều Khiển Vận Hành Tối Cao"
      description="Giám sát thời gian thực toàn bộ hành trình du lịch, lưu lượng đặt chỗ, đối soát dòng tiền và trung tâm lệnh trí tuệ nhân tạo."
      action={
        <div className="flex items-center gap-2">
          <Link href="/admin/system">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 shadow-md">
              <Cpu className="h-3.5 w-3.5" />
              <span>Trung Tâm Lệnh Tối Cao</span>
            </Button>
          </Link>
          <Button variant="outline" onClick={fetchSummary} className="gap-2 text-xs">
            <RefreshCcw className="h-3.5 w-3.5" />
            <span>Làm mới số liệu</span>
          </Button>
        </div>
      }
    >
      {/* ─── Supreme AI & Security System Banner ─── */}
      <div className="mb-8 rounded-3xl border border-stone-800 bg-neutral-950 p-6 sm:p-7 text-white shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                  QUYỀN LỆNH TỐI CAO ĐÃ KÍCH HOẠT
                </span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  BẢO MẬT CẤP ĐỘ ROOT
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                Trí Tuệ Nhân Tạo & Phòng Thủ Chống Hack (AI & Defense Center)
              </h3>
              <p className="text-xs text-stone-300 mt-1 max-w-xl">
                Active Model: <span className="font-mono text-amber-300 font-bold">{sysConfig?.aiModel || 'openai/gpt-oss-120b'}</span> | Tường lửa WAF: <span className="text-emerald-400 font-bold">BẬT (Rate Limit {sysConfig?.rateLimitPerMin || 60} req/m)</span> | 3D Image Sequence: <span className="text-blue-300 font-bold">150 Frames (WebP 12.6MB)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/system"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg hover:scale-105"
            >
              <Zap className="h-4 w-4" />
              <span>Thiết Lập API & Prompt</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
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
          {/* KPI Cards: 4 High-Density Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tours KPI */}
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-luxury flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Hành Trình Nội Địa
                </span>
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                  <Compass className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-serif text-4xl font-bold text-stone-900">
                  {summary.tours}
                </span>
                <span className="text-xs text-stone-500 ml-2">tour hoạt động</span>
              </div>
              <div className="mt-4 pt-4 border-t border-stone-100">
                <Link
                  href="/admin/tours"
                  className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center justify-between"
                >
                  <span>Quản lý tour</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Bookings KPI */}
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-luxury flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Tổng Đơn Giữ Chỗ
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
                  <span>Đối soát & xử lý</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Pending Refunds KPI */}
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-luxury flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Chờ Hoàn Tiền
                </span>
                <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-serif text-4xl font-bold text-red-700">
                  {summary.pendingRefunds}
                </span>
                <span className="text-xs text-stone-500 ml-2">cần xử lý hoàn tất</span>
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

            {/* Estimated GMV KPI */}
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-luxury flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Ước Tính Doanh Thu
                </span>
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-800">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-serif text-3xl font-bold text-stone-900">
                  {((summary.bookings * 3500000) / 1000000).toFixed(1)} tr
                </span>
                <span className="text-xs text-stone-500 ml-1.5">VND tổng giá trị</span>
              </div>
              <div className="mt-4 pt-4 border-t border-stone-100">
                <Link
                  href="/admin/payments"
                  className="text-xs font-semibold text-blue-800 hover:text-blue-900 flex items-center justify-between"
                >
                  <span>Báo cáo doanh thu</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Grid (Super Max) */}
          <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-luxury">
            <h3 className="font-serif text-xl font-bold text-stone-900 mb-4">
              Lối Tắt Vận Hành Trọng Yếu (Super Max Actions)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Link
                href="/admin/system"
                className="p-4 rounded-xl border border-amber-300 bg-amber-50/40 hover:border-amber-500 hover:bg-amber-100/50 transition duration-150 block group shadow-sm"
              >
                <Cpu className="h-5 w-5 text-amber-700 mb-2" />
                <h4 className="font-semibold text-stone-900 text-sm group-hover:text-amber-900">
                  Lệnh Tối Cao & AI
                </h4>
                <p className="text-xs text-stone-600 mt-1">Đổi Groq API Key, Model, Prompt & Bảo mật</p>
              </Link>

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
