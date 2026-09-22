import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import shared from '../packages/shared/dist/index.js';
import { endpoints } from './contract-manifest.mjs';
const s = { ...shared, HealthSchema: z.object({ status: z.literal('ok') }) };
const id = '11111111-1111-4111-8111-111111111111',
  sid = '22222222-2222-4222-8222-222222222222',
  bid = '33333333-3333-4333-8333-333333333333',
  uid = '44444444-4444-4444-8444-444444444444',
  pid = '55555555-5555-4555-8555-555555555555';
const now = '2026-12-01T01:00:00.000Z',
  departure = '2026-12-15T01:00:00.000Z';
const user = { id: uid, name: 'Nguyễn Minh Anh', email: 'minhanh@example.com', role: 'CUSTOMER' };
const tour = {
  id,
  title: 'Đà Nẵng và Hội An',
  slug: 'da-nang-hoi-an',
  description: 'Hành trình khám phá Đà Nẵng và Hội An trong ba ngày.',
  destination: 'Đà Nẵng',
  countryCode: 'VN',
  durationDays: 3,
  status: 'ACTIVE',
  createdAt: now,
  updatedAt: now,
};
const schedule = {
  id: sid,
  tourId: id,
  departureAt: departure,
  totalSeats: 30,
  reservedSeats: 8,
  availableSeats: 22,
  adultPrice: 3990000,
  childPrice: 2490000,
  status: 'OPEN',
  serverTime: now,
};
const createBooking = {
  scheduleId: sid,
  adults: 2,
  children: 1,
  contactName: 'Nguyễn Minh Anh',
  contactEmail: 'minhanh@example.com',
  contactPhone: '0901234567',
};
const booking = {
  id: bid,
  ...createBooking,
  status: 'PENDING_PAYMENT',
  totalAmount: 10470000,
  currency: 'VND',
  expiresAt: '2026-12-01T01:15:00.000Z',
  createdAt: now,
  paidAt: null,
  cancelledAt: null,
  cancelReason: null,
  tourTitle: tour.title,
  departureAt: departure,
  details: [
    { kind: 'ADULT', quantity: 2, unitPrice: 3990000, lineTotal: 7980000 },
    { kind: 'CHILD', quantity: 1, unitPrice: 2490000, lineTotal: 2490000 },
  ],
  serverTime: now,
};
const payment = {
  id: pid,
  bookingId: bid,
  provider: 'VNPAY',
  status: 'INITIATED',
  amount: 10470000,
  currency: 'VND',
  checkoutUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?example=only',
  createdAt: now,
};
const examples = {
  RegisterSchema: { name: user.name, email: user.email, password: 'DemoPassword_123!' },
  LoginSchema: { email: user.email, password: 'DemoPassword_123!' },
  EmptySchema: {},
  UserSchema: user,
  AuthResultSchema: { user, accessToken: '<JWT_ACCESS_TOKEN>', expiresIn: 900 },
  AckSchema: { ok: true },
  TourSchema: tour,
  CreateTourSchema: (({ id, createdAt, updatedAt, ...r }) => r)(tour),
  UpdateTourSchema: { status: 'ACTIVE' },
  ScheduleSchema: schedule,
  CreateScheduleSchema: (({ id, reservedSeats, availableSeats, serverTime, ...r }) => r)(schedule),
  UpdateScheduleSchema: { totalSeats: 35, childPrice: 2490000 },
  QuoteSchema: { scheduleId: sid, adults: 2, children: 1 },
  QuoteResultSchema: {
    scheduleId: sid,
    adults: 2,
    children: 1,
    adultPrice: 3990000,
    childPrice: 2490000,
    totalAmount: 10470000,
    currency: 'VND',
    availableSeats: 22,
    serverTime: now,
  },
  CreateBookingSchema: createBooking,
  BookingSchema: booking,
  CancelSchema: { reason: 'Thay đổi kế hoạch cá nhân' },
  TransitionSchema: { status: 'CONFIRMED' },
  CreatePaymentSchema: { bookingId: bid, provider: 'VNPAY' },
  PaymentSchema: payment,
  RefundRecordSchema: {
    reference: 'REFUND-20261201-001',
    note: 'Đã đối soát hoàn tiền đầy đủ qua cổng thanh toán',
  },
  SummarySchema: { tours: 3, bookings: 12, pendingRefunds: 1 },
  AuditSchema: {
    id,
    actorId: uid,
    action: 'BOOKING_CREATED',
    entityId: bid,
    metadata: { seats: 3, totalAmount: 10470000 },
    createdAt: now,
  },
  AssistantRequestSchema: { message: 'Tìm tour Đà Nẵng', history: [] },
  AssistantResultSchema: {
    reply: 'Đà Nẵng và Hội An tại Đà Nẵng, 3 ngày. Xem lịch để có giá và chỗ hiện tại.',
    mode: 'RULE_BASED',
    actions: [
      { label: 'Xem Đà Nẵng và Hội An', href: `/tours/${id}`, requiresConfirmation: false },
    ],
    sources: [{ type: 'TOUR', id, label: tour.title }],
  },
  HealthSchema: { status: 'ok' },
};
function jsonSchema(schema) {
  const result = zodToJsonSchema(schema, { target: 'openApi3', $refStrategy: 'none' });
  delete result.$schema;
  return result;
}
function responseSchema(name) {
  return name.endsWith('[]') ? s.PageSchema(s[name.slice(0, -2)]) : s[name];
}
function responseExample(name, path) {
  let sample = structuredClone(
    name.endsWith('[]')
      ? { items: [examples[name.slice(0, -2)]], page: 1, pageSize: 20, total: 1 }
      : examples[name],
  );
  if (path.endsWith('/cancel'))
    sample = {
      ...booking,
      status: 'CANCELLED',
      cancelledAt: now,
      cancelReason: 'Thay đổi kế hoạch cá nhân',
    };
  if (path.endsWith('/status')) sample = { ...booking, status: 'CONFIRMED', paidAt: now };
  if (path.endsWith('/refund-record'))
    sample = { ...payment, status: 'REFUNDED', checkoutUrl: null };
  return { data: sample, meta: { requestId: 'example-request-id', timestamp: now } };
}
const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Tour Booking API',
    version: '1.0.0',
    description: 'SRS-TOUR-2026-v1.0. Values in VND; UTC ISO 8601 timestamps.',
  },
  servers: [{ url: 'http://localhost:4000/api/v1' }],
  paths: {},
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      refreshCookie: { type: 'apiKey', in: 'cookie', name: 'refresh_token' },
    },
    schemas: { ApiError: jsonSchema(s.ErrorSchema) },
  },
};
const header = `# API Contract v1.0\n\nSRS-TOUR-2026-v1.0. Sinh từ shared Zod schemas và scripts/contract-manifest.mjs bằng npm run docs:generate. Không sửa trực tiếp phần sinh tự động.\n\n## Quy ước chung\n\n- Base URL local: http://localhost:4000/api/v1. HTTPS bắt buộc khi triển khai.\n- JSON UTF-8. Tên trường camelCase; ID UUID; tiền là số nguyên VND không âm. Database dùng BIGINT, response chuyển số nguyên trong giới hạn an toàn.\n- Ngày giờ ISO 8601 có offset, lưu UTC, UI hiển thị Asia/Ho_Chi_Minh. So sánh 72 giờ theo milliseconds, không trừ ngày lịch.\n- Response thành công: {data,meta:{requestId,timestamp}}. Lỗi: {error:{code,message,details?},meta}. Webhook dùng định dạng riêng ở cuối tài liệu.\n- JWT: Authorization: Bearer <token>. Không lưu token vào localStorage. Refresh nằm trong cookie HttpOnly, SameSite=Strict, Secure ở production.\n- Auth POST: Origin phải bằng WEB_ORIGIN, X-CSRF-Protection: 1, credentials: include. curl/Postman cũng phải gửi hai header này.\n- Pagination: page mặc định 1, pageSize mặc định 20, tối đa 100; response items,page,pageSize,total. q/destination tùy chọn.\n- Guest là chưa đăng nhập, không phải một giá trị role trong DB. User = mọi tài khoản đang hoạt động, dữ liệu cá nhân vẫn lọc theo userId.\n- 400 validation/chữ ký/số tiền; 401 thiếu/sai phiên; 403 quyền/CSRF; 404 không thấy hoặc không sở hữu; 409 xung đột nghiệp vụ; 422 giới hạn cổng; 429 rate limit; 502 phản hồi cổng không hợp lệ; 503 chưa cấu hình hoặc phụ thuộc lỗi.\n- Chỉ CUSTOMER được tạo đơn. Admin/Operations dùng phân hệ vận hành. Header hoặc body giả role/userId đều không cấp quyền.\n\n## Các bất biến mà frontend phải giữ\n\n1. adults >= 1, children >= 0, không có infants. Cả hai cùng chiếm một chỗ/người.\n2. Tổng tiền do backend tính từ giá trong DB. Client không gửi totalAmount hoặc status.\n3. Một Idempotency-Key UUID cho một lần xác nhận đặt; giữ nguyên khi retry sau timeout mạng. Thay nội dung phải tạo key mới.\n4. Quote không giữ chỗ. Tạo đơn mới kiểm tra và khóa chỗ trong transaction.\n5. expiresAt = createdAt + 900000ms. now >= expiresAt là hết hạn. Không gia hạn khi refresh, retry hoặc tạo payment.\n6. Countdown dùng expiresAt và serverTime. Poll kho chỗ mỗi 3 giây là thông tin cập nhật gần realtime; không thay cho kiểm tra nguyên tử khi đặt.\n7. Browser return URL không phải bằng chứng thanh toán. Chỉ webhook xác thực được phép đánh dấu PAID.\n8. Hủy đơn và hoàn tiền là hai quy trình. REFUND_REQUIRED không có nghĩa đã hoàn tiền.\n\n## Endpoint index\n\n| Method | Path | Quyền | Request body | Data response | HTTP |\n|---|---|---|---|---|---|\n`;
let md =
  header +
  endpoints
    .map(
      ([method, path, auth, body, response, status]) =>
        `| ${method} | ${path} | ${auth} | ${body ?? 'Không'} | ${response} | ${status} |`,
    )
    .join('\n') +
  '\n\n';
for (const [method, path, auth, body, response, status, note, query] of endpoints) {
  const params = [];
  if (path.includes('{id}'))
    params.push({
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string', format: 'uuid' },
    });
  if (query) {
    const schema = jsonSchema(s[query]);
    for (const [name, value] of Object.entries(schema.properties ?? {}))
      params.push({ name, in: 'query', required: false, schema: value });
  }
  if (path === '/bookings' && method === 'POST')
    params.push({
      name: 'Idempotency-Key',
      in: 'header',
      required: true,
      schema: { type: 'string', format: 'uuid' },
    });
  if (path.startsWith('/auth/') && method === 'POST')
    params.push(
      {
        name: 'Origin',
        in: 'header',
        required: true,
        schema: { type: 'string', example: 'http://localhost:3000' },
      },
      {
        name: 'X-CSRF-Protection',
        in: 'header',
        required: true,
        schema: { type: 'string', enum: ['1'] },
      },
    );
  const operation = {
    summary: note,
    operationId: `${method.toLowerCase()}${path.replace(/[^a-zA-Z]/g, '_')}`,
    tags: [path.split('/')[1]],
    security:
      auth === 'Guest' ? [] : auth === 'Cookie' ? [{ refreshCookie: [] }] : [{ bearerAuth: [] }],
    parameters: params,
    responses: {
      [status]: {
        description: 'Success',
        content: {
          'application/json': {
            schema: jsonSchema(s.EnvelopeSchema(responseSchema(response))),
            example: responseExample(response, path),
          },
        },
      },
      ...Object.fromEntries(
        [400, 401, 403, 404, 409, 422, 429, 502, 503].map((code) => [
          code,
          {
            description: 'See error.code',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
          },
        ]),
      ),
    },
  };
  if (path === '/assistant/chat') operation.security = [{}, { bearerAuth: [] }];
  if (body)
    operation.requestBody = {
      required: true,
      content: { 'application/json': { schema: jsonSchema(s[body]), example: examples[body] } },
    };
  openapi.paths[path] ??= {};
  openapi.paths[path][method.toLowerCase()] = operation;
  md += `## ${method} ${path}\n\nQuyền: ${auth}. HTTP thành công: ${status}. ${note}\n\n`;
  if (query)
    md += `Query: ${query === 'TourQuerySchema' ? 'q, destination, ' : ''}page=1&pageSize=20.\n\n`;
  if (body) {
    s[body].parse(examples[body]);
    md += `Request (${body}):\n\n\`\`\`json\n${JSON.stringify(examples[body], null, 2)}\n\`\`\`\n\n`;
  }
  const ex = responseExample(response, path);
  s.EnvelopeSchema(responseSchema(response)).parse(ex);
  md += `Response:\n\n\`\`\`json\n${JSON.stringify(ex, null, 2)}\n\`\`\`\n\n`;
}
const webhooks = [
  [
    'get',
    '/payments/webhooks/vnpay',
    'VNPay IPN qua query, HMAC-SHA512. amount đơn vị VND x100.',
    '{ "RspCode": "00", "Message": "Confirm Success" }',
  ],
  [
    'post',
    '/payments/webhooks/momo',
    'MoMo IPN JSON, HMAC-SHA256. HTTP 204 khi đã ghi nhận bền vững.',
    'Không có body (204)',
  ],
  [
    'post',
    '/payments/webhooks/zalopay',
    'ZaloPay JSON {data:string,mac:string,type?:number}. HMAC-SHA256 key2 trên đúng chuỗi data.',
    '{ "return_code": 1, "return_message": "success" }',
  ],
];
md +=
  '## Webhook thanh toán\n\nKhông có JWT. Chữ ký là bắt buộc; không gọi webhook từ frontend. Không dùng response envelope. Các ví dụ sau chỉ minh họa cấu trúc, không phải chữ ký hợp lệ.\n\n';
for (const [method, path, note, ack] of webhooks) {
  const status = path.endsWith('momo') ? 204 : 200;
  const provider = path.split('/').at(-1);
  const payload =
    provider === 'vnpay'
      ? {
          vnp_TmnCode: 'TESTCODE',
          vnp_TxnRef: pid,
          vnp_Amount: '1047000000',
          vnp_TransactionNo: '123456789',
          vnp_ResponseCode: '00',
          vnp_TransactionStatus: '00',
          vnp_SecureHash: '<HMAC_SHA512>',
        }
      : provider === 'momo'
        ? {
            partnerCode: '<PARTNER_CODE>',
            orderId: pid,
            requestId: pid,
            amount: 10470000,
            orderInfo: 'Thanh toan tour',
            orderType: 'momo_wallet',
            transId: 123456789,
            resultCode: 0,
            message: 'Successful',
            payType: 'qr',
            responseTime: 1796086800000,
            extraData: '',
            signature: '<HMAC_SHA256>',
          }
        : {
            data: JSON.stringify({
              app_id: 2553,
              app_trans_id: '261201_' + pid.replace(/-/g, ''),
              zp_trans_id: 123456789,
              amount: 10470000,
            }),
            mac: '<HMAC_SHA256>',
            type: 1,
          };
  const schema = {
    type: 'object',
    properties: Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [
        key,
        { type: typeof value === 'number' ? 'integer' : 'string' },
      ]),
    ),
    required: Object.keys(payload).filter((key) => key !== 'type'),
  };
  const operation = { summary: note, security: [], responses: { [status]: { description: ack } } };
  if (method === 'post')
    operation.requestBody = {
      required: true,
      content: { 'application/json': { schema, example: payload } },
    };
  else
    operation.parameters = Object.entries(schema.properties).map(([name, value]) => ({
      name,
      in: 'query',
      required: true,
      schema: value,
      example: payload[name],
    }));
  openapi.paths[path] = { [method]: operation };
  md += `### ${method.toUpperCase()} ${path}\n\n${note}\n\n${method === 'get' ? 'Query parameters, biểu diễn dưới dạng object để dễ đọc' : 'Request JSON'}:\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n\nACK: ${ack}.\n\n`;
}
md += `VNPay query tối thiểu: vnp_TmnCode, vnp_TxnRef, vnp_Amount, vnp_TransactionNo, vnp_ResponseCode, vnp_TransactionStatus, vnp_SecureHash. Ký toàn bộ tham số trả về trừ vnp_SecureHash và vnp_SecureHashType, sort tên rồi URL encode, dấu cách thành +. Cả hai trạng thái phải 00. ACK 02 khi đã ghi nhận, 97 chữ ký sai, 01 không thấy giao dịch, 04 sai tiền, 99 lỗi khác.\n\nMoMo JSON có partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature. Canonical signature gồm accessKey cộng các trường theo thứ tự trong gateways.ts. resultCode=0 thành công. Callback số nguyên vượt giới hạn an toàn JS bị từ chối, không làm tròn im lặng. ACK 204 sau commit, lỗi 4xx/5xx để đối soát/retry.\n\nZaloPay data chứa app_id, app_trans_id, zp_trans_id, amount. Callback này chỉ thông báo thành công; xác minh key2 và app_id. ACK return_code=1, sai MAC=-1, lỗi xử lý=0.\n\nReplay hợp lệ không đổi trạng thái hoặc trả chỗ lần hai. Sai provider/merchant/reference/amount không đánh dấu PAID. Tiền đến sau timeout hoặc sau hủy: REFUND_REQUIRED và giữ đơn CANCELLED. Thời điểm quyết định là clock_timestamp() của DB sau khi lấy khóa lịch.\n\n## Lỗi mẫu\n\n\`\`\`json\n{"error":{"code":"INSUFFICIENT_SEATS","message":"Không đủ chỗ"},"meta":{"requestId":"example-request-id","timestamp":"${now}"}}\n\`\`\`\n\nMã nghiệp vụ ổn định: VALIDATION_ERROR, INVALID_CREDENTIALS, UNAUTHORIZED, FORBIDDEN, CSRF_REJECTED, NOT_FOUND, CONFLICT, IDEMPOTENCY_CONFLICT, INSUFFICIENT_SEATS, SCHEDULE_UNAVAILABLE, CANCELLATION_NOT_ALLOWED, INVALID_TRANSITION, TOUR_NOT_STARTED, CAPACITY_BELOW_RESERVED, BOOKING_NOT_PAYABLE, PAYMENT_PROVIDER_LOCKED, PROVIDER_NOT_CONFIGURED, PROVIDER_AMOUNT_LIMIT, PROVIDER_TIME_LIMIT, PROVIDER_UNAVAILABLE, INVALID_PROVIDER_RESPONSE, INVALID_SIGNATURE, MERCHANT_MISMATCH, AMOUNT_MISMATCH, TRANSACTION_MISMATCH, REFUND_NOT_REQUIRED, REFUND_REFERENCE_CONFLICT, RETRY_TRANSACTION, RATE_LIMITED.\n\nChi tiết từng trường và required/optional nằm trong openapi.json và packages/shared/src/index.ts. OpenAPI bao gồm schema request/response; các ví dụ ở tài liệu này được Zod kiểm tra khi sinh.\n`;
writeFileSync(new URL('../docs/API_CONTRACT.md', import.meta.url), md);
writeFileSync(
  new URL('../docs/openapi.json', import.meta.url),
  JSON.stringify(openapi, null, 2) + '\n',
);
console.log(
  `Generated ${endpoints.length + webhooks.length} operations; every JSON example validated with shared Zod.`,
);
