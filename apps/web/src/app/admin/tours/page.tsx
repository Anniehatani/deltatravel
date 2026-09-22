'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import type { Tour } from '@tour/shared';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import {
  Compass,
  Plus,
  Trash2,
  MapPin,
  Calendar,
  RefreshCcw,
  AlertCircle,
  X,
} from 'lucide-react';

export default function AdminToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [destination, setDestination] = useState('');
  const [durationDays, setDurationDays] = useState(3);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const fetchTours = () => {
    setLoading(true);
    setError(null);
    adminApi
      .tours()
      .then((res) => {
        setTours(res.items);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách tour.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const handleCreateTour = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError(null);

    try {
      await adminApi.createTour({
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        destination: destination.trim(),
        durationDays: Number(durationDays),
        description: description.trim(),
        countryCode: 'VN',
        status,
      });

      setShowModal(false);
      setTitle('');
      setSlug('');
      setDestination('');
      setDescription('');
      fetchTours();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể tạo tour.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTour = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tour này?')) return;
    try {
      await adminApi.deleteTour(id);
      fetchTours();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Chưa thể xóa tour.');
    }
  };

  return (
    <PageShell
      badge="Quản Trị Danh Mục"
      title="Danh Sách Tour Nội Địa"
      description="Biên tập thông tin điểm đến, tạo mới và phân phối các hành trình du ngoạn."
      action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTours} className="text-xs gap-1.5">
            <RefreshCcw className="h-3.5 w-3.5" />
            <span>Tải lại</span>
          </Button>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-stone-900 hover:bg-stone-800 text-white text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm tour mới</span>
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
          <Button variant="outline" onClick={fetchTours}>Thử lại</Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/80 bg-white shadow-luxury">
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-[#faf9f5] text-stone-500 font-semibold uppercase tracking-wider border-b border-stone-200/80">
              <tr>
                <th className="py-4 px-6">Tên tour</th>
                <th className="py-4 px-6">Điểm đến</th>
                <th className="py-4 px-6">Thời lượng</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {tours.map((tour) => (
                <tr key={tour.id} className="hover:bg-stone-50/60 transition">
                  <td className="py-4 px-6 font-semibold text-stone-900">
                    <Link href={`/tours/${tour.id}`} className="hover:text-amber-800 transition">
                      {tour.title}
                    </Link>
                    <span className="block text-[10px] text-stone-400 font-mono mt-0.5">
                      slug: {tour.slug}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-stone-700">
                      <MapPin className="h-3 w-3" />
                      {tour.destination}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-medium text-stone-800">
                    {tour.durationDays} Ngày {Math.max(1, tour.durationDays - 1)} Đêm
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        tour.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tour.status === 'DRAFT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {tour.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleDeleteTour(tour.id)}
                      title="Xóa tour"
                      className="p-1.5 text-stone-400 hover:text-red-700 rounded-lg transition hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Create Tour */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <h3 className="font-serif text-xl font-bold text-stone-900">Khởi Tạo Tour Mới</h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTour} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700">Tên tour *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hải Trình Di Sản Vịnh Hạ Long 5 Sao"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-|-$/g, ''),
                      );
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700">Slug (URL) *</label>
                  <input
                    type="text"
                    required
                    pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                    placeholder="hai-trinh-ha-long"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700">Điểm đến *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Hạ Long"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700">Thời lượng (Số ngày) *</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700">Trạng thái mở bán *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'ACTIVE' | 'INACTIVE')}
                  >
                    <option value="ACTIVE">ACTIVE (Mở bán)</option>
                    <option value="DRAFT">DRAFT (Nháp)</option>
                    <option value="INACTIVE">INACTIVE (Đóng)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700">Mô tả hành trình *</label>
                <textarea
                  rows={4}
                  required
                  minLength={10}
                  placeholder="Mô tả các điểm nhấn nổi bật của tour..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
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
                  {creating ? 'Đang tạo...' : 'Tạo hành trình'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}

