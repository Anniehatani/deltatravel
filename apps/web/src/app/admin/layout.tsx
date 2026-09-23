'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RequireAuth } from '@/components/require-auth';
import {
  LayoutDashboard,
  Compass,
  Calendar,
  Ticket,
  CreditCard,
  FileText,
  Cpu,
} from 'lucide-react';

const ADMIN_NAV_LINKS = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/system', label: 'Lệnh Tối Cao & AI', icon: Cpu },
  { href: '/admin/tours', label: 'Tour', icon: Compass },
  { href: '/admin/schedules', label: 'Lịch khởi hành', icon: Calendar },
  { href: '/admin/bookings', label: 'Đơn đặt', icon: Ticket },
  { href: '/admin/payments', label: 'Thanh toán & Hoàn', icon: CreditCard },
  { href: '/admin/audit-logs', label: 'Nhật ký kiểm toán', icon: FileText },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RequireAuth roles={['ADMIN', 'OPERATIONS']}>
      <div className="pt-20 sm:pt-24 border-b border-stone-200/80 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-6 py-2.5 lg:px-8 text-xs font-medium text-stone-600">
          <span className="font-serif font-bold text-stone-900 pr-2 border-r border-stone-200 mr-1 hidden sm:inline-block">
            Phân Hệ Vận Hành
          </span>
          {ADMIN_NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 transition ${
                  isActive
                    ? 'bg-amber-100/70 text-amber-950 font-semibold'
                    : 'hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <div>{children}</div>
    </RequireAuth>
  );
}

