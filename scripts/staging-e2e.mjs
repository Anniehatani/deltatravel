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

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=',
  'base64',
);
const avatarTicket = await request('/profile/avatar/upload-url', {
  method: 'POST',
  token,
  body: { contentType: 'image/png', sizeBytes: png.length },
});
if (!avatarTicket?.signedUrl || !avatarTicket?.uploadId) {
  throw new Error('avatar upload ticket missing signedUrl/uploadId');
}
const avatarForm = new FormData();
avatarForm.append('cacheControl', '3600');
avatarForm.append('', new Blob([png], { type: 'image/png' }), 'avatar.png');
const avatarUpload = await fetch(avatarTicket.signedUrl, {
  method: 'PUT',
  headers: { 'x-upsert': 'false' },
  body: avatarForm,
});
if (!avatarUpload.ok) {
  throw new Error(
    `avatar storage upload -> ${avatarUpload.status}: ${(await avatarUpload.text()).slice(0, 300)}`,
  );
}
const avatarUser = await request('/profile/avatar/complete', {
  method: 'POST',
  token,
  body: { uploadId: avatarTicket.uploadId },
});
if (!avatarUser.avatarUrl) throw new Error('avatar complete did not persist avatarUrl');
const avatarReadback = await request('/profile/me', { token });
if (avatarReadback.avatarUrl !== avatarUser.avatarUrl) {
  throw new Error('profile avatar readback did not match completed avatar');
}
pass('avatar upload + persistence', avatarUser.avatarUrl);

const avatarRemoved = await request('/profile/avatar', { method: 'DELETE', token });
if (avatarRemoved.avatarUrl || avatarRemoved.avatarId) {
  throw new Error('avatar delete did not clear persisted avatar fields');
}
pass('avatar cleanup');

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

const concierge = await request('/assistant/chat', {
  method: 'POST',
  token,
  body: {
    message: `Tóm tắt booking ${booking.id} của tôi và cho biết bước tiếp theo`,
    history: [],
    lang: 'vi',
  },
});
if (
  !Array.isArray(concierge.sources) ||
  !concierge.sources.some((source) => source.type === 'BOOKING' && source.id === booking.id)
) {
  throw new Error('Contextual booking concierge did not ground itself in the requested booking');
}
if (!concierge.reply || concierge.reply.length < 20) {
  throw new Error('Contextual booking concierge returned an unexpectedly short answer');
}
pass('contextual booking AI concierge', `mode=${concierge.mode}`);

const cancelled = await request('/bookings/' + booking.id + '/cancel', {
  method: 'POST',
  token,
  body: { reason: 'Automated staging E2E cleanup' },
});
if (cancelled.status !== 'CANCELLED') throw new Error('Booking cleanup did not cancel booking');
pass('booking cleanup', cancelled.status);

const quote = await request('/bookings/quote', {
  method: 'POST',
  token,
  body: {
    scheduleId: chosen.schedule.id,
    adults: 1,
    children: 0,
  },
});
if (quote.totalAmount !== chosen.schedule.adultPrice) {
  throw new Error(
    `Quote total mismatch: expected ${chosen.schedule.adultPrice}, got ${quote.totalAmount}`,
  );
}
pass('manual booking quote', String(quote.totalAmount));

const directIdempotencyKey = randomUUID();
const directPayload = {
  scheduleId: chosen.schedule.id,
  adults: 1,
  children: 0,
  contactName: name,
  contactEmail: email,
  contactPhone: '0901234567',
};
const replay = await request('/bookings', {
  method: 'POST',
  token,
  extraHeaders: { 'Idempotency-Key': directIdempotencyKey },
  body: directPayload,
});
const idempotentReplay = await request('/bookings', {
  method: 'POST',
  token,
  extraHeaders: { 'Idempotency-Key': directIdempotencyKey },
  body: directPayload,
});
if (idempotentReplay.id !== replay.id) {
  throw new Error('Booking idempotency replay created a different booking');
}
pass('manual booking idempotency', replay.id);

const directPayment = await request('/payments', {
  method: 'POST',
  token,
  body: { bookingId: replay.id, provider: 'CASH' },
});
if (directPayment.provider !== 'CASH')
  throw new Error('Manual booking CASH payment was not created');
const directBooking = await request('/bookings/' + replay.id, { token });
if (directBooking.status !== 'AWAITING_CASH') {
  throw new Error(`Manual booking expected AWAITING_CASH, got ${directBooking.status}`);
}
pass('manual booking + CASH payment', replay.id);

await request('/bookings/' + replay.id + '/cancel', {
  method: 'POST',
  token,
  body: { reason: 'Automated staging direct-booking cleanup' },
});
pass('direct booking cleanup', replay.id);

console.log('\nSTAGING_MUTATION_E2E_PASS');
