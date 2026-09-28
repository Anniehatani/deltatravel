'use client';

import { useEffect, useState } from 'react';
import { assistantApi, adminApi, paymentApi, systemApi } from '@/lib/api';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Bot,
  CheckCircle2,
  Database,
  RefreshCcw,
  Server,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

type SystemSnapshot = {
  provider: Awaited<ReturnType<typeof assistantApi.providerStatus>> | null;
  payments: Awaited<ReturnType<typeof paymentApi.providers>> | null;
  integrations: Awaited<ReturnType<typeof systemApi.integrations>> | null;
  summary: Awaited<ReturnType<typeof adminApi.summary>> | null;
};

export default function SystemAdminPage() {
  const [snapshot, setSnapshot] = useState<SystemSnapshot>({
    provider: null,
    payments: null,
    integrations: null,
    summary: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [provider, payments, integrations, summary] = await Promise.all([
        assistantApi.providerStatus(),
        paymentApi.providers(),
        systemApi.integrations(),
        adminApi.summary(),
      ]);
      setSnapshot({ provider, payments, integrations, summary });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể đọc trạng thái hệ thống từ backend.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const aiReady =
    snapshot.provider?.preferredProvider === 'GROQ' && snapshot.provider?.groqConfigured === true;

  return (
    <PageShell
      badge="PRODUCTION CONTROL"
      title="Trạng Thái Hệ Thống"
      description="Bảng điều khiển chỉ đọc. API key và bí mật production chỉ được lưu ở máy chủ, không bao giờ được đưa xuống trình duyệt."
      action={
        <Button
          type="button"
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
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          title="Backend API"
          value={loading ? 'ĐANG KIỂM TRA' : error ? 'KHÔNG XÁC NHẬN' : 'ONLINE'}
          detail="Render production API"
          ok={!loading && !error}
          icon={<Server className="h-6 w-6" />}
        />
        <StatusCard
          title="AI Provider"
          value={loading ? 'ĐANG KIỂM TRA' : aiReady ? 'GROQ LIVE' : 'FALLBACK'}
          detail={
            snapshot.provider
              ? `Preferred: ${snapshot.provider.preferredProvider ?? 'none'}`
              : 'Chưa có dữ liệu'
          }
          ok={Boolean(aiReady)}
          icon={<Bot className="h-6 w-6" />}
        />
        <StatusCard
          title="Dữ liệu tour"
          value={
            snapshot.summary ? `${snapshot.summary.tours} TOUR` : loading ? 'ĐANG KIỂM TRA' : 'N/A'
          }
          detail={
            snapshot.summary
              ? `${snapshot.summary.bookings} booking trong hệ thống`
              : 'Đọc trực tiếp từ backend'
          }
          ok={Boolean(snapshot.summary)}
          icon={<Database className="h-6 w-6" />}
        />
        <StatusCard
          title="Thanh toán"
          value={
            loading
              ? 'ĐANG KIỂM TRA'
              : snapshot.payments
                ? `${snapshot.payments.providers.filter((item) => item.available).length}/4 SẴN SÀNG`
                : 'KHÔNG XÁC NHẬN'
          }
          detail={
            snapshot.payments
              ? snapshot.payments.providers
                  .map((item) => `${item.provider}: ${item.available ? item.environment : 'OFF'}`)
                  .join(' • ')
              : 'Đọc trực tiếp từ backend'
          }
          ok={Boolean(snapshot.payments?.providers.some((item) => item.available))}
          icon={<Activity className="h-6 w-6" />}
        />
        <StatusCard
          title="Bảo mật client"
          value="SERVER-SIDE SECRETS"
          detail="Không lưu Groq/Resend/payment key trong localStorage hoặc bundle frontend"
          ok
          icon={<ShieldCheck className="h-6 w-6" />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatusCard
          title="Email giao dịch"
          value={
            snapshot.integrations?.mailProvider
              ? snapshot.integrations.mailProvider
              : loading
                ? 'ĐANG KIỂM TRA'
                : 'N/A'
          }
          detail="OTP đặt lại mật khẩu và email nghiệp vụ"
          ok={Boolean(
            snapshot.integrations?.mailProvider &&
            snapshot.integrations.mailProvider !== 'DISABLED' &&
            snapshot.integrations.mailProvider !== 'CONSOLE',
          )}
          icon={<Activity className="h-6 w-6" />}
        />
        <StatusCard
          title="Avatar Storage"
          value={
            loading
              ? 'ĐANG KIỂM TRA'
              : snapshot.integrations?.avatarStorageConfigured
                ? 'SUPABASE LIVE'
                : 'CHƯA CẤU HÌNH'
          }
          detail="Signed upload, xác minh và lưu avatar bền vững"
          ok={Boolean(snapshot.integrations?.avatarStorageConfigured)}
          icon={<Database className="h-6 w-6" />}
        />
        <StatusCard
          title="AI Runtime"
          value={
            loading
              ? 'ĐANG KIỂM TRA'
              : snapshot.integrations?.aiConfigured
                ? 'AI CONFIGURED'
                : 'FALLBACK ONLY'
          }
          detail={snapshot.integrations?.aiProvider ?? 'Không có provider ưu tiên'}
          ok={Boolean(snapshot.integrations?.aiConfigured)}
          icon={<Bot className="h-6 w-6" />}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-luxury">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-700" />
            <h2 className="font-serif text-lg font-bold text-stone-900">AI Runtime</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <Row
              label="Provider ưu tiên"
              value={snapshot.provider?.preferredProvider ?? 'Chưa xác nhận'}
            />
            <Row
              label="Groq configured"
              value={snapshot.provider?.groqConfigured ? 'Có' : 'Không'}
            />
            <Row
              label="Gemini configured"
              value={snapshot.provider?.geminiConfigured ? 'Có' : 'Không'}
            />
            <Row
              label="Deterministic fallback"
              value={snapshot.provider?.fallbackAvailable ? 'Có' : 'Không'}
            />
          </dl>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-luxury">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-amber-700" />
            <h2 className="font-serif text-lg font-bold text-stone-900">Nghiệp vụ production</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <Row label="Tours" value={snapshot.summary ? String(snapshot.summary.tours) : 'N/A'} />
            <Row
              label="Bookings"
              value={snapshot.summary ? String(snapshot.summary.bookings) : 'N/A'}
            />
            <Row
              label="Hoàn tiền chờ xử lý"
              value={snapshot.summary ? String(snapshot.summary.pendingRefunds) : 'N/A'}
            />
            <Row
              label="Cổng thanh toán"
              value={
                snapshot.payments
                  ? snapshot.payments.providers
                      .map(
                        (item) =>
                          `${item.provider}: ${item.available ? item.environment : 'chưa cấu hình'}`,
                      )
                      .join(' • ')
                  : 'N/A'
              }
            />
            <Row label="Payment return" value={snapshot.payments?.returnOrigin ?? 'N/A'} />
            <Row label="Email provider" value={snapshot.integrations?.mailProvider ?? 'N/A'} />
            <Row
              label="Avatar storage"
              value={
                snapshot.integrations?.avatarStorageConfigured
                  ? 'Supabase sẵn sàng'
                  : 'Chưa cấu hình'
              }
            />
            <Row label="Cấu hình bí mật" value="Quản lý tại Render, không chỉnh từ trình duyệt" />
          </dl>
        </section>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950">
        Trang này cố ý không cho xem hoặc sửa API key. Việc cấu hình Groq, Resend, Supabase và cổng
        thanh toán thuộc lớp hạ tầng server để tránh lộ credential qua JavaScript, localStorage hoặc
        DevTools.
      </div>
    </PageShell>
  );
}

function StatusCard({
  title,
  value,
  detail,
  ok,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  ok: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-luxury">
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${
          ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}
      >
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-wider text-stone-500">{title}</p>
      <p className="mt-1 text-sm font-black text-stone-950">{value}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-stone-500">{detail}</p>
      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold">
        <CheckCircle2 className={`h-3.5 w-3.5 ${ok ? 'text-emerald-600' : 'text-amber-600'}`} />
        <span className={ok ? 'text-emerald-700' : 'text-amber-700'}>
          {ok ? 'Đã xác nhận' : 'Cần kiểm tra'}
        </span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-2 last:border-0">
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-right font-semibold text-stone-900">{value}</dd>
    </div>
  );
}
