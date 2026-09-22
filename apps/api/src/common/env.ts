import { z } from 'zod';
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  JWT_SECRET: z.string().min(32),
});
export function validateEnv(value: Record<string, unknown>) {
  const e = schema.parse(value);
  if (
    e.NODE_ENV === 'production' &&
    (!e.WEB_ORIGIN.startsWith('https://') || !e.API_PUBLIC_URL.startsWith('https://'))
  )
    throw new Error('Production requires HTTPS');
  return { ...value, ...e };
}
