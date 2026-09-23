'use client';

import { useEffect, useState, useMemo, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import type { CommercialTour } from '@/lib/commercial-store';
import { formatVND, formatDate } from '@/lib/format';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import {
  Compass,
  Plus,
  Trash2,
  Edit3,
  MapPin,
  Calendar,
  RefreshCcw,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ImageIcon,
  Users,
  DollarSign,
  X,
  AlertTriangle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Eye,
} from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'Vịnh Hạ Long', url: '/tour-ha-long.jpg' },
  { label: 'Sa Pa Fansipan', url: '/tour-sapa.jpg' },
  { label: 'Ninh Bình Tràng An', url: '/tour-ninh-binh.jpg' },
  { label: 'Đà Nẵng Cầu Vàng', url: '/tour-da-nang.jpg' },
  { label: 'Cố Đô Huế', url: '/tour-hue.jpg' },
  { label: 'Nha Trang Biển', url: '/tour-nha-trang.jpg' },
  { label: 'Phú Quốc Đảo Ngọc', url: '/tour-phu-quoc.jpg' },
  { label: 'Cần Thơ Sông Nước', url: '/tour-can-tho.jpg' },
  { label: 'Tây Ninh Núi Bà', url: '/tour-tay-ninh.jpg' },
];

export default function AdminToursPage() {
  const [tours, setTours] = useState<CommercialTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<'all' | 'bac' | 'trung' | 'nam'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all');

  // Modal State (Create & Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingTour, setEditingTour] = useState<CommercialTour | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [destination, setDestination] = useState('');
  const [region, setRegion] = useState<'bac' | 'trung' | 'nam'>('bac');
  const [durationDays, setDurationDays] = useState(3);
  const [imageUrl, setImageUrl] = useState('/tour-ha-long.jpg');
  const [adultPrice, setAdultPrice] = useState(2500000);
  const [childPrice, setChildPrice] = useState(1750000);
  const [totalSeats, setTotalSeats] = useState(30);
  const [availableSeats, setAvailableSeats] = useState(20);
  const [departureAt, setDepartureAt] = useState('');
  const [description, setDescription] = useState('');
  const [highlightsText, setHighlightsText] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Delete Confirm Modal
  const [deletingTour, setDeletingTour] = useState<CommercialTour | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchTours = () => {
    setLoading(true);
    setError(null);
    adminApi
      .tours()
      .then((res) => {
        setTours(res.items as CommercialTour[]);
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

    const handleUpdate = () => {
      fetchTours();
    };
    window.addEventListener('delta_tours_updated', handleUpdate);
    return () => window.removeEventListener('delta_tours_updated', handleUpdate);
  }, []);

  // Filtered tours calculation
  const filteredTours = useMemo(() => {
    return tours.filter((t) => {
      if (regionFilter !== 'all' && t.region !== regionFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (t.title || '').toLowerCase().includes(q);
        const matchDest = (t.destination || '').toLowerCase().includes(q);
        const matchSlug = (t.slug || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDest && !matchSlug) return false;
      }
      return true;
    });
  }, [tours, searchQuery, regionFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = tours.length;
    const active = tours.filter((t) => t.status === 'ACTIVE').length;
    const inactive = tours.filter((t) => t.status !== 'ACTIVE').length;
    return { total, active, inactive };
  }, [tours]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingTour(null);
    setTitle('');
    setSlug('');
    setDestination('');
    setRegion('bac');
    setDurationDays(3);
    setImageUrl('/tour-ha-long.jpg');
    setAdultPrice(2450000);
    setChildPrice(1650000);
    setTotalSeats(30);
    setAvailableSeats(22);
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    setDepartureAt(nextWeek);
    setDescription('');
    setHighlightsText('Trải nghiệm ngắm cảnh thiên nhiên, Khách sạn 4-5 sao, Ẩm thực phong phú');
    setStatus('ACTIVE');
    setFormError(null);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (tour: CommercialTour) => {
    setEditingTour(tour);
    setTitle(tour.title || '');
    setSlug(tour.slug || '');
    setDestination(tour.destination || '');
    setRegion(tour.region || 'bac');
    setDurationDays(tour.durationDays || 3);
    setImageUrl(tour.imageUrl || '/tour-ha-long.jpg');
    setAdultPrice(tour.adultPrice || 2450000);
    setChildPrice(tour.childPrice || 1650000);
    setTotalSeats(tour.totalSeats || 30);
    setAvailableSeats(tour.availableSeats ?? 20);
    const depDate = tour.departureAt ? tour.departureAt.split('T')[0] : '';
    setDepartureAt(depDate);
    setDescription(tour.description || '');
    setHighlightsText(Array.isArray(tour.highlights) ? tour.highlights.join(', ') : '');
    setStatus(tour.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE');
    setFormError(null);
    setShowModal(true);
  };

  // Quick Toggle Status
  const handleToggleStatus = async (tour: CommercialTour) => {
    try {
      const updated = await adminApi.toggleTourStatus(tour.id);
      showToast(
        updated.status === 'ACTIVE'
          ? `Đã BẬT tour "${tour.title}". Tour đã hiển thị trên website!`
          : `Đã TẮT tour "${tour.title}". Tour đã được ẩn khỏi website.`,
      );
      fetchTours();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Chưa thể đổi trạng thái tour.');
    }
  };

  // Handle Form Submit (Create or Update)
  const handleSubmitTour = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Vui lòng nhập tên tour');
      return;
    }
    if (!destination.trim()) {
      setFormError('Vui lòng nhập điểm đến');
      return;
    }
    if (adultPrice <= 0) {
      setFormError('Giá người lớn phải lớn hơn 0');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const highlightsList = highlightsText
      .split(',')
      .map((h) => h.trim())
      .filter((h) => h.length > 0);

    const depIso = departureAt
      ? new Date(departureAt).toISOString()
      : new Date(Date.now() + 7 * 86400000).toISOString();

    const payload: Partial<CommercialTour> = {
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      destination: destination.trim(),
      region,
      durationDays: Number(durationDays),
      imageUrl: imageUrl.trim(),
      adultPrice: Number(adultPrice),
      childPrice: Number(childPrice),
      totalSeats: Number(totalSeats),
      availableSeats: Number(availableSeats),
      departureAt: depIso,
      description: description.trim(),
      highlights: highlightsList.length > 0 ? highlightsList : ['Khám phá danh thắng', 'Dịch vụ cao cấp'],
      status,
    };

    try {
      if (editingTour) {
        await adminApi.updateTour(editingTour.id, payload);
        showToast(`Đã cập nhật tour "${title}" thành công và đồng bộ lên website!`);
      } else {
        await adminApi.createTour(payload);
        showToast(`Đã thêm tour mới "${title}" thành công và mở bán trên website!`);
      }
      setShowModal(false);
      fetchTours();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu tour.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Tour
  const handleConfirmDelete = async () => {
    if (!deletingTour) return;
    try {
      await adminApi.deleteTour(deletingTour.id);
      showToast(`Đã xóa tour "${deletingTour.title}" khỏi hệ thống.`);
      setDeletingTour(null);
      fetchTours();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Chưa thể xóa tour.');
    }
  };

  // Image File Upload Helper
  const handleImageFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <PageShell
      badge="TRUNG TÂM QUẢN TRỊ TOUR THỰC TẾ"
      title="Quản Lý Danh Mục Tour Du Lịch"
      description="Biên tập toàn diện thông tin tour, ảnh hành trình, biểu giá người lớn/trẻ em, kho chỗ và lịch khởi hành đồng bộ trực tiếp lên website."
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchTours} className="text-xs gap-1.5 shadow-sm">
            <RefreshCcw className="h-3.5 w-3.5" />
            <span>Tải lại</span>
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs gap-1.5 shadow-md transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm Tour Mới</span>
          </Button>
        </div>
      }
    >
      {/* ─── TOAST NOTIFICATION ─── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-stone-950 text-white px-5 py-3 rounded-2xl shadow-2xl border border-amber-400/40 flex items-center gap-3 animate-fade-in-scale">
          <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* ─── TOP KPI SUMMARY CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Tổng Tour Trong Kho
            </span>
            <div className="mt-1 text-3xl font-serif font-black text-stone-900">
              {stats.total}
            </div>
            <span className="text-[11px] text-stone-500">hành trình thương mại</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-800">
            <Compass className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Đang Mở Bán (ACTIVE)
            </span>
            <div className="mt-1 text-3xl font-serif font-black text-emerald-900">
              {stats.active}
            </div>
            <span className="text-[11px] text-emerald-700">hiển thị trên website</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-stone-50 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
              Đang Tắt / Ẩn (INACTIVE)
            </span>
            <div className="mt-1 text-3xl font-serif font-black text-stone-700">
              {stats.inactive}
            </div>
            <span className="text-[11px] text-stone-500">khách không nhìn thấy</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-stone-200/70 flex items-center justify-center text-stone-600">
            <XCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER TOOLBAR ─── */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-5 shadow-sm mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm tour theo tên, điểm đến, slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter by Region */}
        <div className="flex items-center gap-2">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value as any)}
            className="py-2.5 px-3 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="all">Tất cả các miền</option>
            <option value="bac">Miền Bắc</option>
            <option value="trung">Miền Trung</option>
            <option value="nam">Miền Nam</option>
          </select>

          {/* Filter by Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="py-2.5 px-3 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang mở bán (ACTIVE)</option>
            <option value="INACTIVE">Đang tắt (INACTIVE)</option>
          </select>
        </div>
      </div>

      {/* ─── TOURS DATA TABLE ─── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white border p-6 h-28" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
          <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-stone-800 mb-1">Không thể tải dữ liệu tour</p>
          <p className="text-xs text-stone-500 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchTours}>Thử lại</Button>
        </div>
      ) : filteredTours.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <Compass className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-base text-stone-900">Không tìm thấy tour phù hợp</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
            {searchQuery || regionFilter !== 'all' || statusFilter !== 'all'
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc để xem các tour khác.'
              : 'Kho tour hiện đang trống. Hãy bấm nút "Thêm Tour Mới" để tạo hành trình thương mại đầu tiên.'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {(searchQuery || regionFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setRegionFilter('all');
                  setStatusFilter('all');
                }}
                className="text-xs"
              >
                Xóa bộ lọc
              </Button>
            )}
            <Button onClick={handleOpenCreate} className="bg-stone-900 text-white text-xs">
              Thêm tour mới
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/80 bg-white shadow-sm">
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-[#faf9f5] text-stone-500 font-bold uppercase tracking-wider border-b border-stone-200/80">
              <tr>
                <th className="py-4 px-4 sm:px-6">Ảnh & Hành Trình</th>
                <th className="py-4 px-4 sm:px-6">Khu Vực & Điểm Đến</th>
                <th className="py-4 px-4 sm:px-6">Thời Lượng</th>
                <th className="py-4 px-4 sm:px-6">Biểu Giá (Vé)</th>
                <th className="py-4 px-4 sm:px-6">Kho Chỗ (Slot)</th>
                <th className="py-4 px-4 sm:px-6">Khởi Hành</th>
                <th className="py-4 px-4 sm:px-6 text-center">Bật / Tắt</th>
                <th className="py-4 px-4 sm:px-6 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredTours.map((tour) => {
                const isActive = tour.status === 'ACTIVE';
                const seatPercent = Math.min(100, Math.round((tour.availableSeats / tour.totalSeats) * 100));

                return (
                  <tr key={tour.id} className="hover:bg-stone-50/70 transition">
                    {/* Thumbnail & Title */}
                    <td className="py-4 px-4 sm:px-6 font-semibold text-stone-900 max-w-xs">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-18 sm:w-20 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                          <img
                            src={tour.imageUrl || '/tour-ha-long.jpg'}
                            alt={tour.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/tours/${tour.slug || tour.id}`}
                            target="_blank"
                            title="Xem trước trên website"
                            className="font-bold text-stone-900 hover:text-amber-800 transition block truncate text-xs"
                          >
                            {tour.title}
                          </Link>
                          <span className="block text-[10px] text-stone-400 font-mono truncate mt-0.5">
                            slug: {tour.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Destination & Region */}
                    <td className="py-4 px-4 sm:px-6">
                      <span className="font-bold text-stone-900 block">{tour.destination}</span>
                      <span
                        className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tour.region === 'nam'
                            ? 'bg-orange-100 text-orange-900'
                            : tour.region === 'trung'
                            ? 'bg-sky-100 text-sky-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {tour.regionName || (tour.region === 'nam' ? 'Miền Nam' : tour.region === 'trung' ? 'Miền Trung' : 'Miền Bắc')}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="py-4 px-4 sm:px-6 font-medium text-stone-800">
                      {tour.durationDays} Ngày {Math.max(1, tour.durationDays - 1)} Đêm
                    </td>

                    {/* Pricing */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-bold text-amber-900 text-xs">
                        {formatVND(tour.adultPrice)}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        Trẻ em: {formatVND(tour.childPrice)}
                      </div>
                    </td>

                    {/* Slots / Capacity */}
                    <td className="py-4 px-4 sm:px-6 min-w-[130px]">
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className={tour.availableSeats <= 5 ? 'text-red-700' : 'text-emerald-700'}>
                          Còn {tour.availableSeats} chỗ
                        </span>
                        <span className="text-[10px] text-stone-400">/{tour.totalSeats} tổng</span>
                      </div>
                      <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            seatPercent < 20
                              ? 'bg-red-500'
                              : seatPercent < 50
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${seatPercent}%` }}
                        />
                      </div>
                    </td>

                    {/* Departure Date */}
                    <td className="py-4 px-4 sm:px-6 font-medium text-stone-800">
                      {formatDate(tour.departureAt)}
                    </td>

                    {/* BẬT / TẮT Toggle */}
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(tour)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 shadow-sm'
                            : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                        }`}
                        title={isActive ? 'Nhấn để TẮT mở bán tour' : 'Nhấn để BẬT mở bán tour'}
                      >
                        {isActive ? (
                          <>
                            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                            <span>BẬT (Mở)</span>
                          </>
                        ) : (
                          <>
                            <span className="h-2 w-2 rounded-full bg-stone-500" />
                            <span>TẮT (Ẩn)</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/tours/${tour.slug || tour.id}`}
                          target="_blank"
                          className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition"
                          title="Xem trên website khách"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(tour)}
                          className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition"
                          title="Sửa tour"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTour(tour)}
                          className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          title="Xóa tour"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── CREATE / EDIT TOUR MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div>
                <h3 className="font-serif text-xl font-black text-stone-900">
                  {editingTour ? 'Chỉnh Sửa Tour Du Lịch' : 'Thêm Tour Du Lịch Mới'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {editingTour
                    ? 'Cập nhật lại hình ảnh, giá vé, lịch trình và kho chỗ'
                    : 'Tạo hành trình mới và đồng bộ trực tiếp ra website của khách hàng'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTour} className="space-y-4 text-xs">
              {/* Tour Title */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Tên tour *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hải Trình Di Sản Vịnh Hạ Long 5 Sao"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!editingTour && !slug) {
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Slug & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Slug URL (đường dẫn web) *
                  </label>
                  <input
                    type="text"
                    required
                    pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                    placeholder="hai-trinh-ha-long"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Điểm đến (Tỉnh / Thành phố) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Quảng Ninh, Đà Nẵng, Sa Pa..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Region & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Khu vực (Miền) *
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="bac">Miền Bắc</option>
                    <option value="trung">Miền Trung</option>
                    <option value="nam">Miền Nam</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Thời lượng (Số ngày) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Image Configuration & Preset Picker */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-800 flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-amber-600" />
                    <span>Ảnh đại diện tour *</span>
                  </label>
                  <span className="text-[10px] text-stone-500">
                    URL hoặc chọn mẫu có sẵn
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-24 rounded-xl overflow-hidden bg-stone-200 border border-stone-300 shrink-0 shadow-sm">
                    <img
                      src={imageUrl || '/tour-ha-long.jpg'}
                      alt="Xem trước ảnh tour"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      required
                      placeholder="Nhập đường dẫn ảnh (URL hoặc /tour-*.jpg)"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg cursor-pointer transition">
                        Tải ảnh từ máy
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Preset Fast Picker */}
                <div>
                  <span className="text-[10px] font-bold text-stone-500 block mb-1.5">
                    Ảnh mẫu chuẩn phong cảnh Việt Nam:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((p) => (
                      <button
                        key={p.url}
                        type="button"
                        onClick={() => setImageUrl(p.url)}
                        className={`text-[10px] font-medium px-2 py-1 rounded-lg border transition ${
                          imageUrl === p.url
                            ? 'bg-amber-500 text-stone-950 font-bold border-amber-500 shadow-sm'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing (Adult & Child) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Giá người lớn (VND) *
                  </label>
                  <input
                    type="number"
                    min={100000}
                    step={50000}
                    required
                    value={adultPrice}
                    onChange={(e) => setAdultPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                  <span className="text-[10px] text-amber-800 font-semibold mt-0.5 block">
                    {formatVND(adultPrice)}
                  </span>
                </div>

                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Giá trẻ em (VND) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    required
                    value={childPrice}
                    onChange={(e) => setChildPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                  <span className="text-[10px] text-stone-500 font-semibold mt-0.5 block">
                    {formatVND(childPrice)}
                  </span>
                </div>
              </div>

              {/* Slots & Departure Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Tổng số chỗ *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Số chỗ còn trống *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={totalSeats}
                    required
                    value={availableSeats}
                    onChange={(e) => setAvailableSeats(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Ngày khởi hành *
                  </label>
                  <input
                    type="date"
                    required
                    value={departureAt}
                    onChange={(e) => setDepartureAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Mô tả tour *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Mô tả chi tiết những trải nghiệm đáng giá của chuyến đi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Highlights */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Điểm nhấn nổi bật (ngăn cách bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  placeholder="Du thuyền 5 sao, Tắm biển, Buffet hải sản..."
                  value={highlightsText}
                  onChange={(e) => setHighlightsText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Active Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                <div>
                  <span className="font-bold text-stone-900 block">Trạng thái mở bán</span>
                  <span className="text-[11px] text-stone-500">
                    Bật để tour hiển thị và cho phép khách đặt ngay trên trang web
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus(status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                    status === 'ACTIVE'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  }`}
                >
                  {status === 'ACTIVE' ? 'ĐANG BẬT (Mở bán)' : 'ĐANG TẮT (Ẩn)'}
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-stone-900 hover:bg-stone-800 text-white font-bold"
                >
                  {submitting
                    ? 'Đang lưu...'
                    : editingTour
                    ? 'Lưu thay đổi tour'
                    : 'Tạo & Đăng tour'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ─── */}
      {deletingTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-stone-200 text-stone-900 animate-scale-up">
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shadow-sm">
              <Trash2 className="h-6 w-6" />
            </div>

            <h3 className="text-center font-bold text-lg text-stone-900">
              Xóa Tour Du Lịch?
            </h3>
            <p className="mt-2 text-center text-xs text-stone-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa tour <strong className="text-stone-900">"{deletingTour.title}"</strong> không? Tour sẽ ngay lập tức bị gỡ bỏ khỏi website và không thể hoàn tác.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingTour(null)}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs font-bold hover:bg-stone-100 transition active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition active:scale-95"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
