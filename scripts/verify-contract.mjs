#!/usr/bin/env node

import { readFileSync } from 'node:fs';

const spec = JSON.parse(readFileSync(new URL('../docs/openapi.json', import.meta.url), 'utf8'));

const required = [
  ['post', '/auth/register'],
  ['post', '/auth/login'],
  ['post', '/bookings'],
  ['post', '/payments'],
  ['get', '/payments/providers/status'],
  ['get', '/admin/summary'],
  ['post', '/assistant/chat'],
  ['get', '/assistant/provider-status'],
  ['post', '/assistant/agent/plans'],
  ['get', '/assistant/agent/plans/{id}'],
  ['patch', '/assistant/agent/plans/{id}'],
  ['post', '/assistant/agent/plans/{id}/approve'],
  ['post', '/assistant/agent/plans/{id}/decline'],
  ['get', '/health/integrations'],
  ['get', '/health/live'],
  ['get', '/health/ready'],
  ['get', '/payments/webhooks/vnpay'],
  ['post', '/payments/webhooks/momo'],
  ['post', '/payments/webhooks/zalopay'],
];

const missing = required.filter(([method, path]) => !spec.paths?.[path]?.[method]);
if (missing.length) {
  console.error('OpenAPI is missing required operations:');
  for (const [method, path] of missing) console.error(`- ${method.toUpperCase()} ${path}`);
  process.exit(1);
}

const operationCount = Object.values(spec.paths || {}).reduce(
  (count, item) =>
    count +
    Object.keys(item).filter((key) =>
      ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(key),
    ).length,
  0,
);

if (operationCount < 55) {
  console.error(`OpenAPI operation count unexpectedly low: ${operationCount}`);
  process.exit(1);
}

console.log(`Contract verification PASS with ${operationCount} documented operations.`);
