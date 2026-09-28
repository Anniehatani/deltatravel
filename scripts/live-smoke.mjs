#!/usr/bin/env node

const WEB = (process.env.LIVE_WEB_URL || 'https://delta-travel-web.onrender.com').replace(
  /\/$/,
  '',
);
const API = (process.env.LIVE_API_URL || 'https://delta-travel-api.onrender.com/api/v1').replace(
  /\/$/,
  '',
);

async function textGet(url) {
  const response = await fetch(url, { redirect: 'follow' });
  const text = await response.text();
  if (!response.ok) throw new Error(`GET ${url} -> ${response.status}: ${text.slice(0, 400)}`);
  return { response, text };
}

async function jsonRequest(url, init = {}) {
  const response = await fetch(url, init);
  const raw = await response.text();
  let body;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = raw;
  }
  if (!response.ok) {
    throw new Error(`${init.method || 'GET'} ${url} -> ${response.status}: ${raw.slice(0, 500)}`);
  }
  return body?.data ?? body;
}

function pass(label, detail = '') {
  console.log(`PASS  ${label}${detail ? `  ${detail}` : ''}`);
}

for (const route of ['/', '/assistant', '/tours']) {
  const { response, text: html } = await textGet(WEB + route);
  if (html.length < 100) throw new Error(`Web route ${route} returned unexpectedly small HTML`);
  if (route === '/') {
    const expectedHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'strict-origin-when-cross-origin',
    };
    for (const [name, expected] of Object.entries(expectedHeaders)) {
      const actual = response.headers.get(name);
      if (actual !== expected) {
        throw new Error(`Security header ${name} expected ${expected}, got ${actual}`);
      }
    }
    pass('web security headers');
  }
  pass('web ' + route);
}

const ready = await jsonRequest(API + '/health/ready');
if (ready?.status !== 'ok') throw new Error('health/ready did not return status=ok');
pass('health/ready');

const provider = await jsonRequest(API + '/assistant/provider-status');
if (!provider?.preferredProvider)
  throw new Error('assistant/provider-status missing preferredProvider');
pass(
  'assistant/provider-status',
  JSON.stringify({
    preferredProvider: provider.preferredProvider,
    groqConfigured: provider.groqConfigured,
    geminiConfigured: provider.geminiConfigured,
    fallbackAvailable: provider.fallbackAvailable,
  }),
);

const integrations = await jsonRequest(API + '/health/integrations');
if (!integrations?.payments) throw new Error('health/integrations missing payment readiness');
pass('health/integrations', JSON.stringify(integrations));

const paymentStatus = await jsonRequest(API + '/payments/providers/status');
if (!Array.isArray(paymentStatus?.providers)) {
  throw new Error('payments/providers/status missing providers array');
}
const cash = paymentStatus.providers.find((item) => item.provider === 'CASH');
if (!cash?.available) throw new Error('CASH provider is not available');
pass('payments/providers/status', JSON.stringify(paymentStatus.providers));

const chat = await jsonRequest(API + '/assistant/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Origin: WEB,
    'X-CSRF-Protection': '1',
  },
  body: JSON.stringify({
    message: 'Tìm tour Đà Nẵng cho 2 người lớn ngân sách 8 triệu',
    history: [],
  }),
});
if (!chat || !Array.isArray(chat.sources))
  throw new Error('assistant/chat missing expected response shape');
pass('assistant/chat', JSON.stringify({ mode: chat.mode, sources: chat.sources.length }));

console.log('\nLIVE_SMOKE_PASS');
