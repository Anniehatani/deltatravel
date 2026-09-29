'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AssistantResult } from '@tour/shared';
import { assistantApi } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import {
  ArrowRight,
  Bot,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  result?: AssistantResult;
};

function contextForPath(pathname: string, role?: string) {
  const checkout = pathname.match(/^\/checkout\/([^/]+)/);
  const booking = pathname.match(/^\/bookings\/([^/]+)/);
  const tour = pathname.match(/^\/tours\/([^/]+)/);

  if (pathname === '/payments/return') {
    return {
      label: 'trang xác nhận quay về từ thanh toán',
      suggestions: [
        'Giải thích cách hệ thống xác minh trạng thái thanh toán.',
        'Vì sao quay về từ cổng thanh toán chưa có nghĩa là đã PAID?',
        'Tôi nên kiểm tra booking ở đâu sau khi thanh toán?',
      ],
      agentHref: null,
    };
  }
  if (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password') {
    return {
      label: 'khu vực tài khoản ' + pathname,
      suggestions: [
        'Giải thích cách tài khoản Delta Travel được dùng khi đặt tour.',
        'Tôi quên mật khẩu thì quy trình khôi phục như thế nào?',
        'AI Agent cần đăng nhập để làm những hành động nào?',
      ],
      agentHref: null,
    };
  }
  if (pathname.startsWith('/admin')) {
    return {
      label: 'cổng vận hành ' + pathname,
      suggestions: [
        'Hôm nay vận hành có gì cần chú ý?',
        'Có booking hoặc hoàn tiền nào cần xử lý không?',
        'Tóm tắt tình trạng tour và hệ thống cho tôi.',
      ],
      agentHref: null,
    };
  }
  if (checkout) {
    const scheduleId = checkout[1];
    return {
      label: 'checkout của lịch ' + scheduleId,
      suggestions: [
        'Kiểm tra lại giá, số chỗ và rủi ro trước khi tôi đặt.',
        'Giải thích quy trình giữ chỗ và thanh toán cho tôi.',
        'Tôi muốn AI thực hiện quy trình đặt tour này.',
      ],
      agentHref:
        role === 'CUSTOMER'
          ? '/assistant?scheduleId=' +
            encodeURIComponent(scheduleId) +
            '&prompt=' +
            encodeURIComponent('Tiếp tục lập kế hoạch và đặt lịch tôi đang xem.')
          : null,
    };
  }
  if (booking) {
    return {
      label: 'chi tiết booking ' + booking[1],
      suggestions: [
        'Tóm tắt đơn này và cho tôi biết bước tiếp theo.',
        'Đơn này có thể hủy không và điều kiện là gì?',
        'Tôi cần chú ý gì trước ngày khởi hành?',
      ],
      agentHref: null,
    };
  }
  if (pathname === '/bookings') {
    return {
      label: 'danh sách booking của khách hàng',
      suggestions: [
        'Tóm tắt các booking của tôi và việc cần làm.',
        'Đơn nào của tôi đang chờ thanh toán?',
        'Giải thích chính sách hủy áp dụng cho booking của tôi.',
      ],
      agentHref: null,
    };
  }
  if (tour) {
    return {
      label: 'chi tiết tour ' + tour[1],
      suggestions: [
        'Tour này có gì nổi bật và phù hợp với ai?',
        'Hãy giúp tôi chọn lịch hợp lý và giá tốt.',
        'Tôi muốn AI lập kế hoạch để đặt tour này.',
      ],
      agentHref:
        role === 'CUSTOMER'
          ? '/assistant?prompt=' +
            encodeURIComponent('Tôi muốn AI lập kế hoạch để đặt tour tôi vừa xem: ' + tour[1])
          : null,
    };
  }
  if (pathname === '/tours') {
    return {
      label: 'catalog tour production',
      suggestions: [
        'Tìm tour phù hợp nhất cho 2 người lớn.',
        'Gợi ý chuyến đi miền Trung có giá hợp lý.',
        'Tìm tour còn lịch và số chỗ phù hợp.',
      ],
      agentHref:
        role === 'CUSTOMER'
          ? '/assistant?prompt=' +
            encodeURIComponent('Hãy tìm và lập kế hoạch chuyến đi phù hợp cho tôi.')
          : null,
    };
  }
  return {
    label: 'website Delta Travel',
    suggestions: [
      'Giúp tôi tìm chuyến đi phù hợp.',
      'Tôi có ngân sách 8 triệu cho 2 người, nên đi đâu?',
      'AI có thể tự đặt tour giúp tôi như thế nào?',
    ],
    agentHref:
      role === 'CUSTOMER'
        ? '/assistant?prompt=' +
          encodeURIComponent('Hãy giúp tôi lập kế hoạch một chuyến đi phù hợp.')
        : null,
  };
}

export function AiAgentLauncher() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const context = useMemo(() => contextForPath(pathname, user?.role), [pathname, user?.role]);

  useEffect(() => {
    if (!open) return;

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 80);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (pathname.startsWith('/assistant') || pathname.startsWith('/admin')) return null;

  const send = async (value = input) => {
    const clean = value.trim();
    if (!clean || busy) return;

    const history = messages.slice(-8).map((message) => ({
      role: message.role,
      content: message.content,
    }));
    const userMessage: Message = { role: 'user', content: clean };
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setBusy(true);
    setError('');

    try {
      const result = await assistantApi.chat({
        message:
          clean +
          '\n\nBối cảnh hiện tại: ' +
          context.label +
          '. Hãy ưu tiên dữ liệu production có thể kiểm chứng và không bịa giá, số chỗ hoặc trạng thái.',
        history,
        lang,
      });
      setMessages((current) => [...current, { role: 'assistant', content: result.reply, result }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'AI chưa thể phản hồi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside aria-label="DELTA AI Command Center">
      <button
        type="button"
        data-testid="ai-command-center-launcher"
        aria-label="Mở DELTA AI Command Center"
        aria-expanded={open}
        aria-controls="delta-ai-command-center"
        onClick={() => setOpen(true)}
        className="group fixed bottom-5 right-5 z-[90] flex items-center gap-3 rounded-full border border-white/70 bg-black/90 px-4 py-3 text-white shadow-[0_18px_55px_-18px_rgba(0,0,0,0.65)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-black sm:bottom-7 sm:right-7"
      >
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-black shadow-inner">
          <Bot className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-black bg-emerald-400" />
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] text-amber-300">
            <Sparkles className="h-3 w-3" />
            AI COMMAND CENTER
          </span>
          <span className="mt-0.5 block whitespace-nowrap text-xs font-black">
            Hỏi AI về trang đang xem
          </span>
        </span>
        <MessageCircle className="hidden h-4 w-4 text-white/70 sm:block" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-end bg-black/30 p-0 backdrop-blur-[2px] sm:p-5">
          <button
            type="button"
            aria-label="Đóng DELTA AI"
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
          />
          <section
            id="delta-ai-command-center"
            data-testid="ai-command-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delta-ai-command-title"
            className="relative z-10 flex h-[82vh] w-full flex-col overflow-hidden rounded-t-[30px] border border-white/60 bg-white shadow-2xl sm:h-[720px] sm:max-h-[88vh] sm:w-[440px] sm:rounded-[30px]"
          >
            <header className="bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.25),transparent_38%),linear-gradient(135deg,#0c0a09,#1c1917_60%,#422006)] p-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    DELTA AI • PAGE-AWARE
                  </div>
                  <h2 id="delta-ai-command-title" className="mt-2 text-lg font-black">
                    AI hiểu trang bạn đang xem
                  </h2>
                  <p className="mt-1 text-[11px] leading-5 text-white/65">
                    Bối cảnh: {context.label}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Đóng"
                  className="rounded-full border border-white/15 bg-white/10 p-2 transition hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/10 px-3 py-2 text-[10px] font-bold text-emerald-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                AI đọc dữ liệu theo quyền hiện tại. Side effect vẫn cần phê duyệt rõ ràng.
              </div>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                    Gợi ý theo ngữ cảnh
                  </p>
                  {context.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void send(suggestion)}
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-3 text-left text-xs font-semibold leading-5 text-stone-800 transition hover:border-amber-300 hover:bg-amber-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                >
                  <div
                    data-testid={
                      message.role === 'assistant'
                        ? 'ai-command-center-message-assistant'
                        : 'ai-command-center-message-user'
                    }
                    className={
                      message.role === 'user'
                        ? 'max-w-[88%] rounded-2xl rounded-tr-sm bg-stone-950 px-4 py-3 text-xs leading-5 text-white'
                        : 'max-w-[92%] rounded-2xl rounded-tl-sm border border-stone-200 bg-stone-50 px-4 py-3 text-xs leading-5 text-stone-800'
                    }
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.result && message.result.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.result.actions.map((action) => (
                          <Link
                            key={action.label + action.href}
                            href={action.href}
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-[9px] font-black text-stone-900"
                          >
                            {action.label}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {busy && (
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                  AI đang đọc bối cảnh và dữ liệu production...
                </div>
              )}

              {error && (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">
                  {error}
                </p>
              )}

              {context.agentHref && (
                <Link
                  href={context.agentHref}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-black text-amber-950"
                >
                  <span>Chuyển sang AI Agent có thể hành động</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
              className="border-t border-stone-200 bg-white p-4"
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="Hỏi AI về trang hiện tại..."
                  className="min-h-[46px] flex-1 resize-none rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-xs outline-none focus:border-amber-400 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  aria-label="Gửi cho AI"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-950 text-white transition hover:bg-stone-800 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </aside>
  );
}
