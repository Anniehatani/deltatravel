#!/usr/bin/env node

import { randomBytes, randomUUID } from 'node:crypto';

const API = (process.env.VERIFY_API_URL || 'https://delta-travel-api.onrender.com/api/v1').replace(
  /\/$/,
  '',
);
const ORIGIN = (process.env.VERIFY_ORIGIN || 'https://delta-travel-web.onrender.com').replace(
  /\/$/,
  '',
);
const ALLOW_MUTATIONS = process.env.VERIFY_ALLOW_MUTATIONS === 'true';

if (!ALLOW_MUTATIONS) {
  console.error('Refusing to mutate staging. Set VERIFY_ALLOW_MUTATIONS=true explicitly.');
  process.exit(2);
}

function headers(token, json = false) {
  return {
    Origin: ORIGIN,
    'X-CSRF-Protection': '1',
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
  };
}

async function request(path, { method = 'GET', token, body, extraHeaders = {} } = {}) {
  const response = await fetch(API + path, {
    method,
    headers: { ...headers(token, body !== undefined), ...extraHeaders },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const raw = await response.text();
  let parsed;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = raw;
  }
  if (!response.ok) {
    const code = parsed?.error?.code || 'HTTP_' + response.status;
    const message = parsed?.error?.message || String(parsed);
    throw new Error(`${path} -> ${response.status} ${code}: ${message}`);
  }
  return parsed?.data ?? parsed;
}

function pass(label, detail = '') {
  console.log(`PASS  ${label}${detail ? `  ${detail}` : ''}`);
}

const suffix = Date.now().toString(36) + randomBytes(3).toString('hex');
const email = `e2e+${suffix}@example.com`;
const password = 'E2E!' + randomBytes(16).toString('hex');
const name = 'Delta E2E';

const auth = await request('/auth/register', {
  method: 'POST',
  body: { name, email, password },
});
const token = auth.accessToken;
if (!token) throw new Error('register did not return accessToken');
pass('auth/register', email);

const me = await request('/auth/me', { token });
if (me.email !== email) throw new Error('auth/me returned a different user');
pass('auth/me');

const tours = await request('/tours?page=1&pageSize=50');
let chosen = null;
for (const tour of tours.items || []) {
  const schedules = await request(`/tours/${tour.id}/schedules?page=1&pageSize=50`);
  const schedule = (schedules.items || []).find(
    (item) =>
      item.status === 'OPEN' &&
      item.availableSeats >= 1 &&
      new Date(item.departureAt).getTime() - Date.now() >= 72 * 60 * 60 * 1000,
  );
  if (schedule) {
    chosen = { tour, schedule };
    break;
  }
}
if (!chosen) throw new Error('No public OPEN schedule with >=1 seat and >=72h before departure');
pass('catalog schedule', chosen.tour.title);

const plan = await request('/assistant/agent/plans', {
  method: 'POST',
  token,
  body: {
    message: `Đặt tour ${chosen.tour.title} cho 1 người lớn, thanh toán tiền mặt`,
    lang: 'vi',
    adults: 1,
    children: 0,
    scheduleId: chosen.schedule.id,
    contactPhone: '0901234567',
    provider: 'CASH',
  },
});
if (!plan.checkpoint?.requiresExplicitApproval) {
  throw new Error(`Agent plan did not stop at explicit approval checkpoint: ${plan.status}`);
}
pass('agent plan checkpoint', `mode=${plan.mode}, status=${plan.status}`);

const approved = await request(`/assistant/agent/plans/${plan.id}/approve`, {
  method: 'POST',
  token,
  body: { approved: true, version: plan.checkpoint.version },
});
if (!approved.booking?.id) throw new Error('Agent approval did not create a booking');
if (approved.payment?.provider !== 'CASH')
  throw new Error('Agent approval did not create CASH payment');
pass('agent approval creates booking + CASH', approved.booking.id);

const booking = await request('/bookings/' + approved.booking.id, { token });
if (booking.status !== 'AWAITING_CASH') {
  throw new Error(`Expected AWAITING_CASH, got ${booking.status}`);
}
pass('booking persisted', booking.status);

const cancelled = await request('/bookings/' + booking.id + '/cancel', {
  method: 'POST',
  token,
  body: { reason: 'Automated staging E2E cleanup' },
});
if (cancelled.status !== 'CANCELLED') throw new Error('Booking cleanup did not cancel booking');
pass('booking cleanup', cancelled.status);

const replay = await request('/bookings', {
  method: 'POST',
  token,
  extraHeaders: { 'Idempotency-Key': randomUUID() },
  body: {
    scheduleId: chosen.schedule.id,
    adults: 1,
    children: 0,
    contactName: name,
    contactEmail: email,
    contactPhone: '0901234567',
  },
});
await request('/bookings/' + replay.id + '/cancel', {
  method: 'POST',
  token,
  body: { reason: 'Automated staging direct-booking cleanup' },
});
pass('direct booking path + cleanup', replay.id);

console.log('\nSTAGING_MUTATION_E2E_PASS');
