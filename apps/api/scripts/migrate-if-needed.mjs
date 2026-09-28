import { readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const here = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(here, '..');
const migrationDir = resolve(apiRoot, 'prisma', 'migrations');
const prismaCli = resolve(apiRoot, '..', '..', 'node_modules', 'prisma', 'build', 'index.js');

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label + ' timed out after ' + ms + 'ms')), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function localMigrationNames() {
  const entries = await readdir(migrationDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function appliedMigrationNames(prisma) {
  const table = await withTimeout(
    prisma.$queryRawUnsafe("SELECT to_regclass('public._prisma_migrations')::text AS table_name"),
    15000,
    'Prisma migration table check',
  );
  if (!table[0]?.table_name) return new Set();

  const rows = await withTimeout(
    prisma.$queryRawUnsafe(
      'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL',
    ),
    15000,
    'Applied migration query',
  );
  return new Set(rows.map((row) => row.migration_name));
}

async function runPrismaMigrate() {
  console.info('[db:migrate] Pending migrations detected; running prisma migrate deploy');
  const child = spawn(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    cwd: apiRoot,
    stdio: 'inherit',
    env: process.env,
  });

  const timeout = setTimeout(() => {
    console.error('[db:migrate] prisma migrate deploy exceeded 120s; terminating');
    child.kill('SIGTERM');
  }, 120000);

  const code = await new Promise((resolveCode, reject) => {
    child.once('error', reject);
    child.once('exit', (exitCode, signal) => {
      if (signal) return reject(new Error('prisma migrate deploy terminated by ' + signal));
      resolveCode(exitCode ?? 1);
    });
  }).finally(() => clearTimeout(timeout));

  if (code !== 0) throw new Error('prisma migrate deploy exited with code ' + code);
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

  const local = await localMigrationNames();
  const prisma = new PrismaClient();

  try {
    const applied = await appliedMigrationNames(prisma);
    const missing = local.filter((name) => !applied.has(name));

    if (missing.length === 0) {
      console.info(
        '[db:migrate] Database is current (' + local.length + '/' + local.length + ' migrations)',
      );
      return;
    }

    console.info('[db:migrate] Missing migrations: ' + missing.join(', '));
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }

  await runPrismaMigrate();
}

main().catch((error) => {
  console.error('[db:migrate] ' + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
});
