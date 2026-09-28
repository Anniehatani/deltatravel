'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Tour } from '@tour/shared';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Compass,
  Edit3,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';

type TourStatus = Tour['status'];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminToursPage() {
  const { user } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TourStatus>('all');

  const [showModal, setShowModal] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingTour, setDeletingTour] = useState<Tour | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [destination, setDestination] = useState('');
  const [durationDays, setDurationDays] = useState(3);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TourStatus>('ACTIVE');

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  const fetchTours = () => {
    setLoading(true);
    setError(null);
    adminApi
      .tours()
      .then((res) => setTours(res.items))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Không thể tải danh mục tour.'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const filteredTours = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tours.filter((tour) => {
      if (statusFilter !== 'all' && tour.status !== statusFilter) return false;
      if (!q) return true;
      return [tour.title, tour.destination, tour.slug, tour.description].some((value) =>
        value.toLowerCase().includes(q),
      );
    });
  }, [tours, searchQuery, statusFilter]);

  const stats = useMemo(
    () => ({
      total: tours.length,
      active: tours.filter((tour) => tour.status === 'ACTIVE').length,
      draft: tours.filter((tour) => tour.status === 'DRAFT').length,
      inactive: tours.filter((tour) => tour.status === 'INACTIVE').length,
    }),
    [tours],
  );

  const resetForm = (tour?: Tour) => {
    setEditingTour(tour ?? null);
    setTitle(tour?.title ?? '');
    setSlug(tour?.slug ?? '');
    setDestination(tour?.destination ?? '');
    setDurationDays(tour?.durationDays ?? 3);
    setDescription(tour?.description ?? '');
    setStatus(tour?.status ?? 'ACTIVE');
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const finalSlug = slugify(slug || title);
    if (title.trim().length < 2 || destination.trim().length < 2 || finalSlug.length < 2) {
      setFormError('Tên tour, slug và điểm đến phải có ít nhất 2 ký tự.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    const payload = {
      title: title.trim(),
      slug: finalSlug,
      description: description.trim(),
      destination: destination.trim(),
      countryCode: 'VN',
      durationDays: Number(durationDays),
      status,
    };

    try {
      if (editingTour) {
        await adminApi.updateTour(editingTour.id, payload);
        notify(`Đã cập nhật “${title.trim()}”.`);
      } else {
        await adminApi.createTour(payload);
        notify(`Đã tạo “${title.trim()}”.`);
      }
      setShowModal(false);
      fetchTours();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể lưu tour.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (tour: Tour) => {
    const nextStatus: TourStatus = tour.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminApi.updateTour(tour.id, { status: nextStatus });
      notify(nextStatus === 'ACTIVE' ? 'Tour đã được mở bán.' : 'Tour đã được ẩn khỏi trang khách.');
      fetchTours();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đổi trạng thái tour.');
    }
  };

  const confirmDelete = async () => {
    if (!deletingTour) return;
    try {
      await adminApi.deleteTour(deletingTour.id);
      notify('Đã archive tour. Lịch sử booking vẫn được giữ nguyên.');
      setDeletingTour(null);
      fetchTours();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể archive tour.');
    }
  };

  return (
    <PageShell
      badge="DANH MỤC TOUR • SOURCE OF TRUTH"
      title="Quản Lý Tour"
      description="Quản lý thông tin tour thực sự được lưu trong PostgreSQL. Giá, kho chỗ và ngày khởi hành được quản lý riêng ở phân hệ Lịch khởi hành để tránh hiển thị dữ liệu không được lưu."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" className="text-xs gap-1.5">
            <Link href="/admin/schedules">
              <CalendarDays className="h-4 w-4" /> Giá & lịch khởi hành
            </Link>
          </Button>
          <Button variant="outline" onClick={fetchTours} className="text-xs gap-1.5">
            <RefreshCcw className="h-4 w-4" /> Tải lại
          </Button>
          <Button onClick={() => resetForm()} className="bg-stone-950 text-white text-xs gap-1.5">
            <Plus className="h-4 w-4" /> Thêm tour
          </Button>
        </div>
      }
    >
      {toast && (
        <div role="status" className="fixed bottom-6 right-6 z-[99999] rounded-2xl border border-emerald-300 bg-stone-950 px-5 py-3 text-xs font-bold text-white shadow-2xl">
          <CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Tổng tour', stats.total],
          ['Đang mở bán', stats.active],
          ['Bản nháp', stats.draft],
          ['Đang ẩn', stats.inactive],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-wider text-stone-500">{label}</div>
            <div className="mt-1 text-3xl font-black text-stone-950">{value}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm theo tên, điểm đến, slug hoặc mô tả..."
            className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-amber-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'all' | TourStatus)}
          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-semibold"
          aria-label="Lọc trạng thái tour"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="DRAFT">DRAFT</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-2xl border bg-white" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <AlertTriangle className="mx-auto mb-2 h-7 w-7 text-amber-700" />
          <p className="text-sm font-bold text-stone-900">{error}</p>
          <Button variant="outline" onClick={fetchTours} className="mt-4">Thử lại</Button>
        </div>
      ) : filteredTours.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <Compass className="mx-auto mb-3 h-10 w-10 text-stone-400" />
          <h3 className="font-bold text-stone-900">Không có tour phù hợp</h3>
          <p className="mt-1 text-xs text-stone-500">Hãy đổi bộ lọc hoặc tạo tour mới.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b bg-stone-50 text-[10px] font-black uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-5 py-4">Tour</th>
                <th className="px-5 py-4">Điểm đến</th>
                <th className="px-5 py-4">Thời lượng</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Cập nhật</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredTours.map((tour) => (
                <tr key={tour.id} className="hover:bg-stone-50/70">
                  <td className="px-5 py-4">
                    <div className="font-bold text-stone-950">{tour.title}</div>
                    <div className="mt-1 font-mono text-[10px] text-stone-400">{tour.slug}</div>
                  </td>
                  <td className="px-5 py-4 text-stone-700">{tour.destination}</td>
                  <td className="px-5 py-4 font-semibold">{tour.durationDays} ngày</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-stone-300 px-2.5 py-1 text-[10px] font-black">
                      {tour.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-stone-500">
                    {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(tour.updatedAt))}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => resetForm(tour)} className="h-8 text-[11px]">
                        <Edit3 className="mr-1 h-3.5 w-3.5" /> Sửa
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void toggleStatus(tour)} className="h-8 text-[11px]">
                        {tour.status === 'ACTIVE' ? 'Ẩn' : 'Mở bán'}
                      </Button>
                      {user?.role === 'ADMIN' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingTour(tour)}
                          className="h-8 border-red-200 text-[11px] text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Archive
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-stone-950">{editingTour ? 'Chỉnh sửa tour' : 'Tạo tour mới'}</h2>
                <p className="mt-1 text-xs text-stone-500">Các trường dưới đây được lưu trực tiếp vào backend.</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Đóng">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 font-semibold">
                  <span>Tên tour *</span>
                  <input required minLength={2} maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} />
                </label>
                <label className="space-y-1 font-semibold">
                  <span>Slug *</span>
                  <input
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    onBlur={() => setSlug(slugify(slug || title))}
                    placeholder="tu-dong-tao-tu-ten-tour"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 font-semibold">
                  <span>Điểm đến *</span>
                  <input required minLength={2} maxLength={120} value={destination} onChange={(e) => setDestination(e.target.value)} />
                </label>
                <label className="space-y-1 font-semibold">
                  <span>Thời lượng (ngày) *</span>
                  <input type="number" required min={1} max={60} value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} />
                </label>
              </div>

              <label className="block space-y-1 font-semibold">
                <span>Mô tả *</span>
                <textarea required minLength={10} maxLength={4000} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>

              <label className="block space-y-1 font-semibold">
                <span>Trạng thái *</span>
                <select value={status} onChange={(e) => setStatus(e.target.value as TourStatus)}>
                  <option value="ACTIVE">ACTIVE • hiển thị cho khách</option>
                  <option value="DRAFT">DRAFT • bản nháp</option>
                  <option value="INACTIVE">INACTIVE • tạm ẩn</option>
                </select>
              </label>

              {formError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 font-semibold text-red-700">{formError}</p>}

              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>Hủy</Button>
                <Button type="submit" disabled={submitting} className="bg-stone-950 text-white">
                  {submitting ? 'Đang lưu...' : editingTour ? 'Lưu thay đổi' : 'Tạo tour'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingTour && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-black">Archive “{deletingTour.title}”?</h2>
            <p className="mt-2 text-xs leading-relaxed text-stone-600">
              Tour sẽ không còn xuất hiện trong danh mục vận hành. Booking lịch sử không bị xóa.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeletingTour(null)}>Giữ lại</Button>
              <Button onClick={() => void confirmDelete()} className="bg-red-700 text-white">Archive tour</Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
