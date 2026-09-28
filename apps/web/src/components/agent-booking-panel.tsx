'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import Link from 'next/link';
import type { AgentPlan, Provider } from '@tour/shared';
import { assistantApi } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  CreditCard,
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  PlaneTakeoff,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  X,
} from 'lucide-react';

const money = (value: number | null | undefined) =>
  typeof value === 'number' ? value.toLocaleString('vi-VN') + ' ₫' : 'Chưa đặt';

const date = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const missingLabels: Record<string, string> = {
  PARTY: 'Số lượng khách',
  CONTACT_PHONE: 'Số điện thoại liên hệ',
  PAYMENT_METHOD: 'Phương thức thanh toán',
  TOUR_OR_SCHEDULE: 'Tour hoặc lịch khởi hành phù hợp',
};

function statusText(status: AgentPlan['status']) {
  const labels: Record<AgentPlan['status'], string> = {
    NEEDS_INPUT: 'CẦN BỔ SUNG',
    NO_MATCH: 'CHƯA CÓ PHƯƠNG ÁN',
    READY_FOR_APPROVAL: 'CHỜ BẠN DUYỆT',
    REAPPROVAL_REQUIRED: 'CẦN DUYỆT LẠI',
    EXECUTING: 'AI ĐANG THỰC HIỆN',
    PAYMENT_RETRY_REQUIRED: 'CẦN THỬ LẠI THANH TOÁN',
    ACTION_REQUIRED: 'CẦN BẠN HÀNH ĐỘNG',
    COMPLETED: 'HOÀN TẤT',
    DECLINED: 'ĐÃ TỪ CHỐI',
  };
  return labels[status];
}

export function AgentBookingPanel() {
  const { user } = useAuth();
  const [message, setMessage] = useState(
    'Tìm giúp tôi một tour phù hợp, ưu tiên lịch hợp lý và giá tốt.',
  );
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState('');
  const [destination, setDestination] = useState('');
  const [departureFrom, setDepartureFrom] = useState('');
  const [departureTo, setDepartureTo] = useState('');
  const [provider, setProvider] = useState<Provider | ''>('CASH');
  const [scheduleId, setScheduleId] = useState('');

  const editFormRef = useRef<HTMLFormElement>(null);
  const checkpointRef = useRef<HTMLDivElement>(null);
  const adultsRef = useRef<HTMLInputElement>(null);
  const childrenRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const budgetRef = useRef<HTMLInputElement>(null);
  const departureFromRef = useRef<HTMLInputElement>(null);
  const departureToRef = useRef<HTMLInputElement>(null);
  const providerRef = useRef<HTMLSelectElement>(null);

  const phonePattern = /^(?:\+84|0)[0-9]{9,10}$/;

  useEffect(() => {
    if (!plan) return;
    setAdults(plan.constraints.adults ? String(plan.constraints.adults) : '');
    setChildren(String(plan.constraints.children));
    setPhone(plan.constraints.contactPhone || '');
    setBudget(plan.constraints.budgetVnd ? String(plan.constraints.budgetVnd) : '');
    setDestination(plan.constraints.destination || '');
    setDepartureFrom(plan.constraints.departureFrom || '');
    setDepartureTo(plan.constraints.departureTo || '');
    setProvider(plan.constraints.provider || '');
    setScheduleId(plan.selectedScheduleId || '');
  }, [plan]);

  const selected = useMemo(
    () => plan?.candidates.find((item) => item.scheduleId === plan.selectedScheduleId),
    [plan],
  );

  const formIsDirty = useMemo(() => {
    if (!plan) return false;
    return (
      String(plan.constraints.adults ?? '') !== adults ||
      String(plan.constraints.children ?? 0) !== children ||
      String(plan.constraints.contactPhone ?? '') !== phone ||
      String(plan.constraints.budgetVnd ?? '') !== budget ||
      String(plan.constraints.destination ?? '') !== destination ||
      String(plan.constraints.departureFrom ?? '') !== departureFrom ||
      String(plan.constraints.departureTo ?? '') !== departureTo ||
      String(plan.constraints.provider ?? '') !== provider ||
      String(plan.selectedScheduleId ?? '') !== scheduleId
    );
  }, [
    plan,
    adults,
    children,
    phone,
    budget,
    destination,
    departureFrom,
    departureTo,
    provider,
    scheduleId,
  ]);

  const scrollToCheckpoint = () => {
    window.setTimeout(() => {
      checkpointRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const scrollToEditor = () => {
    window.setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  if (!user) {
    return (
      <section className="overflow-hidden rounded-[28px] border border-amber-200/80 bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 p-7 text-white shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <Bot className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">
              DELTA AI AGENT
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">
              Để AI lập kế hoạch và đặt tour thay bạn
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300">
              AI có thể tự tìm tour, kiểm tra giá và chỗ, lập kế hoạch rồi thực hiện từng bước. Mọi
              hành động tạo booking đều dừng ở checkpoint để bạn chọn Cho phép hoặc Không cho phép.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild className="bg-amber-400 text-black hover:bg-amber-300">
                <Link href="/login">Đăng nhập để dùng Agent</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white">
                <Link href="/register">Tạo tài khoản</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (user.role !== 'CUSTOMER') {
    return (
      <section className="rounded-3xl border border-stone-200 bg-white p-6 text-sm text-stone-700">
        AI Booking Agent hiện dành cho tài khoản khách hàng. Tài khoản vận hành vẫn có thể dùng trợ
        lý AI phía trên để tra cứu nghiệp vụ.
      </section>
    );
  }

  const createPlan = async () => {
    setBusy(true);
    setError('');
    try {
      const next = await assistantApi.createPlan({
        message,
        lang: 'vi',
        ...(adults ? { adults: Number(adults) } : {}),
        children: children ? Number(children) : 0,
        ...(budget ? { budgetVnd: Number(budget) } : {}),
        ...(destination.trim() ? { destination: destination.trim() } : {}),
        ...(departureFrom ? { departureFrom } : {}),
        ...(departureTo ? { departureTo } : {}),
        ...(phone.trim() ? { contactPhone: phone.trim() } : {}),
        ...(provider ? { provider } : {}),
      });
      setPlan(next);
      window.setTimeout(() => {
        if (next.checkpoint) {
          checkpointRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể lập kế hoạch AI.');
    } finally {
      setBusy(false);
    }
  };

  const updatePlan = async (overrideScheduleId?: string) => {
    if (!plan) return;
    setBusy(true);
    setError('');
    try {
      const next = await assistantApi.updatePlan(plan.id, {
        ...(adults ? { adults: Number(adults) } : {}),
        children: children ? Number(children) : 0,
        ...(budget ? { budgetVnd: Number(budget) } : {}),
        ...(destination.trim() ? { destination: destination.trim() } : {}),
        ...(departureFrom ? { departureFrom } : {}),
        ...(departureTo ? { departureTo } : {}),
        ...(phone.trim() ? { contactPhone: phone.trim() } : {}),
        ...(provider ? { provider } : {}),
        ...(overrideScheduleId || scheduleId
          ? { scheduleId: overrideScheduleId || scheduleId }
          : {}),
      });
      setPlan(next);
      return next;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể cập nhật kế hoạch.');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const readCheckpointForm = (form: HTMLFormElement) => {
    const data = new FormData(form);
    return {
      adults: String(data.get('adults') ?? '').trim(),
      children: String(data.get('children') ?? '0').trim(),
      phone: String(data.get('phone') ?? '').trim(),
      budget: String(data.get('budget') ?? '').trim(),
      destination: String(data.get('destination') ?? '').trim(),
      departureFrom: String(data.get('departureFrom') ?? '').trim(),
      departureTo: String(data.get('departureTo') ?? '').trim(),
      provider: String(data.get('provider') ?? '').trim() as Provider | '',
    };
  };

  const validateCheckpointFields = (values: ReturnType<typeof readCheckpointForm>) => {
    const adultCount = Number(values.adults);
    const childCount = Number(values.children || 0);
    const budgetValue = values.budget ? Number(values.budget) : null;

    if (!Number.isInteger(adultCount) || adultCount < 1 || adultCount > 100) {
      adultsRef.current?.focus();
      return 'Số người lớn phải từ 1 đến 100.';
    }
    if (!Number.isInteger(childCount) || childCount < 0 || childCount > 100) {
      childrenRef.current?.focus();
      return 'Số trẻ em phải từ 0 đến 100.';
    }
    if (!phonePattern.test(values.phone)) {
      phoneRef.current?.focus();
      return 'Số điện thoại chưa hợp lệ. Hãy nhập số Việt Nam bắt đầu bằng 0 hoặc +84.';
    }
    if (budgetValue !== null && (!Number.isFinite(budgetValue) || budgetValue < 0)) {
      budgetRef.current?.focus();
      return 'Ngân sách phải là một số không âm.';
    }
    if (values.departureFrom && values.departureTo && values.departureFrom > values.departureTo) {
      departureToRef.current?.focus();
      return 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.';
    }
    const providerAvailable = Boolean(
      values.provider &&
      plan?.paymentOptions.some((item) => item.provider === values.provider && item.available),
    );
    if (!providerAvailable) {
      providerRef.current?.focus();
      return 'Hãy chọn một phương thức thanh toán đang khả dụng.';
    }
    return '';
  };

  const continueToNextCheckpoint = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!plan || busy) return;

    const form = e.currentTarget;
    const values = readCheckpointForm(form);

    setError('');
    const validationError = validateCheckpointFields(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setAdults(values.adults);
    setChildren(values.children);
    setPhone(values.phone);
    setBudget(values.budget);
    setDestination(values.destination);
    setDepartureFrom(values.departureFrom);
    setDepartureTo(values.departureTo);
    setProvider(values.provider);

    const sameAsPlan =
      String(plan.constraints.adults ?? '') === values.adults &&
      String(plan.constraints.children ?? 0) === values.children &&
      String(plan.constraints.contactPhone ?? '') === values.phone &&
      String(plan.constraints.budgetVnd ?? '') === values.budget &&
      String(plan.constraints.destination ?? '') === values.destination &&
      String(plan.constraints.departureFrom ?? '') === values.departureFrom &&
      String(plan.constraints.departureTo ?? '') === values.departureTo &&
      String(plan.constraints.provider ?? '') === values.provider &&
      String(plan.selectedScheduleId ?? '') === scheduleId;

    if (plan.checkpoint && sameAsPlan) {
      scrollToCheckpoint();
      return;
    }

    setBusy(true);
    try {
      const next = await assistantApi.updatePlan(plan.id, {
        adults: Number(values.adults),
        children: Number(values.children || 0),
        ...(values.budget ? { budgetVnd: Number(values.budget) } : {}),
        ...(values.destination ? { destination: values.destination } : {}),
        ...(values.departureFrom ? { departureFrom: values.departureFrom } : {}),
        ...(values.departureTo ? { departureTo: values.departureTo } : {}),
        contactPhone: values.phone,
        provider: values.provider as Provider,
        ...(scheduleId ? { scheduleId } : {}),
      });

      setPlan(next);

      if (next.checkpoint && next.status === 'READY_FOR_APPROVAL') {
        scrollToCheckpoint();
        return;
      }

      scrollToEditor();
      if (next.status === 'NO_MATCH') {
        setError(
          'Không có tour nào khớp đồng thời điểm đến, ngày đi, ngân sách và số chỗ bạn đã chọn. AI sẽ không tự đổi sang điểm đến khác.',
        );
      } else if (next.missingFields.includes('CONTACT_PHONE')) {
        window.setTimeout(() => phoneRef.current?.focus(), 140);
      } else if (next.missingFields.includes('PAYMENT_METHOD')) {
        window.setTimeout(() => providerRef.current?.focus(), 140);
      }
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Không thể cập nhật kế hoạch.');
    } finally {
      setBusy(false);
    }
  };

  const handleInitialEnter = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (
      e.key === 'Enter' &&
      !e.shiftKey &&
      !e.nativeEvent.isComposing &&
      !plan &&
      !busy &&
      message.trim()
    ) {
      e.preventDefault();
      void createPlan();
    }
  };

  const approve = async () => {
    if (!plan) return;
    setBusy(true);
    setError('');
    try {
      setPlan(await assistantApi.approvePlan(plan.id, plan.version));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI không thể thực hiện kế hoạch.');
      try {
        setPlan(await assistantApi.getPlan(plan.id));
      } catch {
        // Keep the last safe snapshot if refresh also fails.
      }
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    if (!plan) return;
    setBusy(true);
    setError('');
    try {
      setPlan(await assistantApi.declinePlan(plan.id, 'Khách không duyệt kế hoạch này'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể từ chối kế hoạch.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_30px_90px_-45px_rgba(0,0,0,0.35)]">
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.24),transparent_35%),linear-gradient(135deg,#0c0a09,#1c1917_55%,#422006)] p-6 text-white sm:p-8">
        <div className="absolute right-[-60px] top-[-80px] h-52 w-52 rounded-full border border-white/10" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] !text-white">
              <Sparkles className="h-4 w-4" />
              DELTA AI AGENT • HUMAN-IN-THE-LOOP
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight !text-white sm:text-3xl">
              Một travel agent có thể hành động, nhưng không bao giờ vượt quyền bạn
            </h2>
            <p className="mt-3 text-sm leading-6 !text-white">
              AI tự tìm, xếp hạng, kiểm tra giá và chỗ, tạo booking và chuẩn bị thanh toán. Trước
              hành động thật, hệ thống luôn hiển thị checkpoint để bạn duyệt.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs font-bold !text-white">
            <ShieldCheck className="h-4 w-4" />
            Explicit approval required
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-stone-700">
              Nói cho AI điều bạn muốn
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              onKeyDown={handleInitialEnter}
              className="w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 outline-none transition focus:border-amber-500 focus:bg-white"
              placeholder="Ví dụ: Mình muốn đi Đà Nẵng giữa tháng 10, 2 người, ngân sách dưới 8 triệu..."
            />
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-stone-500">
              Nguyên tắc an toàn
            </p>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-stone-700">
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                Tìm kiếm và tính toán được phép tự động.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                Tạo booking phải có nút Cho phép rõ ràng.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                Nếu giá thay đổi, AI dừng và xin duyệt lại.
              </li>
            </ul>
          </div>
        </div>

        {!plan && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CompactField label="Người lớn">
              <input
                type="number"
                min={1}
                max={100}
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
                onKeyDown={handleInitialEnter}
              />
            </CompactField>
            <CompactField label="Trẻ em">
              <input
                type="number"
                min={0}
                max={100}
                value={children}
                onChange={(e) => setChildren(e.target.value)}
                onKeyDown={handleInitialEnter}
              />
            </CompactField>
            <CompactField label="Ngân sách tối đa">
              <input
                type="number"
                min={0}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                onKeyDown={handleInitialEnter}
                placeholder="VD 8000000"
              />
            </CompactField>
            <CompactField label="Điểm đến">
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={handleInitialEnter}
                placeholder="Đà Nẵng"
              />
            </CompactField>
          </div>
        )}

        {!plan && (
          <Button
            type="button"
            onClick={() => void createPlan()}
            disabled={busy || !message.trim()}
            className="h-12 w-full rounded-2xl bg-stone-950 text-sm font-black text-white hover:bg-stone-800"
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4 text-amber-300" />
            )}
            Lập kế hoạch bằng AI Agent
          </Button>
        )}

        {plan && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                  Agent plan
                </p>
                <p className="text-sm font-bold text-stone-900">{statusText(plan.status)}</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                <span>{plan.mode}</span>
                <span>•</span>
                <span>v{plan.version}</span>
              </div>
            </div>

            <AgentTimeline plan={plan} />

            {plan.missingFields.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-black text-amber-950">
                  AI cần bạn xác nhận thêm trước khi có thể hành động:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {plan.missingFields.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] font-bold text-amber-900"
                    >
                      {missingLabels[item] || item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {plan.status === 'NO_MATCH' && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-red-900">
                  Không có phương án khớp chính xác
                </p>
                <p className="mt-2 text-xs leading-5 text-red-800">
                  {plan.summary} AI sẽ không tự đổi sang một điểm đến khác với lựa chọn của bạn.
                </p>
              </div>
            )}

            {plan.candidates.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-stone-800">
                      Phương án AI đã kiểm chứng
                    </p>
                    <p className="mt-1 text-[11px] text-stone-500">{plan.rationale}</p>
                  </div>
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  {plan.candidates.slice(0, 3).map((candidate, index) => {
                    const active = candidate.scheduleId === plan.selectedScheduleId;
                    return (
                      <button
                        key={candidate.scheduleId}
                        type="button"
                        disabled={busy || Boolean(plan.booking)}
                        onClick={() => {
                          setScheduleId(candidate.scheduleId);
                          void updatePlan(candidate.scheduleId);
                        }}
                        className={`rounded-2xl border p-4 text-left transition ${
                          active
                            ? 'border-amber-500 bg-amber-50 shadow-sm'
                            : 'border-stone-200 bg-white hover:border-stone-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                            {index === 0 ? 'AI đề xuất' : 'Phương án ' + (index + 1)}
                          </span>
                          {active && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        </div>
                        <h3 className="mt-2 text-sm font-black leading-5 text-stone-950">
                          {candidate.tourTitle}
                        </h3>
                        <div className="mt-3 space-y-1.5 text-[11px] text-stone-600">
                          <p className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" /> {candidate.destination}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <PlaneTakeoff className="h-3.5 w-3.5" /> {date(candidate.departureAt)}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" /> Còn {candidate.availableSeats} chỗ
                          </p>
                        </div>
                        <p className="mt-3 text-lg font-black text-stone-950">
                          {money(candidate.totalAmount)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!plan.booking && plan.status !== 'DECLINED' && (
              <form
                ref={editFormRef}
                onSubmit={(e) => void continueToNextCheckpoint(e)}
                className="rounded-3xl border border-stone-200 bg-stone-50 p-5"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Pencil className="h-4 w-4 text-amber-700" />
                    <p className="text-xs font-black uppercase tracking-wider text-stone-800">
                      Kiểm tra và chỉnh trước khi duyệt
                    </p>
                  </div>
                  <div className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] font-bold text-stone-500">
                    Enter để tiếp tục
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <CompactField label="Người lớn">
                    <input
                      ref={adultsRef}
                      name="adults"
                      type="number"
                      min={1}
                      max={100}
                      value={adults}
                      onChange={(e) => setAdults(e.target.value)}
                    />
                  </CompactField>
                  <CompactField label="Trẻ em">
                    <input
                      ref={childrenRef}
                      name="children"
                      type="number"
                      min={0}
                      max={100}
                      value={children}
                      onChange={(e) => setChildren(e.target.value)}
                    />
                  </CompactField>
                  <CompactField label="Số điện thoại">
                    <input
                      ref={phoneRef}
                      name="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09xxxxxxxx"
                    />
                  </CompactField>
                  <CompactField label="Ngân sách tối đa">
                    <input
                      ref={budgetRef}
                      name="budget"
                      type="number"
                      min={0}
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </CompactField>
                  <CompactField label="Điểm đến">
                    <input
                      name="destination"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </CompactField>
                  <CompactField label="Từ ngày">
                    <input
                      ref={departureFromRef}
                      name="departureFrom"
                      type="date"
                      value={departureFrom}
                      onChange={(e) => setDepartureFrom(e.target.value)}
                    />
                  </CompactField>
                  <CompactField label="Đến ngày">
                    <input
                      ref={departureToRef}
                      name="departureTo"
                      type="date"
                      value={departureTo}
                      onChange={(e) => setDepartureTo(e.target.value)}
                    />
                  </CompactField>
                  <CompactField label="Thanh toán">
                    <select
                      ref={providerRef}
                      name="provider"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value as Provider | '')}
                    >
                      <option value="">Chọn phương thức</option>
                      {plan.paymentOptions.map((item) => (
                        <option
                          key={item.provider}
                          value={item.provider}
                          disabled={!item.available}
                        >
                          {item.label}
                          {!item.available ? ' • chưa cấu hình' : ''}
                        </option>
                      ))}
                    </select>
                  </CompactField>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => editFormRef.current?.requestSubmit()}
                    className="gap-2 rounded-xl"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4" />
                    )}
                    Tính lại kế hoạch
                  </Button>
                  <Button
                    type="submit"
                    disabled={busy}
                    className="gap-2 rounded-xl bg-stone-950 text-white hover:bg-stone-800"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {plan.checkpoint && !formIsDirty
                      ? 'Tới checkpoint duyệt'
                      : 'Cập nhật & tiếp tục'}
                  </Button>
                  <span className="text-[10px] text-stone-500">
                    Nhấn Enter ở bất kỳ ô nào để sang checkpoint kế tiếp.
                  </span>
                </div>
              </form>
            )}

            {plan.checkpoint && selected && (
              <div
                ref={checkpointRef}
                className="rounded-[26px] border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-white p-5 shadow-lg sm:p-6"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-black">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800">
                      APPROVAL CHECKPOINT
                    </p>
                    <h3 className="mt-1 text-lg font-black text-stone-950">
                      {plan.checkpoint.title}
                    </h3>
                    <p className="mt-2 text-sm font-semibold text-stone-800">
                      {plan.checkpoint.summary}
                    </p>
                    <ul className="mt-4 space-y-2 text-xs leading-5 text-stone-700">
                      {plan.checkpoint.effects.map((effect) => (
                        <li key={effect} className="flex gap-2">
                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                          {effect}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        disabled={busy}
                        onClick={() => void approve()}
                        className="gap-2 bg-stone-950 text-white hover:bg-stone-800"
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 text-emerald-300" />
                        )}
                        Cho phép AI thực hiện
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void decline()}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Không cho phép
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {plan.status === 'PAYMENT_RETRY_REQUIRED' && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm font-black text-red-900">Booking đã được giữ an toàn.</p>
                <p className="mt-1 text-xs text-red-700">
                  {plan.lastError || 'Bước khởi tạo thanh toán cần thử lại.'}
                </p>
                <Button
                  type="button"
                  onClick={() => void approve()}
                  disabled={busy}
                  className="mt-4 gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Thử lại bước thanh toán
                </Button>
              </div>
            )}

            {(plan.status === 'COMPLETED' || plan.status === 'ACTION_REQUIRED') && (
              <div className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-emerald-600" />
                  <div className="flex-1">
                    <p className="text-lg font-black text-emerald-950">
                      {plan.status === 'COMPLETED'
                        ? 'AI đã hoàn tất luồng đặt tour'
                        : 'AI đã làm xong phần tự động'}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-emerald-900">{plan.summary}</p>
                    {plan.booking && (
                      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
                        <ResultMetric label="Mã booking" value={plan.booking.id.slice(0, 8)} />
                        <ResultMetric label="Trạng thái" value={plan.booking.status} />
                        <ResultMetric label="Tổng tiền" value={money(plan.booking.totalAmount)} />
                      </div>
                    )}
                    {plan.nextAction &&
                      (plan.nextAction.type === 'OPEN_PAYMENT' ? (
                        <Button asChild className="mt-4 gap-2 bg-emerald-800 text-white">
                          <a href={plan.nextAction.href} target="_blank" rel="noreferrer">
                            <CreditCard className="h-4 w-4" />
                            {plan.nextAction.label}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      ) : (
                        <Button asChild className="mt-4 gap-2 bg-emerald-800 text-white">
                          <Link href={plan.nextAction.href}>
                            <WalletCards className="h-4 w-4" />
                            {plan.nextAction.label}
                          </Link>
                        </Button>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {plan.status === 'DECLINED' && (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-700">
                Kế hoạch đã được dừng theo yêu cầu của bạn. Không có booking nào được tạo.
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setPlan(null);
                setError('');
              }}
              className="gap-2 text-stone-600"
            >
              <Sparkles className="h-4 w-4" />
              Lập một kế hoạch mới
            </Button>
          </>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800"
          >
            {error}
          </div>
        )}
      </div>
    </section>
  );
}

function CompactField({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-stone-500">
        {label}
      </span>
      <div className="[&_input]:h-10 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-stone-200 [&_input]:bg-white [&_input]:px-3 [&_input]:text-xs [&_select]:h-10 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-stone-200 [&_select]:bg-white [&_select]:px-3 [&_select]:text-xs">
        {children}
      </div>
    </label>
  );
}

function AgentTimeline({ plan }: { plan: AgentPlan }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex min-w-[760px] items-start">
        {plan.steps.map((step, index) => {
          const done = step.state === 'DONE';
          const active =
            step.state === 'WAITING_APPROVAL' ||
            step.state === 'READY' ||
            step.state === 'ACTION_REQUIRED';
          return (
            <div key={step.id} className="flex flex-1 items-start">
              <div className="min-w-0 flex-1 text-center">
                <div
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border ${
                    done
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : active
                        ? 'border-amber-500 bg-amber-100 text-amber-900'
                        : 'border-stone-200 bg-stone-100 text-stone-400'
                  }`}
                >
                  {done ? (
                    <Check className="h-4 w-4" />
                  ) : active ? (
                    <Clock3 className="h-4 w-4" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </div>
                <p className="mt-2 px-1 text-[10px] font-bold leading-4 text-stone-700">
                  {step.label}
                </p>
              </div>
              {index < plan.steps.length - 1 && (
                <div
                  className={`mt-4 h-px w-5 shrink-0 ${done ? 'bg-emerald-300' : 'bg-stone-200'}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-white/70 p-3">
      <p className="text-[9px] font-black uppercase tracking-wider text-emerald-700">{label}</p>
      <p className="mt-1 font-bold text-stone-900">{value}</p>
    </div>
  );
}
