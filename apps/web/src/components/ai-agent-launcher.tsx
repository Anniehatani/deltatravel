'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Sparkles, ArrowUpRight } from 'lucide-react';

export function AiAgentLauncher() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin') || pathname.startsWith('/assistant')) {
    return null;
  }

  return (
    <Link
      href="/assistant"
      aria-label="Mở DELTA AI Agent"
      className="group fixed bottom-5 right-5 z-[90] flex items-center gap-3 rounded-full border border-white/70 bg-black/90 px-4 py-3 text-white shadow-[0_18px_55px_-18px_rgba(0,0,0,0.65)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-black sm:bottom-7 sm:right-7"
    >
      <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-black shadow-inner">
        <Bot className="h-5 w-5" />
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-black bg-emerald-400" />
      </span>

      <span className="hidden min-w-0 sm:block">
        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] text-amber-300">
          <Sparkles className="h-3 w-3" />
          AI-FIRST
        </span>
        <span className="mt-0.5 block whitespace-nowrap text-xs font-black">
          Để AI lập kế hoạch & đặt tour
        </span>
      </span>

      <ArrowUpRight className="hidden h-4 w-4 text-white/70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:block" />
    </Link>
  );
}
