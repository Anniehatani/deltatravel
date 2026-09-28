import { z } from 'zod';

const optionalString = (schema: z.ZodTypeAny) =>
  z.preprocess((value) => (value === '' || value === null ? undefined : value), schema.optional());

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  API_PUBLIC_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  CASH_HOLD_MINUTES: z.coerce.number().int().min(15).max(10080).default(1440),

  PASSWORD_RESET_PEPPER: optionalString(z.string().min(32)),
  MAIL_PROVIDER: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.enum(['DISABLED', 'CONSOLE', 'RESEND', 'SENDGRID']).default('DISABLED'),
  ),
  MAIL_FROM: optionalString(z.string().email()),
  RESEND_API_KEY: optionalString(z.string().min(10)),
  SENDGRID_API_KEY: optionalString(z.string().min(10)),

  AI_REQUIRED: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .default(false)
    .transform((v) => v === true || v === 'true'),
  AI_PROVIDER: optionalString(z.enum(['GROQ', 'GEMINI'])),
  GROQ_API_KEY: optionalString(z.string().min(10)),
  GROQ_MODEL: optionalString(z.string().min(1)),
  GEMINI_API_KEY: optionalString(z.string().min(10)),
  GEMINI_MODEL: optionalString(z.string().min(1)),

  SUPABASE_URL: optionalString(z.string().url()),
  SUPABASE_SECRET_KEY: optionalString(z.string().min(20)),
  SUPABASE_SERVICE_ROLE_KEY: optionalString(z.string().min(20)),
  SUPABASE_AVATAR_BUCKET: z.string().min(1).default('avatars'),
});

export function validateEnv(value: Record<string, unknown>) {
  const normalized = {
    ...value,
    API_PUBLIC_URL: value.API_PUBLIC_URL || value.RENDER_EXTERNAL_URL || 'http://localhost:4000',
  };
  const e = schema.parse(normalized);

  if (
    e.NODE_ENV === 'production' &&
    (!e.WEB_ORIGIN.startsWith('https://') || !e.API_PUBLIC_URL.startsWith('https://'))
  ) {
    throw new Error('Production requires HTTPS');
  }

  if (e.NODE_ENV === 'production' && !e.PASSWORD_RESET_PEPPER) {
    throw new Error('Production requires PASSWORD_RESET_PEPPER');
  }

  if (e.NODE_ENV === 'production' && e.MAIL_PROVIDER === 'CONSOLE') {
    throw new Error('Console mail provider is disabled in production');
  }

  if ((e.MAIL_PROVIDER === 'RESEND' || e.MAIL_PROVIDER === 'SENDGRID') && !e.MAIL_FROM) {
    throw new Error('MAIL_FROM is required for external mail providers');
  }

  if (e.MAIL_PROVIDER === 'RESEND' && !e.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is required when MAIL_PROVIDER=RESEND');
  }

  if (e.MAIL_PROVIDER === 'SENDGRID' && !e.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY is required when MAIL_PROVIDER=SENDGRID');
  }

  if (e.AI_REQUIRED && !e.AI_PROVIDER) {
    throw new Error('AI_REQUIRED=true requires AI_PROVIDER');
  }

  if (e.AI_REQUIRED && e.AI_PROVIDER === 'GROQ' && (!e.GROQ_API_KEY || !e.GROQ_MODEL)) {
    throw new Error('AI_REQUIRED=true with GROQ requires GROQ_API_KEY and GROQ_MODEL');
  }

  if (e.AI_REQUIRED && e.AI_PROVIDER === 'GEMINI' && (!e.GEMINI_API_KEY || !e.GEMINI_MODEL)) {
    throw new Error('AI_REQUIRED=true with GEMINI requires GEMINI_API_KEY and GEMINI_MODEL');
  }

  // Supabase avatar storage is an optional integration. Keep the core API available
  // even when only part of its configuration is present; AvatarStorageService
  // fails closed with AVATAR_STORAGE_NOT_CONFIGURED until both values exist.
  return { ...value, ...e };
}
