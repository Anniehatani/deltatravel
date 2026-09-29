'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi, assistantApi, paymentApi, systemApi } from '@/lib/api';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { AiContextCard } from '@/components/ai-context-card';
import {
  Activity,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Compass,
  CreditCard,
  RefreshCcw,
  ShieldCheck,
  Ticket,
  TriangleAlert,
} from 'lucide-react';

type Snapshot = {
  summary: Awaited<ReturnType<typeof adminApi.summary>> | null;
  integrations: Awaited<ReturnType<typeof systemApi.integrations>> | null;
  provider: Awaited<ReturnType<typeof assistantApi.providerStatus>> | null;
  payments: Awaited<ReturnType<typeof paymentApi.providers>> | null;
};

export default function AdminDashboardPage() {
  const [snapshot, setSnapshot] = useState<Snapshot>({
    summary: null,
    integrations: null,
    provider: null,
    payments: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [summary, integrations, provider, payments] = await Promise.all([
        adminApi.summary(),
        systemApi.integrations(),
        assistantApi.providerStatus(),
        paymentApi.providers(),
      ]);
      setSnapshot({ summary, integrations, provider, payments });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dashboard vận hành.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const cash = snapshot.payments?.providers.find((item) => item.provider === 'CASH');
  const walletReady =
    snapshot.payments?.providers.filter((item) => item.provider !== 'CASH' && item.available)
      .length ?? 0;

  return (
    <PageShell
      badge="OPERATIONS OVERVIEW"
      title="Trung Tâm Điều Hành Delta Travel"
      description="Tổng quan lấy trực tiếp từ backend production: danh mục tour, booking, hoàn tiền, AI và trạng thái tích hợp."
      action={
        <Button
          variant="outline"
          onClick={() => void load()}
          disabled={loading}
          className="gap-2 text-xs"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      }
    >
      <AiContextCard
        eyebrow="DELTA AI • OPERATIONS COPILOT"
        title="AI đọc tình hình vận hành trước khi bạn mở từng bảng"
        description="Copilot chạy qua backend theo quyền ADMIN/OPERATIONS, ưu tiên booking, refund và trạng thái hệ thống cần chú ý."
        prompt="Tóm tắt tình hình vận hành hiện tại của Delta Travel. Hãy ưu tiên việc cần xử lý ngay, booking đáng chú ý, hoàn tiền chờ xử lý và tình trạng hệ thống."
        context={`Admin operations dashboard; summary hiện có ${snapshot.summary?.tours ?? 0} tour, ${snapshot.summary?.bookings ?? 0} booking và ${snapshot.summary?.pendingRefunds ?? 0} refund chờ xử lý.`}
        suggestions={[
          'Hôm nay có việc vận hành nào cần xử lý ngay?',
          'Tóm tắt booking và hoàn tiền đáng chú ý.',
          'Hệ thống AI và thanh toán đang ở trạng thái nào?',
        ]}
        autoRun={!loading && !error}
        className="mb-6"
      />

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <strong>Không thể đọc toàn bộ snapshot.</strong>
            <div className="mt-1 text-xs">{error}</div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={<Compass className="h-5 w-5" />}
          label="Tour trong hệ thống"
          value={loading ? '...' : String(snapshot.summary?.tours ?? 0)}
          detail="Dữ liệu admin backend"
        />
        <Metric
          icon={<Ticket className="h-5 w-5" />}
          label="Booking"
          value={loading ? '...' : String(snapshot.summary?.bookings ?? 0)}
          detail="Toàn hệ thống"
        />
        <Metric
          icon={<CircleDollarSign className="h-5 w-5" />}
          label="Chờ hoàn tiền"
          value={loading ? '...' : String(snapshot.summary?.pendingRefunds ?? 0)}
          detail="REFUND_REQUIRED"
        />
        <Metric
          icon={<Bot className="h-5 w-5" />}
          label="AI runtime"
          value={
            loading
              ? '...'
              : snapshot.provider?.preferredProvider &&
                  (snapshot.provider.groqConfigured || snapshot.provider.geminiConfigured)
                ? snapshot.provider.preferredProvider
                : 'FALLBACK'
          }
          detail={snapshot.provider?.fallbackAvailable ? 'Fallback luôn sẵn sàng' : 'Đang kiểm tra'}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
            <h2 className="font-black text-stone-950">Readiness hệ thống</h2>
          </div>
          <div className="space-y-3 text-xs">
            <Readiness label="AI configured" ok={snapshot.integrations?.aiConfigured === true} />
            <Readiness
              label={`Mail provider: ${snapshot.integrations?.mailProvider ?? 'unknown'}`}
              ok={Boolean(
                snapshot.integrations && snapshot.integrations.mailProvider !== 'DISABLED',
              )}
            />
            <Readiness
              label="Avatar storage"
              ok={snapshot.integrations?.avatarStorageConfigured === true}
            />
            <Readiness label="CASH" ok={cash?.available === true} />
            <Readiness
              label={`Online gateway available: ${walletReady}/3`}
              ok={walletReady === 3}
              neutral={walletReady < 3}
            />
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-stone-500">
            Gateway online thiếu merchant credential sẽ được báo unavailable thay vì mô phỏng thanh
            toán thành công.
          </p>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <h2 className="font-black text-stone-950">Lối tắt vận hành</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Shortcut href="/admin/tours" icon={<Compass className="h-4 w-4" />} title="Tour" />
            <Shortcut
              href="/admin/schedules"
              icon={<CalendarDays className="h-4 w-4" />}
              title="Lịch & kho chỗ"
            />
            <Shortcut
              href="/admin/bookings"
              icon={<Ticket className="h-4 w-4" />}
              title="Booking"
            />
            <Shortcut
              href="/admin/payments"
              icon={<CreditCard className="h-4 w-4" />}
              title="Payment"
            />
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between text-stone-500">
        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className="mt-3 text-3xl font-black text-stone-950">{value}</div>
      <div className="mt-1 text-[11px] text-stone-500">{detail}</div>
    </div>
  );
}

function Readiness({
  label,
  ok,
  neutral = false,
}: {
  label: string;
  ok: boolean;
  neutral?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3">
      <span className="font-semibold text-stone-700">{label}</span>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${
          ok
            ? 'bg-emerald-100 text-emerald-800'
            : neutral
              ? 'bg-amber-100 text-amber-800'
              : 'bg-red-100 text-red-800'
        }`}
      >
        {ok ? <CheckCircle2 className="h-3 w-3" /> : null}
        {ok ? 'READY' : neutral ? 'EXTERNAL' : 'CHECK'}
      </span>
    </div>
  );
}

function Shortcut({ href, icon, title }: { href: string; icon: React.ReactNode; title: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 text-xs font-black text-stone-900 transition hover:border-amber-400 hover:bg-amber-50"
    >
      {icon}
      {title}
    </Link>
  );
}
