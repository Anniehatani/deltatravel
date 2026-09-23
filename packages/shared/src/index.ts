import { z } from 'zod';

export const HOLD_MS = 15 * 60 * 1000;
export const CANCEL_WINDOW_MS = 72 * 60 * 60 * 1000;
export const RoleSchema = z.enum(['CUSTOMER', 'OPERATIONS', 'ADMIN']);
export const BookingStatusSchema = z.enum([
  'PENDING_PAYMENT',
  'PAID',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
]);
export const TourStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']);
export const ScheduleStatusSchema = z.enum(['OPEN', 'CLOSED']);
export const ProviderSchema = z.enum(['VNPAY', 'MOMO', 'ZALOPAY']);
export const PaymentStatusSchema = z.enum([
  'INITIATED',
  'SUCCEEDED',
  'FAILED',
  'REFUND_REQUIRED',
  'REFUNDED',
]);
export type Role = z.infer<typeof RoleSchema>;
export type BookingStatus = z.infer<typeof BookingStatusSchema>;
export type Provider = z.infer<typeof ProviderSchema>;
export const BOOKING_LABELS: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'CHỜ THANH TOÁN',
  PAID: 'ĐÃ THANH TOÁN',
  CONFIRMED: 'ĐÃ XÁC NHẬN',
  COMPLETED: 'HOÀN THÀNH',
  CANCELLED: 'ĐÃ HỦY',
};
export const IdSchema = z.string().uuid();
export const MoneySchema = z.number().int().min(0).max(9_999_999_999);
export const IsoDateSchema = z.string().datetime({ offset: true });
const name = z.string().trim().min(2).max(100);
const email = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((v) => v.toLowerCase());
export const RegisterSchema = z
  .object({ name, email, password: z.string().min(6).max(128) })
  .strict();
export const LoginSchema = z.object({ email, password: z.string().min(1).max(128) }).strict();
export const EmptySchema = z.object({}).strict();
export const PaginationSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export const TourQuerySchema = PaginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  destination: z.string().trim().max(100).optional(),
});
export const CreateTourSchema = z
  .object({
    title: z.string().trim().min(3).max(150),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(150),
    description: z.string().trim().min(10).max(10000),
    destination: z.string().trim().min(2).max(100),
    countryCode: z.literal('VN').default('VN'),
    durationDays: z.number().int().min(1).max(60),
    status: TourStatusSchema.default('DRAFT'),
  })
  .strict();
export const UpdateTourSchema = CreateTourSchema.partial().strict();
export const CreateScheduleSchema = z
  .object({
    tourId: IdSchema,
    departureAt: IsoDateSchema,
    totalSeats: z.number().int().min(1).max(10000),
    adultPrice: MoneySchema.max(99_999_999),
    childPrice: MoneySchema.max(99_999_999),
    status: ScheduleStatusSchema.default('OPEN'),
  })
  .strict();
export const UpdateScheduleSchema = CreateScheduleSchema.omit({ tourId: true, departureAt: true })
  .partial()
  .strict();
export const PartySchema = z
  .object({ adults: z.number().int().min(1).max(100), children: z.number().int().min(0).max(100) })
  .strict();
export const QuoteSchema = PartySchema.extend({ scheduleId: IdSchema }).strict();
export const CreateBookingSchema = QuoteSchema.extend({
  contactName: name,
  contactEmail: email,
  contactPhone: z.string().regex(/^(?:\+84|0)[0-9]{9,10}$/),
}).strict();
export const CancelSchema = z.object({ reason: z.string().trim().min(3).max(500) }).strict();
export const TransitionSchema = z.object({ status: z.enum(['CONFIRMED', 'COMPLETED']) }).strict();
export const CreatePaymentSchema = z
  .object({ bookingId: IdSchema, provider: ProviderSchema })
  .strict();
export const RefundRecordSchema = z
  .object({ reference: z.string().trim().min(3).max(100), note: z.string().trim().min(3).max(500) })
  .strict();
export const IdempotencyKeySchema = z.string().uuid();
export const AssistantRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(2000),
    history: z
      .array(
        z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(2000) }).strict(),
      )
      .max(8)
      .default([]),
    lang: z.enum(['vi', 'en']).optional(),
  })
  .strict();

// Public DTOs never expose database entities, credential hashes or provider secrets.
export const UserSchema = z.object({
  id: IdSchema,
  name: z.string(),
  email: z.string().email(),
  role: RoleSchema,
});
export const AuthResultSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.literal(900),
  user: UserSchema,
});
export const TourSchema = CreateTourSchema.extend({
  id: IdSchema,
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
});
export const ScheduleSchema = CreateScheduleSchema.extend({
  id: IdSchema,
  reservedSeats: z.number().int(),
  availableSeats: z.number().int(),
  serverTime: IsoDateSchema,
});
export const BookingDetailSchema = z.object({
  kind: z.enum(['ADULT', 'CHILD']),
  quantity: z.number().int().positive(),
  unitPrice: MoneySchema,
  lineTotal: MoneySchema,
});
export const BookingSchema = z.object({
  id: IdSchema,
  scheduleId: IdSchema,
  status: BookingStatusSchema,
  adults: z.number().int(),
  children: z.number().int(),
  totalAmount: MoneySchema,
  currency: z.literal('VND'),
  contactName: z.string(),
  contactEmail: z.string(),
  contactPhone: z.string(),
  expiresAt: IsoDateSchema,
  createdAt: IsoDateSchema,
  paidAt: IsoDateSchema.nullable(),
  cancelledAt: IsoDateSchema.nullable(),
  cancelReason: z.string().nullable(),
  tourTitle: z.string(),
  departureAt: IsoDateSchema,
  details: z.array(BookingDetailSchema),
  serverTime: IsoDateSchema,
});
export const QuoteResultSchema = z.object({
  scheduleId: IdSchema,
  adults: z.number().int(),
  children: z.number().int(),
  adultPrice: MoneySchema,
  childPrice: MoneySchema,
  totalAmount: MoneySchema,
  currency: z.literal('VND'),
  availableSeats: z.number().int(),
  serverTime: IsoDateSchema,
});
export const PaymentSchema = z.object({
  id: IdSchema,
  bookingId: IdSchema,
  provider: ProviderSchema,
  status: PaymentStatusSchema,
  amount: MoneySchema,
  currency: z.literal('VND'),
  checkoutUrl: z.string().url().nullable(),
  createdAt: IsoDateSchema,
});
export const AssistantResultSchema = z.object({
  reply: z.string(),
  mode: z.enum(['GEMINI', 'RULE_BASED', 'GROQ']),
  actions: z.array(
    z.object({
      label: z.string(),
      href: z.string().startsWith('/'),
      requiresConfirmation: z.boolean(),
    }),
  ),
  sources: z.array(
    z.object({
      type: z.enum(['TOUR', 'POLICY', 'BOOKING', 'OPERATIONS']),
      id: z.string(),
      label: z.string(),
    }),
  ),
});
export const SummarySchema = z.object({
  tours: z.number().int(),
  bookings: z.number().int(),
  pendingRefunds: z.number().int(),
});
export const AuditSchema = z.object({
  id: IdSchema,
  actorId: IdSchema.nullable(),
  action: z.string(),
  entityId: z.string(),
  metadata: z.unknown(),
  createdAt: IsoDateSchema,
});
export const AckSchema = z.object({ ok: z.literal(true) });
export function PageSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  });
}
export function EnvelopeSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({ data, meta: z.object({ requestId: z.string(), timestamp: IsoDateSchema }) });
}
export const ErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional() }),
  meta: z.object({ requestId: z.string(), timestamp: IsoDateSchema }),
});
export type User = z.infer<typeof UserSchema>;
export type Tour = z.infer<typeof TourSchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type AuthResult = z.infer<typeof AuthResultSchema>;
export type AssistantResult = z.infer<typeof AssistantResultSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type QuoteInput = z.infer<typeof QuoteSchema>;
export type Page<T> = { items: T[]; page: number; pageSize: number; total: number };
export type ApiResponse<T> = { data: T; meta: { requestId: string; timestamp: string } };

/** Prices are already whole VND. BigInt prevents intermediate floating-point loss. */
export function calculateTotal(
  adults: number,
  children: number,
  adultPrice: number,
  childPrice: number,
): number {
  PartySchema.parse({ adults, children });
  MoneySchema.parse(adultPrice);
  MoneySchema.parse(childPrice);
  return MoneySchema.parse(
    Number(BigInt(adults) * BigInt(adultPrice) + BigInt(children) * BigInt(childPrice)),
  );
}
export function canCustomerCancel(status: BookingStatus, departureAt: Date, now: Date): boolean {
  return (
    (status === 'PENDING_PAYMENT' || status === 'PAID') &&
    departureAt.getTime() - now.getTime() >= CANCEL_WINDOW_MS
  );
}
