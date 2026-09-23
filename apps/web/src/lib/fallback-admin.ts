import { FALLBACK_TOURS, getFallbackSchedules } from './fallback-data';
import type { Booking, Payment, User } from '@tour/shared';

// Initial realistic seed bookings
const SEED_BOOKINGS: Booking[] = [
  {
    id: 'c1000000-0001-4000-8000-000000000001',
    scheduleId: 'b1000000-0001-4000-8000-000000000001',
    status: 'PAID',
    adults: 2,
    children: 1,
    totalAmount: 6550000,
    currency: 'VND',
    contactName: 'Nguyễn Văn An',
    contactEmail: 'an.nguyen@gmail.com',
    contactPhone: '0912345678',
    expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    paidAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    cancelledAt: null,
    cancelReason: null,
    tourTitle: 'Vịnh Hạ Long — Trải Nghiệm Du Thuyền & Chèo Thuyền Kayak',
    departureAt: new Date(Date.now() + 86400000 * 4).toISOString(),
    details: [
      { kind: 'ADULT', quantity: 2, unitPrice: 2450000, lineTotal: 4900000 },
      { kind: 'CHILD', quantity: 1, unitPrice: 1650000, lineTotal: 1650000 },
    ],
    serverTime: new Date().toISOString(),
  },
  {
    id: 'c1000000-0002-4000-8000-000000000002',
    scheduleId: 'b1000000-0002-4000-8000-000000000001',
    status: 'CONFIRMED',
    adults: 4,
    children: 0,
    totalAmount: 11400000,
    currency: 'VND',
    contactName: 'Trần Thị Mai',
    contactEmail: 'mai.tran@outlook.com',
    contactPhone: '0988776655',
    expiresAt: new Date(Date.now() + 86400000 * 8).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    paidAt: new Date(Date.now() - 3600000 * 11).toISOString(),
    cancelledAt: null,
    cancelReason: null,
    tourTitle: 'Sa Pa — Chinh Phục Đỉnh Fansipan & Khám Phá Bản Cát Cát',
    departureAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    details: [
      { kind: 'ADULT', quantity: 4, unitPrice: 2850000, lineTotal: 11400000 },
    ],
    serverTime: new Date().toISOString(),
  },
  {
    id: 'c1000000-0003-4000-8000-000000000003',
    scheduleId: 'b1000000-0004-4000-8000-000000000001',
    status: 'PENDING_PAYMENT',
    adults: 2,
    children: 0,
    totalAmount: 4500000,
    currency: 'VND',
    contactName: 'Lê Hoàng Long',
    contactEmail: 'long.le@gmail.com',
    contactPhone: '0903112233',
    expiresAt: new Date(Date.now() + 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    paidAt: null,
    cancelledAt: null,
    cancelReason: null,
    tourTitle: 'Đà Nẵng — Hội An — Bà Nà Hills — Cầu Vàng',
    departureAt: new Date(Date.now() + 86400000 * 10).toISOString(),
    details: [
      { kind: 'ADULT', quantity: 2, unitPrice: 2250000, lineTotal: 4500000 },
    ],
    serverTime: new Date().toISOString(),
  },
  {
    id: 'c1000000-0004-4000-8000-000000000004',
    scheduleId: 'b1000000-0006-4000-8000-000000000001',
    status: 'COMPLETED',
    adults: 3,
    children: 2,
    totalAmount: 18450000,
    currency: 'VND',
    contactName: 'Phạm Minh Đức',
    contactEmail: 'duc.pham@tech.vn',
    contactPhone: '0977665544',
    expiresAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    paidAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    cancelledAt: null,
    cancelReason: null,
    tourTitle: 'Phú Quốc — Thiên Đường Đảo Ngọc & Cáp Treo Hòn Thơm',
    departureAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    details: [
      { kind: 'ADULT', quantity: 3, unitPrice: 4250000, lineTotal: 12750000 },
      { kind: 'CHILD', quantity: 2, unitPrice: 2850000, lineTotal: 5700000 },
    ],
    serverTime: new Date().toISOString(),
  },
  {
    id: 'c1000000-0005-4000-8000-000000000005',
    scheduleId: 'b1000000-0003-4000-8000-000000000001',
    status: 'CANCELLED',
    adults: 2,
    children: 0,
    totalAmount: 3900000,
    currency: 'VND',
    contactName: 'Đặng Thùy Dung',
    contactEmail: 'dung.dang@gmail.com',
    contactPhone: '0933221100',
    expiresAt: new Date(Date.now() + 86400000 * 6).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    paidAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    cancelledAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    cancelReason: 'Thay đổi kế hoạch công tác đột xuất.',
    tourTitle: 'Cố Đô Huế — Di Sản Triều Nguyễn & Ca Huế Sông Hương',
    departureAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    details: [
      { kind: 'ADULT', quantity: 2, unitPrice: 1950000, lineTotal: 3900000 },
    ],
    serverTime: new Date().toISOString(),
  },
];

// Initial realistic seed payments
const SEED_PAYMENTS: Payment[] = [
  {
    id: 'd1000000-0001-4000-8000-000000000001',
    bookingId: 'c1000000-0001-4000-8000-000000000001',
    provider: 'VNPAY',
    status: 'SUCCEEDED',
    amount: 6550000,
    currency: 'VND',
    checkoutUrl: null,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'd1000000-0002-4000-8000-000000000002',
    bookingId: 'c1000000-0002-4000-8000-000000000002',
    provider: 'MOMO',
    status: 'SUCCEEDED',
    amount: 11400000,
    currency: 'VND',
    checkoutUrl: null,
    createdAt: new Date(Date.now() - 3600000 * 11).toISOString(),
  },
  {
    id: 'd1000000-0004-4000-8000-000000000004',
    bookingId: 'c1000000-0004-4000-8000-000000000004',
    provider: 'ZALOPAY',
    status: 'SUCCEEDED',
    amount: 18450000,
    currency: 'VND',
    checkoutUrl: null,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'd1000000-0005-4000-8000-000000000005',
    bookingId: 'c1000000-0005-4000-8000-000000000005',
    provider: 'VNPAY',
    status: 'REFUNDED',
    amount: 3900000,
    currency: 'VND',
    checkoutUrl: null,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export interface FallbackAuditLog {
  id: string;
  actorId: string | null;
  action: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const SEED_AUDIT_LOGS: FallbackAuditLog[] = [
  {
    id: 'e1000000-0001-4000-8000-000000000001',
    actorId: '00000000-0000-4000-8000-000000000001',
    action: 'AUTH_LOGIN_SUCCESS',
    entityId: 'admin@tour.local',
    metadata: { role: 'ADMIN', ip: '127.0.0.1', device: 'Windows 11 Workstation' },
    createdAt: new Date(Date.now() - 1000 * 120).toISOString(),
  },
  {
    id: 'e1000000-0002-4000-8000-000000000002',
    actorId: '00000000-0000-4000-8000-000000000001',
    action: 'SYSTEM_SECURITY_ARMED',
    entityId: 'WAF_RATE_LIMITER',
    metadata: { limitPerMin: 60, status: 'ACTIVE', protectionLevel: 'ROOT' },
    createdAt: new Date(Date.now() - 1000 * 360).toISOString(),
  },
  {
    id: 'e1000000-0003-4000-8000-000000000003',
    actorId: '00000000-0000-4000-8000-000000000001',
    action: 'GROQ_AI_ACTIVE_SYNC',
    entityId: 'llama-3.3-70b-versatile',
    metadata: { temperature: 0.3, maxTokens: 1024, streamLatency: '42ms' },
    createdAt: new Date(Date.now() - 1000 * 600).toISOString(),
  },
  {
    id: 'e1000000-0004-4000-8000-000000000004',
    actorId: null,
    action: 'PAYMENT_CAPTURE_DIRECT',
    entityId: 'd1000000-0001-4000-8000-000000000001',
    metadata: { amount: 6550000, provider: 'DIRECT_CASH', customer: 'Nguyễn Văn An' },
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'e1000000-0005-4000-8000-000000000005',
    actorId: '00000000-0000-4000-8000-000000000001',
    action: 'TOUR_CATALOG_SYNC',
    entityId: 'FALLBACK_TOURS',
    metadata: { totalTours: 10, totalSchedules: 10, webpFlipbookFrames: 150 },
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

export function getStoredAdminBookings(): Booking[] {
  if (typeof window === 'undefined') return SEED_BOOKINGS;
  const stored = localStorage.getItem('delta_admin_bookings');
  if (!stored) {
    localStorage.setItem('delta_admin_bookings', JSON.stringify(SEED_BOOKINGS));
    return SEED_BOOKINGS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return SEED_BOOKINGS;
  }
}

export function updateStoredBookingStatus(id: string, status: 'CONFIRMED' | 'COMPLETED'): Booking {
  const current = getStoredAdminBookings();
  const index = current.findIndex((b) => b.id === id);
  if (index === -1) throw new Error('Không tìm thấy đơn hàng cần cập nhật');
  const updated: Booking = { ...current[index], status };
  current[index] = updated;
  if (typeof window !== 'undefined') {
    localStorage.setItem('delta_admin_bookings', JSON.stringify(current));
  }
  return updated;
}

export function cancelStoredBooking(id: string, reason: string): Booking {
  const current = getStoredAdminBookings();
  const index = current.findIndex((b) => b.id === id);
  if (index === -1) throw new Error('Không tìm thấy đơn hàng cần hủy');
  const updated: Booking = {
    ...current[index],
    status: 'CANCELLED',
    cancelledAt: new Date().toISOString(),
    cancelReason: reason,
  };
  current[index] = updated;
  if (typeof window !== 'undefined') {
    localStorage.setItem('delta_admin_bookings', JSON.stringify(current));
  }
  return updated;
}

export function getStoredAdminPayments(): Payment[] {
  if (typeof window === 'undefined') return SEED_PAYMENTS;
  const stored = localStorage.getItem('delta_admin_payments');
  if (!stored) {
    localStorage.setItem('delta_admin_payments', JSON.stringify(SEED_PAYMENTS));
    return SEED_PAYMENTS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return SEED_PAYMENTS;
  }
}

export function recordStoredRefund(id: string, ref: string, note: string): Payment {
  const current = getStoredAdminPayments();
  const index = current.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Không tìm thấy giao dịch cần hoàn tiền');
  const updated: Payment = { ...current[index], status: 'REFUNDED' };
  current[index] = updated;
  if (typeof window !== 'undefined') {
    localStorage.setItem('delta_admin_payments', JSON.stringify(current));
  }
  return updated;
}

export function getStoredAuditLogs(): FallbackAuditLog[] {
  if (typeof window === 'undefined') return SEED_AUDIT_LOGS;
  const stored = localStorage.getItem('delta_admin_audit_logs');
  if (!stored) {
    localStorage.setItem('delta_admin_audit_logs', JSON.stringify(SEED_AUDIT_LOGS));
    return SEED_AUDIT_LOGS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return SEED_AUDIT_LOGS;
  }
}
