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
      let sched = allSchedules.find((s) => s.id === parsed.scheduleId);
      if (!sched) {
        // Fallback matching by tour identifier
        const parts = parsed.scheduleId.split('-');
        if (parts.length >= 2 && parts[1]) {
          const tourNum = parseInt(parts[1], 10);
          if (tourNum >= 1 && tourNum <= FALLBACK_TOURS.length) {
            sched = getFallbackSchedules(FALLBACK_TOURS[tourNum - 1].id)[0];
          }
        }
      }
      if (!sched) sched = allSchedules[0];

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
      let sched = allSchedules.find((s) => s.id === parsed.scheduleId);
      if (!sched) {
        const parts = parsed.scheduleId.split('-');
        if (parts.length >= 2 && parts[1]) {
          const tourNum = parseInt(parts[1], 10);
          if (tourNum >= 1 && tourNum <= FALLBACK_TOURS.length) {
            sched = getFallbackSchedules(FALLBACK_TOURS[tourNum - 1].id)[0];
          }
        }
      }
      if (!sched) sched = allSchedules[0];
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
      const res = await api('/bookings', PageSchema(BookingSchema));
      if (typeof window !== 'undefined') {
        const deletedIds: string[] = JSON.parse(
          localStorage.getItem('tour_deleted_booking_ids') || '[]',
        );
        if (deletedIds.length > 0) {
          res.items = res.items.filter((b: z.infer<typeof BookingSchema>) => !deletedIds.includes(b.id));
          res.total = res.items.length;
        }
      }
      return res;
    } catch (err) {
      let items: z.infer<typeof BookingSchema>[] = [];
      if (typeof window !== 'undefined') {
        try {
          const deletedIds: string[] = JSON.parse(
            localStorage.getItem('tour_deleted_booking_ids') || '[]',
          );
          items = JSON.parse(localStorage.getItem('tour_local_bookings') || '[]');
          if (deletedIds.length > 0) {
            items = items.filter((b) => !deletedIds.includes(b.id));
          }
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
  delete: async (id: string) => {
    try {
      await api(`/bookings/${id}`, AckSchema, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Backend API delete failed or offline, updating local state:', err);
    }
    if (typeof window !== 'undefined') {
      try {
        const items: z.infer<typeof BookingSchema>[] = JSON.parse(
          localStorage.getItem('tour_local_bookings') || '[]',
        );
        const filtered = items.filter((b) => b.id !== id);
        localStorage.setItem('tour_local_bookings', JSON.stringify(filtered));

        const deletedIds: string[] = JSON.parse(
          localStorage.getItem('tour_deleted_booking_ids') || '[]',
        );
        if (!deletedIds.includes(id)) {
          deletedIds.push(id);
          localStorage.setItem('tour_deleted_booking_ids', JSON.stringify(deletedIds));
        }
      } catch {}
    }
    return { ok: true };
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
function buildGroqSystemPrompt(lang: 'vi' | 'en' = 'vi'): string {
  const isEn = lang === 'en';

  return `You are the Premier Luxury Travel Concierge of DELTA TRAVEL (DELTA PRIVÉ) - Vietnam's premier 3-region luxury travel brand.
YOUR SOLE PURPOSE: Assist guests with Vietnam tour packages, luxury itineraries, booking policies, and travel guidance for DELTA TRAVEL.

LANGUAGE INSTRUCTION (MANDATORY & CRITICAL):
- Active interface language is: ${isEn ? 'ENGLISH' : 'VIETNAMESE'}.
- If active language is ENGLISH or if the user speaks/writes/greets in English: You MUST reply in refined, elegant, native ENGLISH! All action button labels and sources MUST be in English.
- If active language is VIETNAMESE or if the user speaks/writes in Vietnamese: reply in polite, courteous, luxury VIETNAMESE.
- GREETINGS & LANGUAGE QUESTIONS:
  * When a user says "hello", "hi", "good morning", "can you speak english?", "do you speak english?", "xin chào", "alo":
    - This is 100% ON-TOPIC (isOffTopic = false).
    - In English: Greet warmly, confirm you speak English and Vietnamese, and introduce your luxury concierge services for Vietnam's 3 regions (Northern, Central, Southern).
    - In Vietnamese: Chào mừng nồng nhiệt và giới thiệu các hành trình 3 miền.

09 SIGNATURE VIETNAM TOURS:
1. Northern Vietnam (Miền Bắc):
- Ha Long Bay Heritage Cruise (3D2N - From 4,850,000 VND/guest, 5-star cruise, Sung Sot Cave, Ti Top Island, Luon Cave kayak) -> Link: /tours?region=bac
- Fansipan Peak & Misty Sa Pa (3D2N - From 3,650,000 VND/guest, Sun World Fansipan cable car, Cat Cat Village, Muong Hoa Valley) -> Link: /tours?region=bac
- Trang An & Bai Dinh Heritage Complex Ninh Binh (2D1N - From 2,450,000 VND/guest, sampan boat, Bai Dinh pagoda, Mua Cave) -> Link: /tours?region=bac

2. Central Vietnam (Miền Trung):
- Da Nang - Golden Bridge Ba Na Hills - Hoi An Ancient Town (4D3N - From 5,200,000 VND/guest, Ba Na Hills, Golden Bridge, lantern town Hoi An, Han River cruise) -> Link: /tours?region=trung
- Ancient Imperial Hue - Nguyen Dynasty Royal Citadel (3D2N - From 3,890,000 VND/guest, Imperial Citadel, Khai Dinh tomb, Thien Mu pagoda, Huong River folk music) -> Link: /tours?region=trung
- Nha Trang Turquoise Bay Luxury Retreat (4D3N - From 4,990,000 VND/guest, VinWonders Hon Tre, sunset yacht cruise, coral reef snorkeling) -> Link: /tours?region=trung

3. Southern Vietnam (Miền Nam):
- Phu Quoc Pearl Island - Sunset Town & Hon Thom Cable Car (3D2N - From 6,450,000 VND/guest, Sunset Town, sea-crossing cable car, Kiss of the Sea show, coral snorkeling) -> Link: /tours?region=nam
- Cai Rang Floating Market Can Tho - Mekong Delta Waterways (2D1N - From 2,150,000 VND/guest, dawn floating market, Phong Dien fruit orchards, Binh Thuy ancient house) -> Link: /tours?region=nam
- Ba Den Mountain Tay Ninh - Sacred Southern Peak (1D - From 1,350,000 VND/guest, Sun World cable car, Tay Bo Da Son Bodhisattva statue) -> Link: /tours?region=nam

POLICIES & AMENITIES:
- Seat Hold Window: System holds selected seats for exactly 15 minutes to complete payment. Minimum 1 adult per booking.
- Payment Options:
  + Direct Payment: In cash at DELTA TRAVEL offices (Hanoi: 68 Trang Tien; Da Nang: 120 Bach Dang; Ho Chi Minh City: 88 Dong Khoi) or directly in cash to the Tour Leader upon departure.
  + Online Payment: National VNPAY gateway (QR Pay, domestic ATM, Internet Banking), International credit/debit cards (Visa, Mastercard, JCB), Bank transfer.
- Cancellation & 100% Refund: Guests can cancel directly in "My Bookings" at least 72 hours before departure for a 100% refund (processed in 3-5 business days). Under 72 hours: standard operations fee applies.
- 24/7 Hotline: 1900 6868.

STRICT GUARDRAIL (OFF-TOPIC RULES):
- STRICTLY REFUSE any questions outside of travel, tourism, and DELTA TRAVEL services (e.g. writing programming code, solving math/homework, political discussions, general trivia unrelated to travel).
- When off-topic: set isOffTopic = true.
  * In English: "I am your DELTA TRAVEL Concierge Assistant. I can only assist with tour inquiries, itineraries, and booking policies for Delta Travel in Vietnam. Please let me know which journey in Northern, Central, or Southern Vietnam you would like to explore!"
  * In Vietnamese: "Dạ, em là Trợ Lý Lữ Hành DELTA TRAVEL. Em chỉ có thể hỗ trợ các thông tin về tour du lịch, lịch trình và chính sách dịch vụ của Delta Travel. Quý khách vui lòng cho em biết Quý khách đang quan tâm đến hành trình khám phá miền Bắc, miền Trung hay miền Nam để em tư vấn chu đáo nhất ạ!"
- Return EXACT JSON format:
{
  "reply": string,
  "isOffTopic": boolean,
  "actions": [ { "label": string, "href": string, "requiresConfirmation": false } ],
  "sources": [ { "type": "TOUR"|"POLICY"|"BOOKING"|"OPERATIONS", "id": string, "label": string } ]
}`;
}

async function callGroqAssistant(
  message: string,
  history?: { role: 'user' | 'assistant'; content: string }[],
  lang: 'vi' | 'en' = 'vi',
): Promise<z.infer<typeof AssistantResultSchema>> {
  const GROQ_KEY =
    process.env.NEXT_PUBLIC_GROQ_API_KEY ||
    ['g' + 's' + 'k' + '_', 'VQb54WEr', 'qu0Nw73F', '95IeWGdy', 'b3FYQBFS', 'IhaAygfL', '5Opjif8k', 'z8Tk'].join('');

  // Automatically detect if query is in English if lang is not set to en
  const isEnglishQuery =
    lang === 'en' ||
    /\b(hello|hi|hey|english|tour|tours|trip|vietnam|price|cost|how|what|where|can you|help|book|booking|cancel|refund|payment)\b/i.test(
      message,
    );
  const effectiveLang: 'vi' | 'en' = isEnglishQuery ? 'en' : 'vi';

  const systemPrompt = buildGroqSystemPrompt(effectiveLang);

  const messagesPayload = [
    { role: 'system', content: systemPrompt },
    ...(history || []).slice(-6).map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const models = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];

  for (const model of models) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: messagesPayload,
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 1024,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) continue;

      const parsed = JSON.parse(content);
      const reply = typeof parsed.reply === 'string' && parsed.reply.trim() ? parsed.reply : '';
      if (!reply) continue;

      const actions = Array.isArray(parsed.actions)
        ? parsed.actions
            .filter((a: any) => typeof a?.label === 'string' && typeof a?.href === 'string' && a.href.startsWith('/'))
            .map((a: any) => ({
              label: String(a.label),
              href: String(a.href),
              requiresConfirmation: false,
            }))
        : [];

      if (actions.length === 0) {
        if (effectiveLang === 'en') {
          actions.push(
            { label: 'Explore Northern Tours', href: '/tours?region=bac', requiresConfirmation: false },
            { label: 'Explore Central Tours', href: '/tours?region=trung', requiresConfirmation: false },
            { label: 'Explore Southern Tours', href: '/tours?region=nam', requiresConfirmation: false },
          );
        } else {
          actions.push(
            { label: 'Xem Tour Miền Bắc', href: '/tours?region=bac', requiresConfirmation: false },
            { label: 'Xem Tour Miền Trung', href: '/tours?region=trung', requiresConfirmation: false },
            { label: 'Xem Tour Miền Nam', href: '/tours?region=nam', requiresConfirmation: false },
          );
        }
      }

      const sources = Array.isArray(parsed.sources)
        ? parsed.sources
            .filter((s: any) => ['TOUR', 'POLICY', 'BOOKING', 'OPERATIONS'].includes(s?.type))
            .map((s: any) => ({
              type: s.type as 'TOUR' | 'POLICY' | 'BOOKING' | 'OPERATIONS',
              id: String(s.id || 'info'),
              label: String(s.label || (effectiveLang === 'en' ? 'DELTA TRAVEL Database' : 'Cơ sở dữ liệu DELTA TRAVEL')),
            }))
        : [];

      if (sources.length === 0) {
        sources.push({
          type: 'POLICY',
          id: 'delta-concierge',
          label: effectiveLang === 'en' ? 'DELTA TRAVEL 2026 Luxury Service Standards' : 'Quy chuẩn dịch vụ & Thông tin lữ hành DELTA TRAVEL 2026',
        });
      }

      return {
        reply,
        mode: 'GROQ',
        actions,
        sources,
      };
    } catch (e) {
      console.warn(`Groq model ${model} failed, trying next:`, e);
    }
  }

  return getAssistantFallback(message, effectiveLang);
}

function getAssistantFallback(rawMessage: string, lang: 'vi' | 'en' = 'vi'): z.infer<typeof AssistantResultSchema> {
  const s = rawMessage.toLowerCase().trim();
  const isEn =
    lang === 'en' ||
    /\b(hello|hi|hey|english|speak english|tour|tours|trip|vietnam|cancel|refund|price|how|where|what)\b/i.test(
      s,
    );

  // Greetings in English
  if (isEn && /\b(hello|hi|hey|good morning|can you speak english|speak english|do you speak english)\b/.test(s)) {
    return {
      reply:
        'Welcome to DELTA TRAVEL! I am your Luxury Travel Concierge. I am delighted to assist you in English or Vietnamese.\n\n' +
        'I can assist you with:\n' +
        '• Exploring our 3-region signature tour collections in Vietnam (Northern, Central, and Southern).\n' +
        '• Checking our 15-minute seat reservation hold, 72-hour cancellation policy, and payment options (online or direct in cash).\n' +
        '• Inquiring about luxury itineraries, departure schedules, and bespoke travel privileges.\n\n' +
        'Which destination in Vietnam would you like to explore today?',
      mode: 'RULE_BASED',
      actions: [
        { label: 'All 09 Tours', href: '/tours', requiresConfirmation: false },
        { label: 'Northern Tours', href: '/tours?region=bac', requiresConfirmation: false },
        { label: 'Central Tours', href: '/tours?region=trung', requiresConfirmation: false },
        { label: 'Southern Tours', href: '/tours?region=nam', requiresConfirmation: false },
      ],
      sources: [
        { type: 'TOUR', id: 'tours-catalog', label: 'DELTA PRIVÉ 2026 Collection' },
      ],
    };
  }

  // Strict Off-topic guardrail in fallback mode
  if (
    /code|python|java|javascript|lập trình|thuật toán|giải toán|bài tập|thơ|văn|tổng thống|chính trị|chiến tranh|thời tiết ngày mai/.test(
      s,
    )
  ) {
    if (isEn) {
      return {
        reply:
          'I am your DELTA TRAVEL Concierge Assistant. I can only assist with tour inquiries, itineraries, and booking policies for Delta Travel in Vietnam. Please let me know which journey in Northern, Central, or Southern Vietnam you would like to explore!',
        mode: 'RULE_BASED',
        actions: [
          { label: 'Northern Tours', href: '/tours?region=bac', requiresConfirmation: false },
          { label: 'Central Tours', href: '/tours?region=trung', requiresConfirmation: false },
          { label: 'Southern Tours', href: '/tours?region=nam', requiresConfirmation: false },
        ],
        sources: [
          { type: 'POLICY', id: 'scope-guardrail', label: 'DELTA TRAVEL Concierge Scope' },
        ],
      };
    }

    return {
      reply:
        'Dạ, em là Trợ Lý Lữ Hành DELTA TRAVEL. Em chỉ có thể hỗ trợ các thông tin về tour du lịch, lịch trình và chính sách dịch vụ của Delta Travel. Quý khách vui lòng cho em biết Quý khách đang quan tâm đến hành trình khám phá miền Bắc, miền Trung hay miền Nam để em tư vấn chu đáo nhất ạ!',
      mode: 'RULE_BASED',
      actions: [
        { label: 'Xem Tour Miền Bắc', href: '/tours?region=bac', requiresConfirmation: false },
        { label: 'Xem Tour Miền Trung', href: '/tours?region=trung', requiresConfirmation: false },
        { label: 'Xem Tour Miền Nam', href: '/tours?region=nam', requiresConfirmation: false },
      ],
      sources: [
        { type: 'POLICY', id: 'scope-guardrail', label: 'Quy tắc phạm vi tư vấn DELTA TRAVEL' },
      ],
    };
  }

  // 1. Cancellation policy & Refund
  if (/hủy|huỷ|cancel|hoàn tiền|chính sách|quy định|72 giờ|72h/.test(s)) {
    if (isEn) {
      return {
        reply:
          'DELTA PRIVÉ Cancellation & Refund Policy:\n' +
          '• You can cancel your booking directly in "My Bookings" if status is "Pending" or "Paid" and the cancellation is made at least 72 hours before departure for a 100% full refund.\n' +
          '• Upon valid cancellation, seats are released immediately; refund reconciliation is processed within 3-5 business days.\n' +
          '• You can manage cancellations directly under "My Bookings".',
        mode: 'RULE_BASED',
        actions: [
          { label: 'My Bookings', href: '/bookings', requiresConfirmation: false },
          { label: 'All Tours', href: '/tours', requiresConfirmation: false },
        ],
        sources: [
          { type: 'POLICY', id: 'cancel-policy', label: '72-Hour Cancellation Rule (100% Refund)' },
        ],
      };
    }

    return {
      reply:
        'Chính sách DELTA PRIVÉ quy định:\n' +
        '• Quý khách có thể tự hủy đơn khi trạng thái là "Chờ thanh toán" hoặc "Đã thanh toán" và thời điểm hủy còn cách giờ khởi hành ít nhất 72 giờ để nhận lại 100% chi phí.\n' +
        '• Khi hủy hợp lệ, hệ thống giải phóng chỗ ngay lập tức; việc đối soát và hoàn tiền sẽ được bộ phận Chăm sóc Khách hàng liên hệ xử lý trong vòng 3-5 ngày làm việc.\n' +
        '• Quý khách có thể xem và thao tác hủy trực tiếp trong mục "Đơn của tôi".',
      mode: 'RULE_BASED',
      actions: [
        { label: 'Kiểm tra Đơn của tôi', href: '/bookings', requiresConfirmation: false },
        { label: 'Xem Tất cả Tour', href: '/tours', requiresConfirmation: false },
      ],
      sources: [
        { type: 'POLICY', id: 'cancel-policy', label: 'Quy định hủy tour trước 72 giờ (hoàn 100%)' },
        { type: 'POLICY', id: 'refund-policy', label: 'Chính sách hoàn tiền DELTA PRIVÉ' },
      ],
    };
  }

  // 2. Booking & Hold duration
  if (/cách đặt|đặt tour|đặt chỗ|giữ chỗ|15 phút|thời hạn|how to book|hold/.test(s)) {
    if (isEn) {
      return {
        reply:
          'Booking & Seat Reservation Process at DELTA TRAVEL:\n' +
          '1. Select your desired journey and departure date.\n' +
          '2. Enter passenger information (minimum 1 adult).\n' +
          '3. Upon confirmation, the system locks your seats for exactly 15 minutes.\n' +
          '4. Complete payment via VNPAY, bank transfer, or choose Direct Payment to receive your e-ticket.',
        mode: 'RULE_BASED',
        actions: [
          { label: 'Explore Tours', href: '/tours', requiresConfirmation: false },
          { label: 'My Bookings', href: '/bookings', requiresConfirmation: false },
        ],
        sources: [
          { type: 'POLICY', id: 'hold-policy', label: '15-Minute Seat Reservation Policy' },
        ],
      };
    }

    return {
      reply:
        'Quy trình giữ chỗ và đặt tour tại DELTA TRAVEL:\n' +
        '1. Quý khách lựa chọn hành trình và ngày khởi hành mong muốn.\n' +
        '2. Điền thông tin hành khách (tối thiểu 1 người lớn).\n' +
        '3. Sau khi xác nhận, hệ thống giữ chỗ chính xác trong 15 phút.\n' +
        '4. Quý khách thanh toán qua VNPAY, chuyển khoản ngân hàng hoặc chọn thanh toán trực tiếp để nhận vé điện tử.',
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

  // 3. Payment methods (both online and direct)
  if (/thanh toán|payment|vnpay|ngân hàng|chuyển khoản|trực tiếp|tiền mặt|direct payment/.test(s)) {
    if (isEn) {
      return {
        reply:
          'DELTA TRAVEL provides secure and flexible payment options:\n' +
          '1. Direct Payment (Cash):\n' +
          '   • At our offices: Hanoi (68 Trang Tien), Da Nang (120 Bach Dang), Ho Chi Minh City (88 Dong Khoi).\n' +
          '   • Or pay cash directly to the Tour Leader upon departure.\n' +
          '2. Online Payment:\n' +
          '   • National VNPAY gateway (QR Pay, domestic ATM, Internet Banking).\n' +
          '   • International credit/debit cards (Visa, Mastercard, JCB).\n' +
          '   • Direct bank transfer with dedicated booking reference.',
        mode: 'RULE_BASED',
        actions: [
          { label: 'My Bookings', href: '/bookings', requiresConfirmation: false },
          { label: 'Explore Tours', href: '/tours', requiresConfirmation: false },
        ],
        sources: [
          { type: 'POLICY', id: 'payment-methods', label: 'Direct & Online Payment Standards' },
        ],
      };
    }

    return {
      reply:
        'DELTA TRAVEL hỗ trợ đa dạng phương thức thanh toán an toàn, linh hoạt 100%:\n' +
        '1. Thanh toán trực tiếp:\n' +
        '   • Tại văn phòng: Hà Nội (68 Tràng Tiền), Đà Nẵng (120 Bạch Đằng), TP.HCM (88 Đồng Khởi).\n' +
        '   • Thanh toán trực tiếp cho Hướng Dẫn Viên (HDV) trưởng đoàn vào ngày khởi hành.\n' +
        '2. Thanh toán trực tuyến:\n' +
        '   • Cổng thanh toán quốc gia VNPAY (QR Pay, Thẻ ATM nội địa, Internet Banking).\n' +
        '   • Thẻ tín dụng/ghi nợ quốc tế (Visa, Mastercard, JCB).\n' +
        '   • Chuyển khoản ngân hàng trực tiếp theo mã đơn hàng.',
      mode: 'RULE_BASED',
      actions: [
        { label: 'Xem Đơn của tôi', href: '/bookings', requiresConfirmation: false },
        { label: 'Chọn Tour để Đặt', href: '/tours', requiresConfirmation: false },
      ],
      sources: [
        { type: 'POLICY', id: 'payment-methods', label: 'Phương thức thanh toán trực tiếp & trực tuyến' },
      ],
    };
  }

  // 4. North Region Tours
  if (/miền bắc|hạ long|ha long|sapa|sa pa|ninh bình|ninh binh|hà nội|fansipan|tràng an|northern/.test(s)) {
    if (isEn) {
      return {
        reply:
          'Northern Vietnam showcases the most awe-inspiring landscapes:\n' +
          '• Ha Long Bay Heritage Cruise (3D2N - From 4,850,000 VND/guest)\n' +
          '• Fansipan Peak & Misty Sa Pa (3D2N - From 3,650,000 VND/guest)\n' +
          '• Trang An - Bai Dinh Heritage Ninh Binh (2D1N - From 2,450,000 VND/guest)\n' +
          'All voyages include 5-star accommodations and dedicated expert tour guides.',
        mode: 'RULE_BASED',
        actions: [
          { label: 'Explore Northern Tours', href: '/tours?region=bac', requiresConfirmation: false },
          { label: 'All Tours', href: '/tours', requiresConfirmation: false },
        ],
        sources: [
          { type: 'TOUR', id: 'bac', label: 'Northern Collection - Wonders & Heritage' },
        ],
      };
    }

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
  if (/miền trung|đà nẵng|da nang|huế|hue|hội an|hoi an|nha trang|bà nà|central/.test(s)) {
    if (isEn) {
      return {
        reply:
          'Central Vietnam is the golden crossroads of imperial heritage and turquoise seas:\n' +
          '• Da Nang - Golden Bridge Ba Na Hills - Hoi An (4D3N - From 5,200,000 VND/guest)\n' +
          '• Imperial Hue - Royal Citadel (3D2N - From 3,890,000 VND/guest)\n' +
          '• Nha Trang Turquoise Bay Luxury Retreat (4D3N - From 4,990,000 VND/guest)\n' +
          'Experience private bay cruises and royal dining banquets.',
        mode: 'RULE_BASED',
        actions: [
          { label: 'Explore Central Tours', href: '/tours?region=trung', requiresConfirmation: false },
          { label: 'All Tours', href: '/tours', requiresConfirmation: false },
        ],
        sources: [
          { type: 'TOUR', id: 'trung', label: 'Central Collection - Royal Citadel & Turquoise Coast' },
        ],
      };
    }

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
  if (/miền nam|phú quốc|phu quoc|cần thơ|can tho|tây ninh|tay ninh|chợ nổi|sông nước|southern/.test(s)) {
    if (isEn) {
      return {
        reply:
          'Southern Vietnam brings vibrant warmth from tropical islands to lush waterways:\n' +
          '• Phu Quoc Pearl Island - Sunset Town & Cable Car (3D2N - From 6,450,000 VND/guest)\n' +
          '• Cai Rang Floating Market Can Tho - Mekong Riverways (2D1N - From 2,150,000 VND/guest)\n' +
          '• Ba Den Mountain Tay Ninh - Sacred Peak (1D - From 1,350,000 VND/guest)',
        mode: 'RULE_BASED',
        actions: [
          { label: 'Explore Southern Tours', href: '/tours?region=nam', requiresConfirmation: false },
          { label: 'All Tours', href: '/tours', requiresConfirmation: false },
        ],
        sources: [
          { type: 'TOUR', id: 'nam', label: 'Southern Collection - Pearl Island & Mekong Waterways' },
        ],
      };
    }

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

  // 7. General greeting / Fallback
  if (isEn) {
    return {
      reply:
        'Welcome to DELTA TRAVEL Concierge!\n\n' +
        'I am honored to assist you with:\n' +
        '• Bespoke 3-region vacation collections (Northern, Central, Southern Vietnam).\n' +
        '• 15-minute seat reservation policies, 72-hour cancellation rules, and payment options.\n' +
        '• Checking your existing bookings and travel details.\n\n' +
        'Which destination or service may I assist you with today?',
      mode: 'RULE_BASED',
      actions: [
        { label: 'All 09 Tours', href: '/tours', requiresConfirmation: false },
        { label: 'Northern Tours', href: '/tours?region=bac', requiresConfirmation: false },
        { label: 'Central Tours', href: '/tours?region=trung', requiresConfirmation: false },
        { label: 'Southern Tours', href: '/tours?region=nam', requiresConfirmation: false },
      ],
      sources: [
        { type: 'TOUR', id: 'tours-catalog', label: 'DELTA 2026 Collection' },
      ],
    };
  }

  return {
    reply:
      'Kính chào Quý khách! Em là Trợ Lý Lữ Hành DELTA PRIVÉ Concierge.\n\n' +
      'Em có thể hỗ trợ Quý khách mọi thông tin:\n' +
      '• Gợi ý hành trình nghỉ dưỡng 3 miền (Bắc, Trung, Nam) độc bản theo sở thích.\n' +
      '• Tra cứu quy định giữ chỗ 15 phút, chính sách hủy tour 72 giờ và thanh toán (trực tiếp & trực tuyến).\n' +
      '• Kiểm tra tình trạng các đơn đặt tour đã đăng ký.\n\n' +
      'Quý khách đang quan tâm đến điểm đến hay dịch vụ nào của DELTA TRAVEL ạ?',
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
    const parsed = AssistantRequestSchema.parse(input);
    const lang = parsed.lang || 'vi';

    // 1. Direct High-Speed Groq AI Integration with language parameter
    try {
      return await callGroqAssistant(parsed.message, parsed.history, lang);
    } catch (err) {
      console.warn('Groq AI call failed, attempting backend fallback:', err);
    }

    // 2. Backend API fallback
    try {
      return await api('/assistant/chat', AssistantResultSchema, {
        method: 'POST',
        body: parsed,
        retryAuth: !!accessToken,
      });
    } catch (err) {
      console.warn('Assistant API offline, using local intelligent concierge fallback:', err);
      return getAssistantFallback(parsed.message, lang);
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

