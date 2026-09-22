'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BOOKING_LABELS, IdSchema } from '@tour/shared';
import { bookingApi } from '@/lib/api';
import { PageShell } from '@/components/page-shell';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

function Result() {
  const params = useSearchParams();
  const id = params.get('bookingId');
  const { loading, user } = useAuth();
  const [status, setStatus] = useState('Đang đối soát trạng thái từ hệ sinh thái thanh toán...');
  const [statusCode, setStatusCode] = useState<string>('PENDING_PAYMENT');

  useEffect(() => {
    if (loading || !user || !IdSchema.safeParse(id).success) return;
    let stopped = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const booking = await bookingApi.get(id!);
        if (stopped) return;
        setStatusCode(booking.status);
        setStatus(BOOKING_LABELS[booking.status] || booking.status);
        if (booking.status === 'PENDING_PAYMENT' && ++tries < 20) {
          timer = setTimeout(poll, 3000);
        }
      } catch (e) {
        if (!stopped) {
          setStatus(e instanceof Error ? e.message : 'Chưa thể kiểm tra trạng thái.');
        }
      }
    };

    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [id, loading, user]);

  if (!IdSchema.safeParse(id).success) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-luxury max-w-lg mx-auto">
        <AlertCircle className="mx-auto h-12 w-12 text-stone-400 mb-3" />
        <h3 className="font-serif text-xl font-bold text-stone-900">Mã đơn không hợp lệ</h3>
        <p className="mt-2 text-xs text-stone-500 mb-6">
          Đường dẫn không chứa mã đơn hoặc định dạng mã không đúng chuẩn hệ thống.
        </p>
        <Button asChild className="bg-stone-900 text-white text-xs">
          <Link href="/bookings">Tra cứu đơn của tôi</Link>
        </Button>
      </div>
    );
  }

  if (!loading && !user) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-luxury max-w-lg mx-auto">
        <p className="text-sm text-stone-700 mb-4">Vui lòng đăng nhập tài khoản để đối soát thông tin đơn.</p>
        <Button asChild className="bg-stone-900 text-white text-xs">
          <Link href="/login">Đăng nhập ngay</Link>
        </Button>
      </div>
    );
  }

  const isPaid = statusCode === 'PAID' || statusCode === 'CONFIRMED';

  return (
    <div className="rounded-3xl border border-stone-200/80 bg-white p-10 shadow-luxury max-w-xl mx-auto text-center space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-800 ring-1 ring-amber-200">
        {isPaid ? (
          <CheckCircle2 className="h-8 w-8 text-emerald-700" />
        ) : (
          <Clock className="h-8 w-8 text-amber-700 animate-spin" />
        )}
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 block mb-1">
          Xác Thực Giao Dịch
        </span>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-stone-900">
          {status}
        </h2>
        <p className="mt-2 text-xs text-stone-500 leading-relaxed max-w-md mx-auto">
          Hệ thống đang tự động đồng bộ kết quả trực tiếp từ cổng thanh toán qua webhook an toàn.
        </p>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button asChild className="w-full sm:w-auto bg-stone-900 hover:bg-stone-800 text-white text-xs px-6 py-2.5">
          <Link href={`/bookings/${id}`}>
            <span>Xem chi tiết chuyến đi</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1.5 inline" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto text-xs px-6 py-2.5">
          <Link href="/bookings">Danh sách đơn của tôi</Link>
        </Button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <PageShell
      badge="Đối Soát Đơn Hàng"
      title="Kết Quả Thanh Toán"
      description="Trạng thái giao dịch được xác thực trực tiếp và an toàn từ hệ thống Việt Hành."
    >
      <Suspense fallback={<div className="p-12 text-center text-sm text-stone-500">Đang kiểm tra kết quả...</div>}>
        <Result />
      </Suspense>
    </PageShell>
  );
}

