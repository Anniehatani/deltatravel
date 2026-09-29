'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { AssistantResult } from '@tour/shared';
import { assistantApi } from '@/lib/api';
import { useLanguage } from '@/providers/language-provider';
import { Bot, Sparkles, Loader2, ArrowRight, RefreshCcw, ShieldCheck } from 'lucide-react';

type AiContextCardProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  prompt: string;
  context?: string;
  suggestions?: string[];
  autoRun?: boolean;
  agentHref?: string;
  compact?: boolean;
  className?: string;
  onResult?: (result: AssistantResult) => void;
};

export function AiContextCard({
  eyebrow = 'DELTA AI • CONTEXT AWARE',
  title,
  description,
  prompt,
  context,
  suggestions = [],
  autoRun = false,
  agentHref,
  compact = false,
  className = '',
  onResult,
}: AiContextCardProps) {
  const { lang } = useLanguage();
  const [query, setQuery] = useState(prompt);
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const autoKey = useRef('');
  const autoRetryCount = useRef(0);
  const retryTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setQuery(prompt);
  }, [prompt]);

  useEffect(
    () => () => {
      if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
    },
    [],
  );

  const contextPrompt = useMemo(
    () =>
      context
        ? [
            'Bối cảnh giao diện hiện tại: ' + context + '.',
            'Hãy ưu tiên dữ liệu production mà hệ thống có thể kiểm chứng, không bịa giá, chỗ hoặc trạng thái.',
          ].join(' ')
        : '',
    [context],
  );

  const run = async (nextQuery = query) => {
    const clean = nextQuery.trim();
    if (!clean || busy) return;

    setBusy(true);
    setError('');
    try {
      const response = await assistantApi.chat({
        message: contextPrompt ? clean + '\n\n' + contextPrompt : clean,
        history: [],
        lang,
      });
      setResult(response);
      onResult?.(response);
      setQuery(clean);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'AI chưa thể phản hồi lúc này.');
      if (autoRun && autoRetryCount.current < 1) {
        autoRetryCount.current += 1;
        retryTimerRef.current = window.setTimeout(() => {
          void run(clean);
        }, 1500);
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!autoRun || !prompt.trim()) return;
    const key = prompt + '|' + context;
    if (autoKey.current === key) return;
    autoKey.current = key;
    autoRetryCount.current = 0;
    void run(prompt);
  }, [autoRun, prompt, context]);

  return (
    <section
      data-ai-surface="context-card"
      className={
        'overflow-hidden rounded-[26px] border border-amber-200/70 bg-white shadow-[0_22px_70px_-40px_rgba(0,0,0,0.38)] ' +
        className
      }
    >
      <div className="bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.22),transparent_36%),linear-gradient(135deg,#0c0a09,#1c1917_60%,#422006)] px-5 py-5 text-white sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              {eyebrow}
            </div>
            <h2
              className={
                compact ? 'mt-2 text-lg font-black' : 'mt-2 text-xl font-black sm:text-2xl'
              }
            >
              {title}
            </h2>
            {description && (
              <p className="mt-2 max-w-3xl text-xs leading-5 text-white/70 sm:text-sm">
                {description}
              </p>
            )}
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Production-aware
          </div>
        </div>
      </div>

      <div className={compact ? 'space-y-4 p-4 sm:p-5' : 'space-y-5 p-5 sm:p-6'}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            rows={compact ? 2 : 3}
            maxLength={2000}
            aria-label="Yêu cầu cho DELTA AI"
            className="min-h-[48px] flex-1 resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs leading-5 text-stone-900 outline-none transition focus:border-amber-400 focus:bg-white"
          />
          <button
            type="button"
            onClick={() => void run()}
            disabled={busy || !query.trim()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 py-3 text-xs font-black text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            {busy ? 'AI đang phân tích' : 'Hỏi AI'}
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                disabled={busy}
                onClick={() => {
                  setQuery(item);
                  void run(item);
                }}
                className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-[10px] font-bold text-stone-700 transition hover:border-amber-300 hover:bg-amber-50"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800"
          >
            <span>{error}</span>
            <button type="button" onClick={() => void run()} aria-label="Thử lại">
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
        )}

        {result && (
          <div
            data-ai-response="true"
            className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 sm:p-5"
          >
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-800">
              <Bot className="h-4 w-4" />
              AI insight • {result.mode}
            </div>
            <p className="whitespace-pre-wrap text-xs leading-6 text-stone-800 sm:text-sm">
              {result.reply}
            </p>

            {(result.actions.length > 0 || agentHref) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {result.actions.map((action) => (
                  <Link
                    key={action.label + action.href}
                    href={action.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3.5 py-2 text-[10px] font-black text-stone-900 transition hover:border-amber-400 hover:bg-amber-50"
                  >
                    {action.label}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ))}
                {agentHref && (
                  <Link
                    href={agentHref}
                    className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-[10px] font-black text-black transition hover:bg-amber-300"
                  >
                    Để AI tiếp tục hành động
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            )}

            {result.sources.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-stone-200 pt-3">
                {result.sources.map((source) => (
                  <span
                    key={source.type + source.id}
                    className="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold text-stone-500 ring-1 ring-stone-200"
                  >
                    {source.type} • {source.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
