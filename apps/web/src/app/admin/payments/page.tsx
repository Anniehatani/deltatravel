'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import type { Payment } from '@tour/shared';
import { formatVND, formatDate, formatDateTime } from '@/lib/format';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';

const PAYMENT_STATUS_STYLE: Record<string, string> = {
  INITIATED: 'bg-stone-100 text-stone-800 border-stone-300',
  SUCCEEDED: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  FAILED: 'bg-red-100 text-red-900 border-red-300',
  REFUND_REQUIRED: 'bg-amber-100 text-amber-950 border-amber-300',
  REFUNDED: 'bg-purple-100 text-purple-900 border-purple-300',
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cash receipt modal
  const [cashPaymentId, setCashPaymentId] = useState<string | null>(null);
  const [cashReference, setCashReference] = useState('');
  const [cashNote, setCashNote] = useState('');
  const [submittingCash, setSubmittingCash] = useState(false);
  const [cashError, setCashError] = useState<string | null>(null);

  // Refund Modal
  const [refundPaymentId, setRefundPaymentId] = useState<string | null>(null);
  const [refundRef, setRefundRef] = useState('');
  const [refundNote, setRefundNote] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const fetchPayments = () => {
    setLoading(true);
    setError(null);
    adminApi
      .payments()
      .then((res) => {
        setPayments(res.items);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách thanh toán.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRecordCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashPaymentId || cashReference.trim().length < 3) return;

    setSubmittingCash(true);
    setCashError(null);
    try {
      await adminApi.recordCashReceipt(cashPaymentId, {
        reference: cashReference.trim(),
        ...(cashNote.trim() ? { note: cashNote.trim() } : {}),
      });
      setCashPaymentId(null);
      setCashReference('');
      setCashNote('');
      fetchPayments();
    } catch (err) {
      setCashError(err instanceof Error ? err.message : 'Không thể ghi nhận thu tiền mặt.');
    } finally {
      setSubmittingCash(false);
    }
  };

  const handleRecordRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundPaymentId || refundRef.trim().length < 3 || refundNote.trim().length < 3) return;

    setSubmittingRefund(true);
    setRefundError(null);

    try {
      await adminApi.recordRefund(refundPaymentId, {
        reference: refundRef.trim(),
        note: refundNote.trim(),
      });

      setRefundPaymentId(null);
      setRefundRef('');
      setRefundNote('');
      fetchPayments();
    } catch (err) {
      setRefundError(err instanceof Error ? err.message : 'Không thể ghi nhận hoàn tiền.');
    } finally {
      setSubmittingRefund(false);
    }
  };

  return (
    <PageShell
      badge="Đối Soát Dòng Tiền"
      title="Giao Dịch Thanh Toán & Hoàn Tiền"
      description="Đối soát VNPay, MoMo, ZaloPay, thu tiền mặt và xử lý các khoản hoàn tiền."
      action={
        <Button variant="outline" onClick={fetchPayments} className="text-xs gap-1.5">
          <RefreshCcw className="h-3.5 w-3.5" />
          <span>Tải lại</span>
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white border p-6 h-24" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-stone-700 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchPayments}>
            Thử lại
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/80 bg-white shadow-luxury">
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-[#faf9f5] text-stone-500 font-semibold uppercase tracking-wider border-b border-stone-200/80">
              <tr>
                <th className="py-4 px-6">Mã giao dịch</th>
                <th className="py-4 px-6">Mã đơn đặt</th>
                <th className="py-4 px-6">Cổng</th>
                <th className="py-4 px-6">Số tiền</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6">Thời gian</th>
                <th className="py-4 px-6 text-right">Xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {payments.map((p) => {
                const badge = PAYMENT_STATUS_STYLE[p.status] || 'bg-stone-100 text-stone-800';

                return (
                  <tr key={p.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-4 px-6 font-mono text-stone-900 font-medium">
                      {p.id.slice(0, 13)}...
                    </td>
                    <td className="py-4 px-6">
                      <Link
                        href={`/bookings/${p.bookingId}`}
                        className="font-mono text-amber-800 hover:underline"
                      >
                        {p.bookingId.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="py-4 px-6 font-semibold text-stone-800">{p.provider}</td>
                    <td className="py-4 px-6 font-bold text-stone-900">{formatVND(p.amount)}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${badge}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-stone-500">{formatDateTime(p.createdAt)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        {p.provider === 'CASH' && p.status === 'INITIATED' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setCashPaymentId(p.id);
                              setCashError(null);
                            }}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] h-7 px-3"
                          >
                            Xác nhận thu tiền
                          </Button>
                        )}
                        {p.status === 'REFUND_REQUIRED' && (
                          <Button
                            size="sm"
                            onClick={() => setRefundPaymentId(p.id)}
                            className="bg-amber-800 hover:bg-amber-900 text-white text-[11px] h-7 px-3"
                          >
                            Ghi nhận hoàn tiền
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {cashPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-stone-200">
            <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
              Xác Nhận Thu Tiền Mặt
            </h3>
            <p className="text-xs text-stone-600 mb-4">
              Chỉ xác nhận sau khi nhân viên thực tế đã nhận đủ tiền của khách.
            </p>
            <form onSubmit={handleRecordCash} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700">Mã biên nhận / tham chiếu *</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  value={cashReference}
                  onChange={(e) => setCashReference(e.target.value)}
                  placeholder="Ví dụ: CASH-HN-20260928-001"
                />
              </div>
              <div>
                <label className="font-semibold text-stone-700">Ghi chú</label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={cashNote}
                  onChange={(e) => setCashNote(e.target.value)}
                  placeholder="Nhân viên thu tiền, địa điểm hoặc ghi chú đối soát..."
                />
              </div>
              {cashError && (
                <p role="alert" className="text-red-700 font-medium">
                  {cashError}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCashPaymentId(null)}
                  disabled={submittingCash}
                >
                  Đóng
                </Button>
                <Button
                  type="submit"
                  disabled={submittingCash}
                  className="bg-emerald-700 text-white hover:bg-emerald-800"
                >
                  {submittingCash ? 'Đang xác nhận...' : 'Xác nhận đã thu tiền'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Refund Record */}
      {refundPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-stone-200">
            <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
              Ghi Nhận Chứng Từ Hoàn Tiền
            </h3>
            <p className="text-xs text-stone-600 mb-4">
              Nhập mã tham chiếu chuyển khoản ngân hàng thực tế sau khi đã giải ngân ngoài cổng.
            </p>

            <form onSubmit={handleRecordRefund} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700">Mã giao dịch tham chiếu *</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  placeholder="Ví dụ: FT260921004883"
                  value={refundRef}
                  onChange={(e) => setRefundRef(e.target.value)}
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700">Ghi chú đối soát *</label>
                <textarea
                  rows={3}
                  required
                  minLength={3}
                  maxLength={500}
                  placeholder="Ghi rõ tài khoản thụ hưởng, ngân hàng và thời gian hoàn..."
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                />
              </div>

              {refundError && (
                <p role="alert" className="text-red-700 font-medium">
                  {refundError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setRefundPaymentId(null)}>
                  Đóng
                </Button>
                <Button
                  type="submit"
                  disabled={submittingRefund}
                  className="bg-stone-900 text-white"
                >
                  {submittingRefund ? 'Đang lưu...' : 'Lưu bằng chứng'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
