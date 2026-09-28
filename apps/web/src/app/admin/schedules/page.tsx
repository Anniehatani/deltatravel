'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Schedule, Tour } from '@tour/shared';
import { adminApi } from '@/lib/api';
import { formatDateTime, formatVND } from '@/lib/format';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, Edit3, Plus, RefreshCcw, X } from 'lucide-react';

type ScheduleStatus = Schedule['status'];

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tourFilter, setTourFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ScheduleStatus>('all');

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [tourId, setTourId] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [totalSeats, setTotalSeats] = useState(25);
  const [adultPrice, setAdultPrice] = useState(3_990_000);
  const [childPrice, setChildPrice] = useState(2_490_000);
  const [status, setStatus] = useState<ScheduleStatus>('OPEN');

  const tourById = useMemo(() => new Map(tours.map((tour) => [tour.id, tour])), [tours]);
  const filteredSchedules = useMemo(
    () =>
      schedules.filter(
        (schedule) =>
          (tourFilter === 'all' || schedule.tourId === tourFilter) &&
          (statusFilter === 'all' || schedule.status === statusFilter),
      ),
    [schedules, tourFilter, statusFilter],
  );

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([adminApi.schedules(), adminApi.tours()])
      .then(([schedulePage, tourPage]) => {
        setSchedules(schedulePage.items);
        setTours(tourPage.items);
        if (!tourId && tourPage.items.length) setTourId(tourPage.items[0].id);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu lịch khởi hành.'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setTourId(tours[0]?.id ?? '');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
    setDepartureDate(tomorrow.toISOString().slice(0, 16));
    setTotalSeats(25);
    setAdultPrice(3_990_000);
    setChildPrice(2_490_000);
    setStatus('OPEN');
    setFormError(null);
    setModal('create');
  };

  const openEdit = (schedule: Schedule) => {
    setEditing(schedule);
    setTourId(schedule.tourId);
    const date = new Date(schedule.departureAt);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    setDepartureDate(date.toISOString().slice(0, 16));
    setTotalSeats(schedule.totalSeats);
    setAdultPrice(schedule.adultPrice);
    setChildPrice(schedule.childPrice);
    setStatus(schedule.status);
    setFormError(null);
    setModal('edit');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (modal === 'create') {
        if (!tourId || !departureDate) throw new Error('Vui lòng chọn tour và ngày khởi hành.');
        await adminApi.createSchedule({
          tourId,
          departureAt: new Date(departureDate).toISOString(),
          totalSeats: Number(totalSeats),
          adultPrice: Number(adultPrice),
          childPrice: Number(childPrice),
          status,
        });
      } else if (modal === 'edit' && editing) {
        await adminApi.updateSchedule(editing.id, {
          totalSeats: Number(totalSeats),
          adultPrice: Number(adultPrice),
          childPrice: Number(childPrice),
          status,
        });
      }
      setModal(null);
      setEditing(null);
      fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể lưu lịch khởi hành.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      badge="LỊCH KHỞI HÀNH • INVENTORY"
      title="Giá, Kho Chỗ & Lịch Khởi Hành"
      description="Mỗi lịch là nguồn sự thật cho ngày đi, giá người lớn/trẻ em và sức chứa. Khi đã tạo, ngày khởi hành không được sửa trên endpoint hiện tại để bảo toàn điều kiện hủy của booking cũ."
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchData} className="text-xs gap-1.5">
            <RefreshCcw className="h-4 w-4" /> Tải lại
          </Button>
          <Button
            onClick={openCreate}
            disabled={!tours.length}
            className="bg-stone-950 text-white text-xs gap-1.5"
          >
            <Plus className="h-4 w-4" /> Mở lịch mới
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row">
        <select
          value={tourFilter}
          onChange={(e) => setTourFilter(e.target.value)}
          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs"
        >
          <option value="all">Tất cả tour</option>
          {tours.map((tour) => (
            <option key={tour.id} value={tour.id}>
              {tour.title}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | ScheduleStatus)}
          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="OPEN">OPEN</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border bg-white" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-2 h-7 w-7 text-amber-700" />
          <p className="text-sm font-bold">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchData}>
            Thử lại
          </Button>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-stone-400" />
          <h3 className="font-bold">Chưa có lịch phù hợp</h3>
          <p className="mt-1 text-xs text-stone-500">
            Tạo lịch mới để mở giá và kho chỗ cho khách.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[1050px] text-left text-xs">
            <thead className="border-b bg-stone-50 text-[10px] font-black uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-5 py-4">Tour</th>
                <th className="px-5 py-4">Khởi hành</th>
                <th className="px-5 py-4">Kho chỗ</th>
                <th className="px-5 py-4">Giá người lớn</th>
                <th className="px-5 py-4">Giá trẻ em</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSchedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-stone-50/70">
                  <td className="px-5 py-4">
                    <div className="font-bold text-stone-950">
                      {tourById.get(schedule.tourId)?.title ?? 'Tour không còn trong catalog'}
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-stone-400">{schedule.id}</div>
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {formatDateTime(schedule.departureAt)}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-black text-emerald-800">
                      {schedule.availableSeats} trống
                    </span>
                    <span className="text-stone-400">
                      {' '}
                      • {schedule.reservedSeats} giữ • {schedule.totalSeats} tổng
                    </span>
                  </td>
                  <td className="px-5 py-4 font-black">{formatVND(schedule.adultPrice)}</td>
                  <td className="px-5 py-4 font-semibold">{formatVND(schedule.childPrice)}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border px-2.5 py-1 text-[10px] font-black">
                      {schedule.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(schedule)}
                      className="h-8 text-[11px]"
                    >
                      <Edit3 className="mr-1 h-3.5 w-3.5" /> Sửa giá / kho
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">
                  {modal === 'create' ? 'Mở lịch khởi hành mới' : 'Cập nhật giá & kho chỗ'}
                </h2>
                {modal === 'edit' && (
                  <p className="mt-1 text-xs text-stone-500">
                    Ngày khởi hành được khóa để bảo toàn nghiệp vụ booking.
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setModal(null)} aria-label="Đóng">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4 text-xs">
              <label className="block space-y-1 font-semibold">
                <span>Tour *</span>
                <select
                  disabled={modal === 'edit'}
                  required
                  value={tourId}
                  onChange={(e) => setTourId(e.target.value)}
                >
                  {tours.map((tour) => (
                    <option key={tour.id} value={tour.id}>
                      {tour.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1 font-semibold">
                <span>Ngày giờ khởi hành *</span>
                <input
                  type="datetime-local"
                  disabled={modal === 'edit'}
                  required
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 font-semibold">
                  <span>Tổng số chỗ *</span>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    required
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(Number(e.target.value))}
                  />
                  {editing && (
                    <span className="block text-[10px] font-normal text-stone-500">
                      Không thể giảm dưới {editing.reservedSeats} chỗ đang giữ/đã đặt.
                    </span>
                  )}
                </label>
                <label className="space-y-1 font-semibold">
                  <span>Trạng thái *</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ScheduleStatus)}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 font-semibold">
                  <span>Giá người lớn (VND) *</span>
                  <input
                    type="number"
                    min={0}
                    max={99999999}
                    required
                    value={adultPrice}
                    onChange={(e) => setAdultPrice(Number(e.target.value))}
                  />
                </label>
                <label className="space-y-1 font-semibold">
                  <span>Giá trẻ em (VND) *</span>
                  <input
                    type="number"
                    min={0}
                    max={99999999}
                    required
                    value={childPrice}
                    onChange={(e) => setChildPrice(Number(e.target.value))}
                  />
                </label>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 font-semibold text-red-700"
                >
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModal(null)}
                  disabled={submitting}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={submitting} className="bg-stone-950 text-white">
                  {submitting ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
