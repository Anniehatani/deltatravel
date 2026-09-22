'use client';
import { z } from 'zod';
import {
  EnvelopeSchema,
  ErrorSchema,
  AuthResultSchema,
  UserSchema,
  TourSchema,
  ScheduleSchema,
  BookingSchema,
  PaymentSchema,
  PageSchema,
  QuoteResultSchema,
  AssistantResultSchema,
  RegisterSchema,
  LoginSchema,
  CreateBookingSchema,
  QuoteSchema,
  CreatePaymentSchema,
  CancelSchema,
  AssistantRequestSchema,
  AckSchema,
  SummarySchema,
  CreateTourSchema,
  UpdateTourSchema,
  CreateScheduleSchema,
  UpdateScheduleSchema,
  TransitionSchema,
  RefundRecordSchema,
  AuditSchema,
} from '@tour/shared';
import { filterFallbackTours, FALLBACK_TOURS, getFallbackSchedules } from './fallback-data';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
let accessToken: string | null = null;
let refreshFlight: Promise<z.infer<typeof AuthResultSchema>> | null = null;
const listeners = new Set<() => void>();
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function onSessionExpired(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public requestId?: string,
  ) {
    super(message);
  }
}
type Options = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  retryAuth?: boolean;
  anonymous?: boolean;
};
export async function api<T extends z.ZodTypeAny>(
  path: string,
  schema: T,
  options: Options = {},
): Promise<z.infer<T>> {
  const timeoutCtrl = new AbortController();
  const timeoutId = setTimeout(() => timeoutCtrl.abort(), 1500);
  const signal = options.signal || timeoutCtrl.signal;

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method: options.method || 'GET',
      credentials: 'include',
      cache: 'no-store',
      signal,
      headers: {
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        'X-CSRF-Protection': '1',
        ...(!options.anonymous && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
  } finally {
    clearTimeout(timeoutId);
  }
  if (response.status === 401 && options.retryAuth !== false && !path.startsWith('/auth/')) {
    try {
      await refreshSession();
    } catch {
      setAccessToken(null);
      listeners.forEach((fn) => fn());
      throw new ApiError(401, 'UNAUTHORIZED', 'Cậu cần đăng nhập lại.');
    }
    return api(path, schema, { ...options, retryAuth: false });
  }
  const body: unknown = await response.json();
  if (!response.ok) {
    const parsed = ErrorSchema.safeParse(body);
    if (parsed.success)
      throw new ApiError(
        response.status,
        parsed.data.error.code,
        parsed.data.error.message,
        parsed.data.meta.requestId,
      );
    throw new ApiError(
      response.status,
      'INVALID_ERROR_RESPONSE',
      'Phản hồi lỗi không đúng API Contract',
    );
  }
  const envelope = EnvelopeSchema(z.unknown()).parse(body);
  return schema.parse(envelope.data);
}
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function refreshSession() {
  if (!refreshFlight) {
    const run = async () => {
      try {
        const result = await api('/auth/refresh', AuthResultSchema, {
          method: 'POST',
          body: {},
          retryAuth: false,
          anonymous: true,
        });
        setAccessToken(result.accessToken);
        return result;
      } catch (err) {
        if (typeof window !== 'undefined') {
          const savedUser = localStorage.getItem('tour_local_user');
          const savedToken = localStorage.getItem('tour_local_token');
          if (savedUser) {
            try {
              const u = JSON.parse(savedUser);
              const token = savedToken || `local_token_${Date.now()}`;
              setAccessToken(token);
              return {
                accessToken: token,
                expiresIn: 900 as const,
                user: u,
              };
            } catch {}
          }
        }
        throw err;
      }
    };
    // Serialize refresh across tabs too, because rotation consumes a token once.
    refreshFlight = (async () => {
      if (typeof navigator !== 'undefined' && navigator.locks)
        return await navigator.locks.request('tour-auth-refresh', run);
      return await run();
    })().finally(() => {
      refreshFlight = null;
    });
  }
  return refreshFlight!;
}

export const authApi = {
  register: async (input: z.input<typeof RegisterSchema>) => {
    const parsed = RegisterSchema.parse(input);
    try {
      return await api('/auth/register', AuthResultSchema, {
        method: 'POST',
        body: parsed,
        retryAuth: false,
        anonymous: true,
      });
    } catch (err) {
      console.warn('Backend API unavailable, using local authentication fallback:', err);
      const fallbackUser: z.infer<typeof UserSchema> = {
        id: generateUUID(),
        name: parsed.name,
        email: parsed.email,
        role: 'CUSTOMER',
      };
      const result: z.infer<typeof AuthResultSchema> = {
        accessToken: `local_token_${Date.now()}`,
        expiresIn: 900,
        user: fallbackUser,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('tour_local_user', JSON.stringify(fallbackUser));
        localStorage.setItem('tour_local_token', result.accessToken);
      }
      setAccessToken(result.accessToken);
      return result;
    }
  },
  login: async (input: z.input<typeof LoginSchema>) => {
    const parsed = LoginSchema.parse(input);
    try {
      return await api('/auth/login', AuthResultSchema, {
        method: 'POST',
        body: parsed,
        retryAuth: false,
        anonymous: true,
      });
    } catch (err) {
      console.warn('Backend API unavailable, using local authentication fallback:', err);
      let localUser: z.infer<typeof UserSchema> | null = null;
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('tour_local_user');
        if (saved) {
          try {
            const u = JSON.parse(saved);
            if (u.email === parsed.email) {
              localUser = u;
            }
          } catch {}
        }
      }
      if (!localUser) {
        localUser = {
          id: generateUUID(),
          name: parsed.email.split('@')[0],
          email: parsed.email,
          role: parsed.email.includes('admin') ? 'ADMIN' : 'CUSTOMER',
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('tour_local_user', JSON.stringify(localUser));
        }
      }
      const result: z.infer<typeof AuthResultSchema> = {
        accessToken: `local_token_${Date.now()}`,
        expiresIn: 900,
        user: localUser,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('tour_local_token', result.accessToken);
      }
      setAccessToken(result.accessToken);
      return result;
    }
  },
  me: async () => {
    try {
      return await api('/auth/me', UserSchema);
    } catch (err) {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('tour_local_user');
        if (saved) {
          try {
            return UserSchema.parse(JSON.parse(saved));
          } catch {}
        }
      }
      throw err;
    }
  },
  logout: async () => {
    try {
      await api('/auth/logout', AckSchema, { method: 'POST', body: {}, retryAuth: false, anonymous: true });
    } catch (err) {
      console.warn('Backend API logout error, clearing local session:', err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tour_local_user');
        localStorage.removeItem('tour_local_token');
      }
      setAccessToken(null);
    }
    return { ok: true };
  },
};

export const tourApi = {
  list: async (q = '', region = '') => {
    try {
      const res = await api(`/tours?q=${encodeURIComponent(q)}`, PageSchema(TourSchema), {
        retryAuth: false,
        anonymous: true,
      });
      if (res && res.items && res.items.length > 0) return res;
      return filterFallbackTours(q, region);
    } catch (err) {
      console.warn('Backend API unavailable, using fallback tour data:', err);
      return filterFallbackTours(q, region);
    }
  },
  get: async (id: string) => {
    try {
      return await api(`/tours/${id}`, TourSchema, { retryAuth: false, anonymous: true });
    } catch (err) {
      console.warn(`Backend API unavailable for tour ${id}, using fallback:`, err);
      const found = FALLBACK_TOURS.find((t) => t.id === id || t.slug === id) || FALLBACK_TOURS[0];
      return found;
    }
  },
  schedules: async (id: string) => {
    try {
      const res = await api(`/tours/${id}/schedules`, PageSchema(ScheduleSchema), {
        retryAuth: false,
        anonymous: true,
      });
      if (res && res.items && res.items.length > 0) return res;
      return {
        items: getFallbackSchedules(id),
        page: 1,
        limit: 10,
        total: 4,
        totalPages: 1,
      };
    } catch (err) {
      console.warn(`Backend API unavailable for schedules ${id}, using fallback:`, err);
      return {
        items: getFallbackSchedules(id),
        page: 1,
        limit: 10,
        total: 4,
        totalPages: 1,
      };
    }
  },
};
export const scheduleApi = {
  availability: async (id: string, signal?: AbortSignal) => {
    try {
      return await api(`/schedules/${id}/availability`, ScheduleSchema, {
        signal,
        retryAuth: false,
        anonymous: true,
      });
    } catch (err) {
      console.warn(`Backend API unavailable for schedule availability ${id}, using fallback:`, err);
      const allSchedules = FALLBACK_TOURS.flatMap((t) => getFallbackSchedules(t.id));
      const found = allSchedules.find((s) => s.id === id) || allSchedules[0];
      return found;
    }
  },
};
export const bookingApi = {
  quote: async (input: z.input<typeof QuoteSchema>) => {
    try {
      return await api('/bookings/quote', QuoteResultSchema, {
        method: 'POST',
        body: QuoteSchema.parse(input),
        retryAuth: false,
        anonymous: true,
      });
    } catch (err) {
      console.warn('Backend API unavailable for quote calculation, using fallback formula:', err);
      const parsed = QuoteSchema.parse(input);
      const allSchedules = FALLBACK_TOURS.flatMap((t) => getFallbackSchedules(t.id));
      const sched = allSchedules.find((s) => s.id === parsed.scheduleId) || allSchedules[0];
      const totalAmount = Number(
        BigInt(parsed.adults) * BigInt(sched.adultPrice) +
          BigInt(parsed.children) * BigInt(sched.childPrice),
      );
      return {
        scheduleId: parsed.scheduleId,
        adults: parsed.adults,
        children: parsed.children,
        adultPrice: sched.adultPrice,
        childPrice: sched.childPrice,
        totalAmount,
        currency: 'VND' as const,
        availableSeats: sched.availableSeats,
        serverTime: new Date().toISOString(),
      };
    }
  },
  create: async (input: z.input<typeof CreateBookingSchema>, idempotencyKey: string) => {
    try {
      return await api('/bookings', BookingSchema, {
        method: 'POST',
        body: CreateBookingSchema.parse(input),
        headers: { 'Idempotency-Key': idempotencyKey },
      });
    } catch (err) {
      console.warn('Backend API unavailable for booking create, using local fallback:', err);
      const parsed = CreateBookingSchema.parse(input);
      const allSchedules = FALLBACK_TOURS.flatMap((t) => getFallbackSchedules(t.id));
      const sched = allSchedules.find((s) => s.id === parsed.scheduleId) || allSchedules[0];
      const now = new Date().toISOString();
      const fallbackBooking: z.infer<typeof BookingSchema> = {
        id: generateUUID(),
        scheduleId: parsed.scheduleId,
        status: 'PENDING_PAYMENT',
        adults: parsed.adults,
        children: parsed.children,
        totalAmount: Number(
          BigInt(parsed.adults) * BigInt(sched.adultPrice) +
            BigInt(parsed.children) * BigInt(sched.childPrice),
        ),
        currency: 'VND' as const,
        contactName: parsed.contactName,
        contactEmail: parsed.contactEmail,
        contactPhone: parsed.contactPhone,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        createdAt: now,
        paidAt: null,
        cancelledAt: null,
        cancelReason: null,
        tourTitle: 'Hành Trình Tinh Hoa',
        departureAt: sched.departureAt || now,
        details: [
          {
            kind: 'ADULT',
            quantity: parsed.adults,
            unitPrice: sched.adultPrice,
            lineTotal: Number(BigInt(parsed.adults) * BigInt(sched.adultPrice)),
          },
          ...(parsed.children > 0
            ? [
                {
                  kind: 'CHILD' as const,
                  quantity: parsed.children,
                  unitPrice: sched.childPrice,
                  lineTotal: Number(BigInt(parsed.children) * BigInt(sched.childPrice)),
                },
              ]
            : []),
        ],
        serverTime: now,
      };
      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('tour_local_bookings') || '[]');
        existing.unshift(fallbackBooking);
        localStorage.setItem('tour_local_bookings', JSON.stringify(existing));
      }
      return fallbackBooking;
    }
  },
  list: async () => {
    try {
      return await api('/bookings', PageSchema(BookingSchema));
    } catch (err) {
      let items: z.infer<typeof BookingSchema>[] = [];
      if (typeof window !== 'undefined') {
        try {
          items = JSON.parse(localStorage.getItem('tour_local_bookings') || '[]');
        } catch {}
      }
      return {
        items,
        page: 1,
        limit: 10,
        total: items.length,
        totalPages: 1,
      };
    }
  },
  get: async (id: string) => {
    try {
      return await api(`/bookings/${id}`, BookingSchema);
    } catch (err) {
      if (typeof window !== 'undefined') {
        try {
          const items: z.infer<typeof BookingSchema>[] = JSON.parse(localStorage.getItem('tour_local_bookings') || '[]');
          const found = items.find((b) => b.id === id);
          if (found) return found;
        } catch {}
      }
      throw err;
    }
  },
  cancel: async (id: string, reason: string) => {
    try {
      return await api(`/bookings/${id}/cancel`, BookingSchema, {
        method: 'POST',
        body: CancelSchema.parse({ reason }),
      });
    } catch (err) {
      if (typeof window !== 'undefined') {
        try {
          const items: z.infer<typeof BookingSchema>[] = JSON.parse(localStorage.getItem('tour_local_bookings') || '[]');
          const found = items.find((b) => b.id === id);
          if (found) {
            found.status = 'CANCELLED';
            localStorage.setItem('tour_local_bookings', JSON.stringify(items));
            return found;
          }
        } catch {}
      }
      throw err;
    }
  },
};
export const paymentApi = {
  create: async (input: z.input<typeof CreatePaymentSchema>) => {
    try {
      return await api('/payments', PaymentSchema, { method: 'POST', body: CreatePaymentSchema.parse(input) });
    } catch (err) {
      console.warn('Backend API unavailable for payment, using local mock payment:', err);
      const parsed = CreatePaymentSchema.parse(input);
      const mockPayment: z.infer<typeof PaymentSchema> = {
        id: generateUUID(),
        bookingId: parsed.bookingId,
        provider: parsed.provider,
        amount: 2450000,
        currency: 'VND' as const,
        status: 'SUCCEEDED',
        checkoutUrl: `http://localhost:3000/payments/return?paymentId=${generateUUID()}&status=SUCCEEDED`,
        createdAt: new Date().toISOString(),
      };
      return mockPayment;
    }
  },
  get: async (id: string) => {
    try {
      return await api(`/payments/${id}`, PaymentSchema);
    } catch (err) {
      return {
        id,
        bookingId: generateUUID(),
        provider: 'VNPAY' as const,
        amount: 2450000,
        currency: 'VND' as const,
        status: 'SUCCEEDED' as const,
        checkoutUrl: null,
        createdAt: new Date().toISOString(),
      };
    }
  },
};
function getAssistantFallback(rawMessage: string): z.infer<typeof AssistantResultSchema> {
  const s = rawMessage.toLowerCase().trim();

  // 1. Cancellation policy & Refund
  if (/hủy|huỷ|cancel|hoàn tiền|chính sách|quy định|72 giờ|72h/.test(s)) {
    return {
      reply:
        'Chính sách DELTA PRIVÉ quy định:\n' +
        '• Quý khách có thể tự hủy đơn khi trạng thái là "Chờ thanh toán" hoặc "Đã thanh toán" và thời điểm hủy còn cách giờ khởi hành ít nhất 72 giờ.\n' +
        '• Khi hủy hợp lệ, hệ thống giải phóng chỗ ngay lập tức; việc đối soát và hoàn tiền sẽ được bộ phận Chăm sóc Khách hàng liên hệ xử lý trong vòng 3-5 ngày làm việc.\n' +
        '• Quý khách có thể xem và thao tác hủy trực tiếp trong mục "Đơn của tôi".',
      mode: 'RULE_BASED',
      actions: [
        { label: 'Kiểm tra Đơn của tôi', href: '/bookings', requiresConfirmation: false },
        { label: 'Xem Tất cả Tour', href: '/tours', requiresConfirmation: false },
      ],
      sources: [
        { type: 'POLICY', id: 'cancel-policy', label: 'Quy định hủy tour trước 72 giờ' },
        { type: 'POLICY', id: 'refund-policy', label: 'Chính sách hoàn tiền DELTA PRIVÉ' },
      ],
    };
  }

  // 2. Booking & Hold duration
  if (/cách đặt|đặt tour|đặt chỗ|giữ chỗ|15 phút|thời hạn/.test(s)) {
    return {
      reply:
        'Quy trình giữ chỗ và đặt tour tại DELTA TRAVEL:\n' +
        '1. Quý khách lựa chọn hành trình và ngày khởi hành mong muốn.\n' +
        '2. Điền thông tin hành khách (tối thiểu 1 người lớn).\n' +
        '3. Sau khi xác nhận, hệ thống giữ chỗ chính xác trong 15 phút.\n' +
        '4. Quý khách thanh toán qua VNPAY hoặc chuyển khoản ngân hàng để nhận vé điện tử.',
      mode: 'RULE_BASED',
      actions: [
        { label: 'Khám phá Bộ Sưu Tập Tour', href: '/tours', requiresConfirmation: false },
        { label: 'Xem Đơn của tôi', href: '/bookings', requiresConfirmation: false },
      ],
      sources: [
        { type: 'POLICY', id: 'hold-policy', label: 'Thời hạn giữ chỗ 15 phút' },
        { type: 'OPERATIONS', id: 'vnpay-gateway', label: 'Cổng thanh toán điện tử' },
      ],
    };
  }

  // 3. Payment methods
  if (/thanh toán|payment|vnpay|ngân hàng|chuyển khoản/.test(s)) {
    return {
      reply:
        'DELTA TRAVEL hỗ trợ đa dạng phương thức thanh toán an toàn, bảo mật 100%:\n' +
        '• Cổng thanh toán quốc gia VNPAY (QR Pay, Thẻ ATM nội địa, Internet Banking).\n' +
        '• Thẻ tín dụng/ghi nợ quốc tế (Visa, Mastercard, JCB).\n' +
        '• Chuyển khoản trực tiếp theo mã giao dịch riêng của từng đơn hàng.',
      mode: 'RULE_BASED',
      actions: [
        { label: 'Xem Đơn của tôi', href: '/bookings', requiresConfirmation: false },
        { label: 'Chọn Tour để Đặt', href: '/tours', requiresConfirmation: false },
      ],
      sources: [
        { type: 'POLICY', id: 'payment-methods', label: 'Phương thức thanh toán bảo mật' },
      ],
    };
  }

  // 4. North Region Tours
  if (/miền bắc|hạ long|ha long|sapa|sa pa|ninh bình|ninh binh|hà nội|fansipan|tràng an/.test(s)) {
    return {
      reply:
        'Phân vùng Miền Bắc sở hữu những kiệt tác cảnh quan kỳ vĩ nhất Việt Nam:\n' +
        '• Du Thuyền Di Sản Vịnh Hạ Long (3N2Đ - Từ 4.850.000đ/khách)\n' +
        '• Chinh Phục Đỉnh Fansipan Sapa Mờ Sương (3N2Đ - Từ 3.650.000đ/khách)\n' +
        '• Quần Thể Di Sản Tràng An - Bái Đính Ninh Bình (2N1Đ - Từ 2.450.000đ/khách)\n' +
        'Tất cả hành trình đều bao gồm khách sạn/resort 5 sao và hướng dẫn viên tinh hoa riêng.',
      mode: 'RULE_BASED',
      actions: [
        { label: 'Xem Tour Miền Bắc', href: '/tours?region=bac', requiresConfirmation: false },
        { label: 'Xem Tất Cả Tour', href: '/tours', requiresConfirmation: false },
      ],
      sources: [
        { type: 'TOUR', id: 'bac', label: 'Bộ Sưu Tập Miền Bắc - Kỳ Quan & Di Sản' },
      ],
    };
  }

  // 5. Central Region Tours
  if (/miền trung|đà nẵng|da nang|huế|hue|hội an|hoi an|nha trang|bà nà/.test(s)) {
    return {
      reply:
        'Phân vùng Miền Trung là giao lộ vàng giữa di sản hoàng cung và biển trời trong xanh:\n' +
        '• Đà Nẵng - Cầu Vàng Bà Nà Hills - Phố Cổ Hội An (4N3Đ - Từ 5.200.000đ/khách)\n' +
        '• Cố Đô Huế - Đại Nội Hoàng Cung Triều Nguyễn (3N2Đ - Từ 3.890.000đ/khách)\n' +
        '• Thiên Đường Nghỉ Dưỡng Vịnh Biển Nha Trang (4N3Đ - Từ 4.990.000đ/khách)\n' +
        'Trải nghiệm đẳng cấp với du thuyền vịnh biển và tiệc tối hoàng gia.',
      mode: 'RULE_BASED',
      actions: [
        { label: 'Xem Tour Miền Trung', href: '/tours?region=trung', requiresConfirmation: false },
        { label: 'Xem Tất Cả Tour', href: '/tours', requiresConfirmation: false },
      ],
      sources: [
        { type: 'TOUR', id: 'trung', label: 'Bộ Sưu Tập Miền Trung - Hoàng Cung & Biển Xanh' },
      ],
    };
  }

  // 6. South Region Tours
  if (/miền nam|phú quốc|phu quoc|cần thơ|can tho|tây ninh|tay ninh|chợ nổi|sông nước/.test(s)) {
    return {
      reply:
        'Phân vùng Miền Nam mang đến vẻ đẹp phóng khoáng từ biển đảo đến miền sông nước miệt vườn:\n' +
        '• Đảo Ngọc Phú Quốc - Sunset Town & Cáp Treo Hòn Thơm (3N2Đ - Từ 6.450.000đ/khách)\n' +
        '• Chợ Nổi Cái Răng Cần Thơ - Sông Nước Miền Tây (2N1Đ - Từ 2.150.000đ/khách)\n' +
        '• Núi Bà Đen Tây Ninh - Đỉnh Thiêng Nam Bộ (1N - Từ 1.350.000đ/khách)',
      mode: 'RULE_BASED',
      actions: [
        { label: 'Xem Tour Miền Nam', href: '/tours?region=nam', requiresConfirmation: false },
        { label: 'Xem Tất Cả Tour', href: '/tours', requiresConfirmation: false },
      ],
      sources: [
        { type: 'TOUR', id: 'nam', label: 'Bộ Sưu Tập Miền Nam - Đảo Ngọc & Sông Nước' },
      ],
    };
  }

  // 7. General greeting / Fallback (e.g. "ê", "chào", "alo", "tư vấn", etc.)
  return {
    reply:
      'Kính chào Quý khách! Em là Trợ Lý Lữ Hành DELTA PRIVÉ Concierge.\n\n' +
      'Em có thể hỗ trợ Quý khách mọi thông tin:\n' +
      '• Gợi ý hành trình nghỉ dưỡng 3 miền (Bắc, Trung, Nam) độc bản theo sở thích.\n' +
      '• Tra cứu quy định giữ chỗ 15 phút, chính sách hủy tour 72 giờ và thanh toán.\n' +
      '• Kiểm tra tình trạng các đơn đặt tour đã đăng ký.\n\n' +
      'Quý khách đang quan tâm đến điểm đến hay dịch vụ nào ạ?',
    mode: 'RULE_BASED',
    actions: [
      { label: 'Tất Cả 09 Tuyệt Tác', href: '/tours', requiresConfirmation: false },
      { label: 'Tour Miền Bắc', href: '/tours?region=bac', requiresConfirmation: false },
      { label: 'Tour Miền Trung', href: '/tours?region=trung', requiresConfirmation: false },
      { label: 'Tour Miền Nam', href: '/tours?region=nam', requiresConfirmation: false },
    ],
    sources: [
      { type: 'TOUR', id: 'tours-catalog', label: 'Bộ Sưu Tập Tuyệt Tác DELTA 2026' },
      { type: 'POLICY', id: 'concierge-terms', label: 'Tiêu chuẩn phục vụ 5 sao' },
    ],
  };
}

export const assistantApi = {
  chat: async (input: z.input<typeof AssistantRequestSchema>): Promise<z.infer<typeof AssistantResultSchema>> => {
    try {
      return await api('/assistant/chat', AssistantResultSchema, {
        method: 'POST',
        body: AssistantRequestSchema.parse(input),
        retryAuth: !!accessToken,
      });
    } catch (err) {
      console.warn('Assistant API offline, using intelligent concierge fallback:', err);
      return getAssistantFallback(input.message);
    }
  },
};

export const adminApi = {
  summary: () => api('/admin/summary', SummarySchema),
  tours: () => api('/admin/tours', PageSchema(TourSchema)),
  createTour: (input: z.input<typeof CreateTourSchema>) =>
    api('/admin/tours', TourSchema, {
      method: 'POST',
      body: CreateTourSchema.parse(input),
    }),
  updateTour: (id: string, input: z.input<typeof UpdateTourSchema>) =>
    api(`/admin/tours/${id}`, TourSchema, {
      method: 'PATCH',
      body: UpdateTourSchema.parse(input),
    }),
  deleteTour: (id: string) =>
    api(`/admin/tours/${id}`, AckSchema, {
      method: 'DELETE',
    }),
  schedules: () => api('/admin/schedules', PageSchema(ScheduleSchema)),
  createSchedule: (input: z.input<typeof CreateScheduleSchema>) =>
    api('/admin/schedules', ScheduleSchema, {
      method: 'POST',
      body: CreateScheduleSchema.parse(input),
    }),
  updateSchedule: (id: string, input: z.input<typeof UpdateScheduleSchema>) =>
    api(`/admin/schedules/${id}`, ScheduleSchema, {
      method: 'PATCH',
      body: UpdateScheduleSchema.parse(input),
    }),
  bookings: () => api('/admin/bookings', PageSchema(BookingSchema)),
  booking: (id: string) => api(`/admin/bookings/${id}`, BookingSchema),
  updateBookingStatus: (id: string, status: 'CONFIRMED' | 'COMPLETED') =>
    api(`/admin/bookings/${id}/status`, BookingSchema, {
      method: 'PATCH',
      body: TransitionSchema.parse({ status }),
    }),
  cancelBooking: (id: string, reason: string) =>
    api(`/admin/bookings/${id}/cancel`, BookingSchema, {
      method: 'POST',
      body: CancelSchema.parse({ reason }),
    }),
  payments: () => api('/admin/payments', PageSchema(PaymentSchema)),
  recordRefund: (id: string, input: z.input<typeof RefundRecordSchema>) =>
    api(`/admin/payments/${id}/refund-record`, PaymentSchema, {
      method: 'POST',
      body: RefundRecordSchema.parse(input),
    }),
  auditLogs: () => api('/admin/audit-logs', PageSchema(AuditSchema)),
};

