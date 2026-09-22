import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
for (const [source, target] of [
  ['.env.example', '.env'],
  ['apps/api/.env.example', 'apps/api/.env'],
  ['apps/web/.env.example', 'apps/web/.env.local'],
]) {
  const to = new URL(target, root);
  if (existsSync(to)) {
    console.log(`Giữ nguyên ${target}`);
    continue;
  }
  const value = readFileSync(new URL(source, root), 'utf8')
    .replace('REPLACE_WITH_RANDOM_64_HEX', randomBytes(32).toString('hex'))
    .replace('REPLACE_WITH_RANDOM_SEED_PASSWORD', randomBytes(18).toString('base64url'));
  writeFileSync(to, value, { mode: 0o600 });
  console.log(`Đã tạo ${fileURLToPath(to)}`);
}
console.log(
  'Đọc SEED_ADMIN_PASSWORD trong apps/api/.env để đăng nhập admin. Không commit các tệp .env.',
);
