'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import type { AssistantResult } from '@tour/shared';
import { assistantApi } from '@/lib/api';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import {
  Sparkles,
  Send,
  ShieldCheck,
  Compass,
  ArrowRight,
  Bot,
  User,
  Info,
  ExternalLink,
} from 'lucide-react';

type MessageItem = {
  role: 'user' | 'assistant';
  content: string;
  result?: AssistantResult;
};

export default function AssistantPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const suggestedQuestions = [
    t('asst_q1'),
    t('asst_q2'),
    t('asst_q3'),
    t('asst_q4'),
  ];

  // Sync avatar in real time with AccountModal and Navbar
  useEffect(() => {
    const updateAvatar = () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tour_avatar');
        const emailKey = user?.email?.toLowerCase().trim();
        const stored = (emailKey && localStorage.getItem(`tour_avatar_${emailKey}`)) || '';
        setUserAvatar(stored);
      }
    };
    updateAvatar();
    window.addEventListener('tour_avatar_updated', updateAvatar);
    return () => window.removeEventListener('tour_avatar_updated', updateAvatar);
  }, [user]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || busy) return;
    setBusy(true);
    setError('');

    const userMsg = queryText.trim();
    setInputMessage('');

    // Prepare history (maximum 8 previous items)
    const historyPayload = messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Optimistically append user message
    const updatedMessages: MessageItem[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(updatedMessages);

    try {
      const res = await assistantApi.chat({
        message: userMsg,
        history: historyPayload,
        lang,
      });

      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: res.reply,
          result: res,
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('asst_connect_error'));
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendQuery(inputMessage);
  };

  return (
    <PageShell
      badge={t('asst_badge')}
      title={t('asst_title')}
      description={t('asst_desc')}
    >
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Quick Suggestion Chips */}
        {messages.length === 0 && (
          <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-luxury">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-800 mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>{t('asst_suggestions_title')}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void sendQuery(q)}
                  className="text-left rounded-xl border border-stone-200 bg-[#faf9f5] p-3 text-xs text-stone-700 hover:border-amber-400 hover:bg-amber-50/50 transition duration-150 flex items-center justify-between group"
                >
                  <span>{q}</span>
                  <ArrowRight className="h-3 w-3 text-stone-400 group-hover:text-amber-700 transition group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat History Flow */}
        <div className="space-y-6">
          {messages.map((item, idx) => (
            <div
              key={idx}
              className={`flex gap-3.5 ${
                item.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {item.role === 'assistant' && (
                <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 mt-1">
                  <Bot className="h-5 w-5" />
                </div>
              )}

              <div
                className={`rounded-2xl p-5 max-w-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                  item.role === 'user'
                    ? 'bg-stone-900 text-white rounded-tr-none'
                    : 'bg-white border border-stone-200/80 text-stone-800 rounded-tl-none space-y-4'
                }`}
              >
                {/* Mode Indicator for Assistant */}
                {item.role === 'assistant' && item.result && (
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100 text-[10px] text-stone-400 uppercase tracking-wider">
                    <span>
                      {item.result.mode === 'GROQ'
                        ? t('asst_groq_badge')
                        : item.result.mode === 'GEMINI'
                          ? t('asst_smart_badge')
                          : t('asst_rule_badge')}
                    </span>
                    <span className="text-emerald-700 font-semibold lowercase">{t('asst_verified')}</span>
                  </div>
                )}

                <p className="whitespace-pre-line leading-6">{item.content}</p>

                {/* Direct Action Links */}
                {item.result && item.result.actions.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {item.result.actions.map((act) => (
                      <Button
                        key={act.href}
                        asChild
                        variant="outline"
                        className="text-xs h-8 px-3 rounded-lg border-stone-300 hover:bg-stone-100 gap-1.5"
                      >
                        <Link href={act.href}>
                          <span>{act.label}</span>
                          <ExternalLink className="h-3 w-3 text-stone-400" />
                        </Link>
                      </Button>
                    ))}
                  </div>
                )}

                {/* Verified Sources */}
                {item.result && item.result.sources.length > 0 && (
                  <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                    <span className="font-semibold text-stone-600 block mb-1">{t('asst_sources_title')}</span>
                    <ul className="list-disc list-inside space-y-0.5 text-stone-500">
                      {item.result.sources.map((s) => (
                        <li key={`${s.type}-${s.id}`}>{s.label}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {item.role === 'user' && (
                <div className="h-9 w-9 rounded-full overflow-hidden shrink-0 mt-1 border border-black/10 shadow-sm bg-neutral-900 flex items-center justify-center">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={user?.name || 'User'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-stone-200 flex items-center justify-center text-stone-700">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {busy && (
            <div className="flex gap-3.5 items-center text-xs text-stone-500">
              <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                <Bot className="h-5 w-5 animate-pulse" />
              </div>
              <div className="rounded-2xl bg-white border border-stone-200/80 p-4 shadow-sm text-stone-500 italic">
                {t('asst_waiting')}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700" role="alert">
            {error}
          </div>
        )}

        {/* Input Box */}
        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-luxury">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={t('asst_placeholder')}
              maxLength={2000}
              required
              disabled={busy}
              className="flex-1 text-sm bg-stone-50/60 border-stone-200 focus:bg-white"
            />
            <Button
              type="submit"
              disabled={busy || !inputMessage.trim()}
              className="bg-stone-900 hover:bg-stone-800 text-white px-5 rounded-xl gap-1.5 shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('asst_send')}</span>
            </Button>
          </form>

          <p className="mt-3 text-[11px] text-stone-400 flex items-center gap-1.5 px-1">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>
              {t('asst_disclaimer')}
            </span>
          </p>
        </div>
      </div>
    </PageShell>
  );
}

