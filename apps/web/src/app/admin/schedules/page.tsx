'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import type { Schedule, Tour } from '@tour/shared';
import { formatVND, formatDate, formatDateTime } from '@/lib/format';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Plus,
  RefreshCcw,
  Clock,
  Users,
  AlertCircle,
  X,
} from 'lucide-react';

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [tourId, setTourId] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [totalSeats, setTotalSeats] = useState(25);
  const [adultPrice, setAdultPrice] = useState(3990000);
  const [childPrice, setChildPrice] = useState(2490000);
  const [status, setStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([adminApi.schedules(), adminApi.tours()])
      .then(([schedulesData, toursData]) => {
        setSchedules(schedulesData.items);
        setTours(toursData.items);
        if (toursData.items.length > 0 && !tourId) {
          setTourId(toursData.items[0].id);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu lịch khởi hành.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourId || !departureDate) return;

    setCreating(true);
    setFormError(null);

    try {
      // Create an ISO 8601 string with offset for departureAt
      const isoDeparture = new Date(departureDate).toISOString();

      await adminApi.createSchedule({
        tourId,
        departureAt: isoDeparture,
        totalSeats: Number(totalSeats),
        adultPrice: Number(adultPrice),
        childPrice: Number(childPrice),
        status,
      });

      setShowModal(false);
      setDepartureDate('');
      fetchData();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Không thể tạo lịch khởi hành.',
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageShell
      badge="Quản Trị Lịch Trình"
      title="Quản Lý Lịch Khởi Hành & Kho Chỗ"
      description="Cấu hình ngày khởi hành, biểu giá vé người lớn/trẻ em và giám sát kho chỗ thời gian thực."
      action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} className="text-xs gap-1.5">
            <RefreshCcw className="h-3.5 w-3.5" />
            <span>Tải lại</span>
          </Button>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-stone-900 hover:bg-stone-800 text-white text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Mở lịch khởi hành mới</span>
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white border p-6 h-28" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-stone-700 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchData}>Thử lại</Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/80 bg-white shadow-luxury">
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-[#faf9f5] text-stone-500 font-semibold uppercase tracking-wider border-b border-stone-200/80">
              <tr>
                <th className="py-4 px-6">Ngày khởi hành</th>
                <th className="py-4 px-6">Kho chỗ (Trống / Đã giữ / Tổng)</th>
                <th className="py-4 px-6">Giá người lớn</th>
                <th className="py-4 px-6">Giá trẻ em</th>
                <th className="py-4 px-6">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {schedules.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/60 transition">
                  <td className="py-4 px-6 font-semibold text-stone-900">
                    {formatDateTime(item.departureAt)}
                    <span className="block text-[10px] text-stone-400 font-mono mt-0.5">
                      ID: {item.id.slice(0, 8)}...
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-emerald-800">{item.availableSeats} chỗ</span>
                    <span className="text-stone-400"> / {item.reservedSeats} giữ / </span>
                    <span className="text-stone-600">{item.totalSeats} tổng</span>
                  </td>
                  <td className="py-4 px-6 font-bold text-stone-900">
                    {formatVND(item.adultPrice)}
                  </td>
                  <td className="py-4 px-6 font-medium text-stone-700">
                    {formatVND(item.childPrice)}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        item.status === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Create Schedule */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Mở Lịch Khởi Hành Mới
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700">Chọn Tour Áp Dụng *</label>
                <select
                  required
                  value={tourId}
                  onChange={(e) => setTourId(e.target.value)}
                >
                  {tours.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.destination})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700">Ngày giờ khởi hành *</label>
                  <input
                    type="datetime-local"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700">Tổng số chỗ (Sức chứa) *</label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    required
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700">Giá vé người lớn (VND) *</label>
                  <input
                    type="number"
                    min={0}
                    max={99999999}
                    step={10000}
                    required
                    value={adultPrice}
                    onChange={(e) => setAdultPrice(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700">Giá vé trẻ em (VND) *</label>
                  <input
                    type="number"
                    min={0}
                    max={99999999}
                    step={10000}
                    required
                    value={childPrice}
                    onChange={(e) => setChildPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700">Trạng thái kho chỗ *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'OPEN' | 'CLOSED')}
                >
                  <option value="OPEN">OPEN (Mở nhận chỗ)</option>
                  <option value="CLOSED">CLOSED (Đóng nhận chỗ)</option>
                </select>
              </div>

              {formError && (
                <p role="alert" className="text-red-700 font-medium">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={creating} className="bg-stone-900 text-white">
                  {creating ? 'Đang tạo...' : 'Mở lịch khởi hành'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}

