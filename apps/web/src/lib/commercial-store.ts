'use client';

import type { Booking, Schedule, Tour } from '@tour/shared';
import { FALLBACK_TOURS } from './fallback-data';

export interface CommercialTour extends Tour {
  region: 'bac' | 'trung' | 'nam';
  regionName: string;
  imageUrl: string;
  adultPrice: number;
  childPrice: number;
  totalSeats: number;
  availableSeats: number;
  departureAt: string;
  highlights: string[];
}

// Convert baseline static tours into full commercial tours
const BASELINE_COMMERCIAL_TOURS: CommercialTour[] = FALLBACK_TOURS.map((t, idx) => {
  const intervals = [3, 7, 14, 21];
  const daysOffset = intervals[idx % intervals.length];
  const depTime = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000).toISOString();

  const imgMap: Record<string, string> = {
    'vinh-ha-long-du-thuyen-kayak': '/tour-ha-long.jpg',
    'sa-pa-chinh-phuc-fansipan-cat-cat': '/tour-sapa.jpg',
    'ninh-binh-trang-an-bai-dinh-hang-mua': '/tour-ninh-binh.jpg',
    'da-nang-hoi-an-ba-na-hills-cau-vang': '/tour-da-nang.jpg',
    'hue-co-do-dai-noi-ca-hue-song-huong': '/tour-hue.jpg',
    'nha-trang-bien-xanh-dao-diep-son': '/tour-nha-trang.jpg',
    'phu-quoc-dao-ngoc-lan-ngam-san-ho': '/tour-phu-quoc.jpg',
    'can-tho-cho-noi-cai-rang-miet-vuon': '/tour-can-tho.jpg',
    'tay-ninh-nui-ba-den-toa-thanh': '/tour-tay-ninh.jpg',
  };

  return {
    ...t,
    imageUrl: imgMap[t.slug] || '/tour-ha-long.jpg',
    region: t.region || 'bac',
    regionName: t.region === 'nam' ? 'Miền Nam' : t.region === 'trung' ? 'Miền Trung' : 'Miền Bắc',
    adultPrice: t.adultPrice || 2450000,
    childPrice: t.childPrice || 1650000,
    totalSeats: 30,
    availableSeats: idx % 2 === 0 ? 12 : 22,
    departureAt: depTime,
    highlights: t.highlights || ['Khám phá điểm đến nổi tiếng', 'Ẩm thực phong phú', 'Khách sạn tiêu chuẩn cao'],
    status: 'ACTIVE',
  };
});

const TOURS_STORAGE_KEY = 'delta_commercial_tours';
const BOOKINGS_STORAGE_KEY = 'delta_commercial_bookings';

// ─── TOURS STORE ─────────────────────────────────────────────────────────────

export function getCommercialTours(): CommercialTour[] {
  if (typeof window === 'undefined') return BASELINE_COMMERCIAL_TOURS;
  try {
    const raw = localStorage.getItem(TOURS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TOURS_STORAGE_KEY, JSON.stringify(BASELINE_COMMERCIAL_TOURS));
      return BASELINE_COMMERCIAL_TOURS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return BASELINE_COMMERCIAL_TOURS;
  } catch (e) {
    console.warn('Error reading commercial tours store:', e);
    return BASELINE_COMMERCIAL_TOURS;
  }
}

export function saveCommercialTours(tours: CommercialTour[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOURS_STORAGE_KEY, JSON.stringify(tours));
    window.dispatchEvent(new CustomEvent('delta_tours_updated'));
  } catch (e) {
    console.error('Failed to save commercial tours:', e);
  }
}

export function getPublicCommercialTours(q = '', region = ''): CommercialTour[] {
  const all = getCommercialTours();
  return all.filter((tour) => {
    // Only ACTIVE tours are displayed to public customers
    if (tour.status !== 'ACTIVE') return false;

    if (region && tour.region !== region) return false;

    if (q) {
      const search = q.toLowerCase();
      const matchTitle = tour.title.toLowerCase().includes(search);
      const matchDest = tour.destination.toLowerCase().includes(search);
      const matchSlug = tour.slug.toLowerCase().includes(search);
      const matchDesc = tour.description.toLowerCase().includes(search);
      if (!matchTitle && !matchDest && !matchSlug && !matchDesc) return false;
    }

    return true;
  });
}

export function getCommercialTourById(idOrSlug: string): CommercialTour | null {
  const all = getCommercialTours();
  return all.find((t) => t.id === idOrSlug || t.slug === idOrSlug) || null;
}

export function createCommercialTour(input: Partial<CommercialTour>): CommercialTour {
  const tours = getCommercialTours();
  const hex = Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  const title = input.title?.trim() || 'Tour Du Lịch Mới';
  const defaultSlug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `tour-${hex}`;

  const slug = (input.slug?.trim() || defaultSlug).toLowerCase();

  const newTour: CommercialTour = {
    id: `a1000000-${Date.now().toString().slice(-4)}-4000-8000-${hex.padStart(12, '0')}`,
    slug,
    title,
    description: input.description?.trim() || 'Hành trình khám phá độc bản cùng DELTA TRAVEL.',
    destination: input.destination?.trim() || 'Việt Nam',
    countryCode: 'VN',
    durationDays: Math.max(1, Number(input.durationDays) || 3),
    status: input.status || 'ACTIVE',
    region: input.region || 'bac',
    regionName: input.region === 'nam' ? 'Miền Nam' : input.region === 'trung' ? 'Miền Trung' : 'Miền Bắc',
    imageUrl: input.imageUrl?.trim() || '/tour-ha-long.jpg',
    adultPrice: Math.max(100000, Number(input.adultPrice) || 2500000),
    childPrice: Math.max(50000, Number(input.childPrice) || 1750000),
    totalSeats: Math.max(1, Number(input.totalSeats) || 30),
    availableSeats: Math.max(0, Number(input.availableSeats ?? input.totalSeats ?? 30)),
    departureAt: input.departureAt || new Date(Date.now() + 7 * 86400000).toISOString(),
    highlights: Array.isArray(input.highlights) && input.highlights.length > 0
      ? input.highlights
      : ['Khám phá danh lam thắng cảnh', 'Thưởng thức ẩm thực địa phương', 'Dịch vụ lưu trú cao cấp'],
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newTour, ...tours];
  saveCommercialTours(updated);
  return newTour;
}

export function updateCommercialTour(id: string, updates: Partial<CommercialTour>): CommercialTour {
  const tours = getCommercialTours();
  const idx = tours.findIndex((t) => t.id === id || t.slug === id);
  if (idx === -1) {
    throw new Error(`Không tìm thấy tour có ID: ${id}`);
  }

  const existing = tours[idx];
  const updatedTour: CommercialTour = {
    ...existing,
    ...updates,
    id: existing.id, // Preserve ID
    updatedAt: new Date().toISOString(),
  };

  if (updates.region) {
    updatedTour.regionName =
      updates.region === 'nam' ? 'Miền Nam' : updates.region === 'trung' ? 'Miền Trung' : 'Miền Bắc';
  }

  tours[idx] = updatedTour;
  saveCommercialTours(tours);
  return updatedTour;
}

export function toggleCommercialTourStatus(id: string): CommercialTour {
  const tours = getCommercialTours();
  const idx = tours.findIndex((t) => t.id === id || t.slug === id);
  if (idx === -1) {
    throw new Error(`Không tìm thấy tour để đổi trạng thái: ${id}`);
  }

  const current = tours[idx];
  const newStatus = current.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  current.status = newStatus;
  current.updatedAt = new Date().toISOString();

  tours[idx] = current;
  saveCommercialTours(tours);
  return current;
}

export function deleteCommercialTour(id: string): boolean {
  const tours = getCommercialTours();
  const filtered = tours.filter((t) => t.id !== id && t.slug !== id);
  saveCommercialTours(filtered);
  return true;
}

export function getCommercialSchedules(tourIdOrSlug: string): Schedule[] {
  const tour = getCommercialTourById(tourIdOrSlug);
  if (!tour) return [];

  const baseDep = new Date(tour.departureAt).getTime() || Date.now() + 3 * 86400000;
  const intervals = [0, 4, 10, 18];

  return intervals.map((offsetDays, i) => {
    const depTime = new Date(baseDep + offsetDays * 86400000).toISOString();
    const available = Math.max(0, tour.availableSeats - i * 2);

    return {
      id: `b1000000-${tour.id.slice(-4)}-4000-8000-${(i + 1).toString().padStart(12, '0')}`,
      tourId: tour.id,
      departureAt: depTime,
      totalSeats: tour.totalSeats,
      reservedSeats: Math.max(0, tour.totalSeats - available),
      availableSeats: available,
      adultPrice: tour.adultPrice,
      childPrice: tour.childPrice,
      status: available > 0 ? 'OPEN' : 'CLOSED',
      serverTime: new Date().toISOString(),
    };
  });
}

// ─── BOOKINGS & FINANCIAL STATEMENT STORE ────────────────────────────────────
// Real commercial data: if there are no bookings, return empty array [].
// DO NOT fake bookings or mock statistics.

export function getCommercialBookings(): Booking[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Error reading commercial bookings:', e);
    return [];
  }
}

export function saveCommercialBookings(bookings: Booking[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
    window.dispatchEvent(new CustomEvent('delta_bookings_updated'));
  } catch (e) {
    console.error('Failed to save commercial bookings:', e);
  }
}

export function recordCommercialBooking(booking: Booking): Booking {
  const existing = getCommercialBookings();
  const updated = [booking, ...existing.filter((b) => b.id !== booking.id)];
  saveCommercialBookings(updated);
  return booking;
}

export function updateCommercialBookingStatus(
  id: string,
  status: 'PENDING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED',
  reason?: string,
): Booking {
  const bookings = getCommercialBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) {
    throw new Error(`Không tìm thấy đơn hàng mã: ${id}`);
  }

  const b = bookings[idx];
  b.status = status;
  if (status === 'CANCELLED') {
    b.cancelledAt = new Date().toISOString();
    b.cancelReason = reason || 'Quản trị viên hủy đơn';
  }
  if (status === 'PAID' && !b.paidAt) {
    b.paidAt = new Date().toISOString();
  }

  bookings[idx] = b;
  saveCommercialBookings(bookings);
  return b;
}
