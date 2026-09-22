'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import type { z } from 'zod';
import type { AuditSchema } from '@tour/shared';
import { formatDateTime } from '@/lib/format';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import {
  FileText,
  RefreshCcw,
  ShieldCheck,
  User,
  Clock,
  Code,
} from 'lucide-react';

type AuditLog = z.infer<typeof AuditSchema>;

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = () => {
    setLoading(true);
    setError(null);
    adminApi
      .auditLogs()
      .then((res) => {
        setLogs(res.items);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không thể tải nhật ký kiểm toán.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <PageShell
      badge="Bảo Mật & Tuân Thủ"
      title="Nhật Ký Kiểm Toán Hệ Thống"
      description="Ghi nhận mọi thao tác cấu hình giá, điều chỉnh kho chỗ, xác nhận hoặc hủy đơn của quản trị viên."
      action={
        <Button variant="outline" onClick={fetchLogs} className="text-xs gap-1.5">
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
          <Button variant="outline" onClick={fetchLogs}>Thử lại</Button>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-14 text-center">
          <FileText className="mx-auto h-12 w-12 text-stone-400 mb-3" />
          <h3 className="font-serif text-xl font-bold text-stone-900">
            Chưa có sự kiện kiểm toán nào
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            Hệ thống sẽ tự động ghi lại lịch sử khi có các can thiệp từ ban quản trị.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/80 bg-white shadow-luxury">
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-[#faf9f5] text-stone-500 font-semibold uppercase tracking-wider border-b border-stone-200/80">
              <tr>
                <th className="py-4 px-6">Thời gian</th>
                <th className="py-4 px-6">Hành động</th>
                <th className="py-4 px-6">Đối tượng can thiệp</th>
                <th className="py-4 px-6">Người thực hiện</th>
                <th className="py-4 px-6">Chi tiết tham số</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-50/60 transition">
                  <td className="py-4 px-6 font-sans text-stone-800">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase bg-amber-100 text-amber-900 border border-amber-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-stone-900 font-medium">
                    {log.entityId}
                  </td>
                  <td className="py-4 px-6 text-stone-500">
                    {log.actorId ? log.actorId.slice(0, 10) + '...' : 'SYSTEM'}
                  </td>
                  <td className="py-4 px-6 text-stone-500 max-w-xs truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}

