'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { RequireAuth } from '@/components/require-auth';
import { useAuth } from '@/providers/auth-provider';
import {
  LayoutDashboard,
  Compass,
  Calendar,
  Ticket,
  CreditCard,
  FileText,
  Cpu,
  Activity,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const ADMIN_NAV_LINKS = [
  { href: '/admin/tours', label: 'Quản lý Tour', icon: Compass, badge: 'CHÍNH' },
  { href: '/admin/schedules', label: 'Lịch khởi hành & Slot', icon: Calendar },
  { href: '/admin/bookings', label: 'Quản lý Đơn & Sao kê', icon: Ticket },
  { href: '/admin/payments', label: 'Thanh toán & Hoàn tiền', icon: CreditCard },
  { href: '/admin/system', label: 'Cấu hình AI & Hệ thống', icon: Cpu },
  { href: '/admin/audit-logs', label: 'Nhật ký kiểm toán', icon: FileText },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  return (
    <RequireAuth roles={['ADMIN', 'OPERATIONS']}>
      <div className="flex min-h-screen bg-stone-100 text-stone-900">
        {/* ─── LEFT SIDEBAR: Admin Operations ─── */}
        <aside className="w-64 lg:w-72 shrink-0 bg-neutral-950 text-white border-r border-neutral-800 flex flex-col justify-between sticky top-0 h-screen overflow-y-auto select-none z-30">
          <div>
            {/* Brand Logo & Commercial Operations Banner */}
            <div className="p-5 border-b border-neutral-800/80">
              <Link href="/admin/tours" className="flex items-center gap-3">
                <div className="relative h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center p-1.5 shadow-md">
                  <Image
                    src="/favicon_logo_delta.png"
                    alt="DELTA TRAVEL"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                </div>
                <div>
                  <span className="text-sm font-black tracking-widest text-white uppercase block">
                    DELTA TRAVEL
                  </span>
                  <span className="text-[10px] font-mono tracking-wider text-amber-400 font-bold block">
                    PORTAL QUẢN TRỊ THỰC TẾ
                  </span>
                </div>
              </Link>

              {/* Admin Identity Badge */}
              <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900/90 p-2.5 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-amber-500 flex items-center justify-center text-neutral-950 font-black text-xs shrink-0 shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="text-xs font-bold text-white truncate">{user?.name || 'Quản trị viên'}</div>
                  <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-amber-400 shrink-0" />
                    <span>QUẢN TRỊ VIÊN HỆ THỐNG</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs (Vertical on the LEFT) */}
            <nav className="p-3 space-y-1" aria-label="Menu quản trị bên trái">
              <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-neutral-500">
                Menu Quản Trị Hệ Thống
              </div>
              {ADMIN_NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive =
                  pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-amber-500 text-neutral-950 font-bold shadow-lg shadow-amber-500/20'
                        : 'text-neutral-300 hover:bg-neutral-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-neutral-950' : 'text-neutral-400'}`} />
                      <span>{link.label}</span>
                    </div>

                    {link.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                          isActive
                            ? 'bg-neutral-950 text-amber-400'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Actions: Back to Website & Logout */}
          <div className="p-3 border-t border-neutral-800/80 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/70 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Về trang khách (Website)</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-medium text-red-400 hover:text-red-200 hover:bg-red-950/40 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        </aside>

        {/* ─── RIGHT MAIN PANE: Page Content Display ─── */}
        <main className="flex-1 min-h-screen overflow-y-auto bg-stone-50/70 p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* ─── Logout Confirmation Dialog ─── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-stone-200 text-stone-900 animate-scale-up"
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shadow-sm">
              <LogOut className="h-6 w-6" />
            </div>

            <h3 className="text-center font-bold text-lg text-stone-900">
              Xác Nhận Đăng Xuất
            </h3>
            <p className="mt-2 text-center text-xs text-stone-600 leading-relaxed">
              Bạn có chắc chắn muốn đăng xuất khỏi phiên làm việc quản trị của DELTA TRAVEL không?
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs font-bold hover:bg-stone-100 transition active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  void logout();
                }}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition active:scale-95"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </RequireAuth>
  );
}
