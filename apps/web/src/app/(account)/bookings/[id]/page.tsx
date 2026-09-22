'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { bookingApi, paymentApi } from '@/lib/api';
import type { Booking, Provider } from '@tour/shared';
import { BOOKING_LABELS, canCustomerCancel } from '@tour/shared';
import { formatVND, formatDate, formatDateTime } from '@/lib/format';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Phone,
  Mail,
  User,
  RefreshCcw,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

const PROVIDER_INFO: Record<Provider, { label: string; desc: string; color: string }> = {
  VNPAY: {
    label: 'VNPay QR / Thẻ nội địa',
    desc: 'Quét mã QR từ 40+ ứng dụng ngân hàng và ví điện tử',
    color: 'border-black hover:bg-black hover:text-white',
  },
  MOMO: {
    label: 'Ví MoMo',
    desc: 'Thanh toán siêu tốc qua ứng dụng MoMo an toàn',
    color: 'border-black hover:bg-black hover:text-white',
  },
  ZALOPAY: {
    label: 'ZaloPay',
    desc: 'Xác thực thanh toán liền mạch trong hệ sinh thái Zalo',
    color: 'border-black hover:bg-black hover:text-white',
  },
};

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.id;
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Countdown timer logic
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);

  // Payment processing state
  const [selectedProvider, setSelectedProvider] = useState<Provider>('VNPAY');
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Cancel booking modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchBooking = () => {
    setLoading(true);
    setError(null);
    bookingApi
      .get(bookingId)
      .then((data) => {
        setBooking(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không thể tải chi tiết đơn hàng.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Accurate monotonic countdown based on expiresAt and serverTime
  useEffect(() => {
    if (!booking || booking.status !== 'PENDING_PAYMENT') {
      setTimeLeftMs(null);
      return;
    }

    const expiresTime = new Date(booking.expiresAt).getTime();
    const serverTime = new Date(booking.serverTime).getTime();
    const mountClientTime = performance.now();

    const updateTimer = () => {
      const elapsedSinceMount = performance.now() - mountClientTime;
      const currentSimulatedTime = serverTime + elapsedSinceMount;
      const remaining = Math.max(0, expiresTime - currentSimulatedTime);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        // Time expired, refresh booking status
        fetchBooking();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  const handlePay = async () => {
    if (!booking) return;
    setPaying(true);
    setPaymentError(null);

    try {
      const payment = await paymentApi.create({
        bookingId: booking.id,
        provider: selectedProvider,
      });

      if (payment.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
      } else {
        setPaymentError('Không nhận được liên kết thanh toán từ cổng.');
      }
    } catch (err) {
      setPaymentError(
        err instanceof Error
          ? err.message
          : 'Cổng thanh toán chưa sẵn sàng hoặc gặp sự cố kết nối.',
      );
    } finally {
      setPaying(false);
    }
  };

  const handleCancelBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || cancelReason.trim().length < 3) return;

    setCancelling(true);
    setCancelError(null);

    try {
      const updated = await bookingApi.cancel(booking.id, cancelReason.trim());
      setBooking(updated);
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err) {
      setCancelError(
        err instanceof Error ? err.message : 'Không thể hủy đơn. Vui lòng thử lại sau.',
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded bg-stone-200" />
          <div className="h-48 rounded-2xl bg-stone-100" />
          <div className="h-64 rounded-2xl bg-stone-100" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="rounded-2xl border border-stone-200 bg-white p-12 shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-stone-400 mb-4" />
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            Không tìm thấy thông tin đơn hàng
          </h2>
          <p className="mt-2 text-sm text-stone-600 mb-6">
            {error || 'Mã đơn không tồn tại hoặc bạn không có quyền truy cập.'}
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={fetchBooking} className="gap-2">
              <RefreshCcw className="h-4 w-4" /> Thử lại
            </Button>
            <Button asChild className="bg-stone-900 text-white">
              <Link href="/bookings">Về danh sách đơn</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isPending = booking.status === 'PENDING_PAYMENT';
  const isPaid = booking.status === 'PAID';
  const isCancelled = booking.status === 'CANCELLED';

  const formatCountdown = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const eligibleForCancel = canCustomerCancel(
    booking.status,
    new Date(booking.departureAt),
    new Date(),
  );

  return (
    <PageShell
      badge="Chi Tiết Đơn Hàng"
      title={booking.tourTitle}
      description={`Mã đơn: ${booking.id} · Tạo lúc ${formatDateTime(booking.createdAt)}`}
      action={
        <Button asChild variant="outline" className="gap-2 text-xs">
          <Link href="/bookings">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Danh sách đơn</span>
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Booking Details & Contact Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Status Alert Banner - Pure Monochrome */}
          {isPending && (
            <div className="rounded-xl border-2 border-black bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded border border-black flex items-center justify-center text-black">
                    <Clock className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-black text-black text-sm uppercase">
                      Chờ Thanh Toán — Thời Hạn Giữ Chỗ 15 Phút
                    </h3>
                    <p className="text-xs text-neutral-700 mt-0.5 font-medium">
                      Vui lòng chọn cổng và hoàn tất trước khi hết thời gian khóa chỗ.
                    </p>
                  </div>
                </div>

                {timeLeftMs !== null && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">
                      Còn lại
                    </span>
                    <span className="font-mono text-2xl font-black text-black">
                      {formatCountdown(timeLeftMs)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {isPaid && (
            <div className="rounded-xl border-2 border-black bg-black text-white p-6 shadow-sm flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-white shrink-0" />
              <div>
                <h3 className="font-black text-white text-sm uppercase">Đã Thanh Toán Thành Công</h3>
                <p className="text-xs text-neutral-300 mt-0.5">
                  Đơn hàng đã được thanh toán lúc {booking.paidAt ? formatDateTime(booking.paidAt) : ''}. Nhân viên chăm sóc sẽ liên hệ hỗ trợ bạn trước ngày khởi hành.
                </p>
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="rounded-xl border-2 border-dashed border-black bg-white p-6 flex items-center gap-4">
              <XCircle className="h-8 w-8 text-black shrink-0" />
              <div>
                <h3 className="font-black text-black text-sm uppercase">Đơn Đặt Chỗ Đã Bị Hủy</h3>
                <p className="text-xs text-neutral-700 mt-0.5">
                  Lý do: {booking.cancelReason || 'Hết hạn thời gian thanh toán hoặc người dùng tự hủy.'}
                </p>
              </div>
            </div>
          )}

          {/* Departure & Schedule Summary */}
          <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-luxury">
            <h2 className="font-serif text-xl font-bold text-stone-900 mb-6 flex items-center gap-2 pb-4 border-b border-stone-100">
              <Calendar className="h-5 w-5 text-amber-700" />
              <span>Hành Trình Khởi Hành</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-[#faf9f5] border border-stone-200/70">
                <span className="text-xs text-stone-500 block">Ngày khởi hành</span>
                <span className="font-semibold text-stone-900 text-base mt-1 block">
                  {formatDate(booking.departureAt)}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#faf9f5] border border-stone-200/70">
                <span className="text-xs text-stone-500 block">Số lượng khách</span>
                <span className="font-semibold text-stone-900 text-base mt-1 block">
                  {booking.adults} Người lớn {booking.children > 0 && `, ${booking.children} Trẻ em`}
                </span>
              </div>
            </div>

            {/* Price Line Breakdown */}
            <div className="mt-6 border-t border-stone-100 pt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">
                Chi tiết dòng tiền
              </h4>
              <div className="space-y-3">
                {booking.details.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-stone-600">
                      {item.kind === 'ADULT' ? 'Vé người lớn' : 'Vé trẻ em'} × {item.quantity}
                    </span>
                    <span className="font-semibold text-stone-900">
                      {formatVND(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Representative */}
          <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-luxury">
            <h2 className="font-serif text-xl font-bold text-stone-900 mb-4 flex items-center gap-2 pb-4 border-b border-stone-100">
              <User className="h-5 w-5 text-amber-700" />
              <span>Thông Tin Người Đại Diện</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-600">
              <div>
                <span className="text-stone-400 block mb-1">Họ tên</span>
                <strong className="text-stone-900 text-sm">{booking.contactName}</strong>
              </div>
              <div>
                <span className="text-stone-400 block mb-1">Email</span>
                <strong className="text-stone-900 text-sm">{booking.contactEmail}</strong>
              </div>
              <div>
                <span className="text-stone-400 block mb-1">Số điện thoại</span>
                <strong className="text-stone-900 text-sm">{booking.contactPhone}</strong>
              </div>
            </div>
          </div>

          {/* Cancellation Option (When eligible) */}
          {eligibleForCancel && (
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-stone-900">Bạn muốn hủy đơn này?</h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Đơn hợp lệ hủy miễn phí trước giờ khởi hành ít nhất 72 tiếng theo quy định.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(true)}
                className="text-red-700 border-red-200 hover:bg-red-50 text-xs"
              >
                Yêu cầu hủy đơn
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Payment & Total Amount */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-luxury space-y-6">
            <div className="pb-4 border-b border-stone-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                Tổng thanh toán
              </span>
              <span className="font-serif text-3xl font-bold text-amber-900 block mt-1">
                {formatVND(booking.totalAmount)}
              </span>
              <span className="text-xs text-stone-500 mt-1 block">
                Trạng thái: <strong>{BOOKING_LABELS[booking.status]}</strong>
              </span>
            </div>

            {/* Payment Gateway Options (When PENDING_PAYMENT) */}
            {isPending && (
              <div className="space-y-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block">
                  Chọn Cổng Thanh Toán
                </label>

                <div className="space-y-3">
                  {(['VNPAY', 'MOMO', 'ZALOPAY'] as Provider[]).map((prov) => {
                    const info = PROVIDER_INFO[prov];
                    const isSelected = selectedProvider === prov;

                    return (
                      <div
                        key={prov}
                        onClick={() => setSelectedProvider(prov)}
                        className={`p-4 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900'
                            : info.color
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-stone-900">{info.label}</span>
                          <input
                            type="radio"
                            name="provider"
                            checked={isSelected}
                            onChange={() => setSelectedProvider(prov)}
                            className="w-4 h-4 text-stone-900"
                          />
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">{info.desc}</p>
                      </div>
                    );
                  })}
                </div>

                {paymentError && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-start gap-2" role="alert">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <Button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3.5 rounded-xl shadow-md text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>{paying ? 'Đang kết nối cổng...' : `Thanh toán qua ${selectedProvider}`}</span>
                </Button>
              </div>
            )}

            <div className="pt-2 text-stone-500 text-[11px] leading-relaxed border-t border-stone-100">
              <ShieldCheck className="h-4 w-4 text-emerald-700 inline mr-1" />
              Giao dịch qua cổng bảo mật tiêu chuẩn ngân hàng. Sau khi thanh toán, hệ thống sẽ xác nhận và cập nhật trạng thái tự động.
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal Confirmation */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-stone-200">
            <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
              Xác Nhận Hủy Đặt Tour
            </h3>
            <p className="text-xs text-stone-600 mb-4">
              Hành động này sẽ giải phóng kho chỗ đã giữ và hủy đơn đặt của bạn.
            </p>

            <form onSubmit={handleCancelBooking} className="space-y-4">
              <div>
                <label htmlFor="cancelReason" className="text-xs font-semibold">
                  Lý do hủy tour * (tối thiểu 3 ký tự)
                </label>
                <textarea
                  id="cancelReason"
                  rows={3}
                  required
                  minLength={3}
                  maxLength={500}
                  placeholder="Ví dụ: Thay đổi kế hoạch công tác đột xuất..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>

              {cancelError && (
                <p role="alert" className="text-xs text-red-600">
                  {cancelError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="text-xs"
                >
                  Đóng lại
                </Button>
                <Button
                  type="submit"
                  disabled={cancelling || cancelReason.trim().length < 3}
                  className="bg-red-700 hover:bg-red-800 text-white text-xs"
                >
                  {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}

