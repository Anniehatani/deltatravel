#!/usr/bin/env node

const WEB = (process.env.LIVE_WEB_URL || 'https://delta-travel-web.onrender.com').replace(
  /\/$/,
  '',
);
const API = (process.env.LIVE_API_URL || 'https://delta-travel-api.onrender.com/api/v1').replace(
  /\/$/,
  '',
);

function pass(label, detail = '') {
  console.log(`PASS  ${label}${detail ? `  ${detail}` : ''}`);
}

async function expectStatus(label, url, init, allowed) {
  const response = await fetch(url, init);
  const text = await response.text();
  if (!allowed.includes(response.status)) {
    throw new Error(
      `${label}: expected ${allowed.join('/')} got ${response.status}: ${text.slice(0, 300)}`,
    );
  }
  pass(label, `status=${response.status}`);
  return { response, text };
}

await expectStatus('admin API rejects anonymous access', API + '/admin/summary', {}, [401]);
await expectStatus('customer bookings reject anonymous access', API + '/bookings', {}, [401]);

await expectStatus(
  'auth mutation rejects missing CSRF origin',
  API + '/auth/login',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Protection': '1',
    },
    body: JSON.stringify({
      email: 'security-smoke@example.com',
      password: 'NotARealPassword123!',
    }),
  },
  [403],
);

const evilOrigin = 'https://evil.example';
const cors = await fetch(API + '/health/live', { headers: { Origin: evilOrigin } });
if (!cors.ok) throw new Error(`CORS probe health request failed: ${cors.status}`);
if (cors.headers.get('access-control-allow-origin') === evilOrigin) {
  throw new Error('CORS reflected an untrusted origin');
}
pass('CORS does not authorize untrusted origin');

const integrations = await fetch(API + '/health/integrations');
const integrationText = await integrations.text();
if (!integrations.ok) throw new Error(`integration readiness failed: ${integrations.status}`);
const paymentStatus = await fetch(API + '/payments/providers/status');
const paymentText = await paymentStatus.text();
if (!paymentStatus.ok) throw new Error(`payment capability failed: ${paymentStatus.status}`);

const publicPayload = integrationText + '\n' + paymentText;
for (const pattern of [
  /gsk_[A-Za-z0-9]+/i,
  /sb_secret_[A-Za-z0-9_-]+/i,
  /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/i,
  /hashSecret/i,
  /secretKey/i,
  /serviceRoleKey/i,
]) {
  if (pattern.test(publicPayload)) {
    throw new Error(`Public readiness payload appears to expose secret material: ${pattern}`);
  }
}
pass('public readiness endpoints expose capability only');

const web = await fetch(WEB + '/', { redirect: 'follow' });
if (!web.ok) throw new Error(`web security header probe failed: ${web.status}`);
const requiredHeaders = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
};
for (const [name, expected] of Object.entries(requiredHeaders)) {
  const actual = web.headers.get(name);
  if (actual !== expected) throw new Error(`${name}: expected ${expected}, got ${actual}`);
}
if (web.headers.get('x-powered-by')) {
  throw new Error('X-Powered-By should not be exposed');
}
pass('web defensive headers');

console.log('\nSECURITY_SMOKE_PASS');
