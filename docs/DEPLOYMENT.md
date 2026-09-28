# Deployment và vận hành

Cập nhật: 28/09/2026.

## Hạ tầng hiện tại

Frontend và API đang chạy trên Render. PostgreSQL và Redis nằm trong cùng workspace Render và không mở public theo cấu hình hiện tại.

Frontend: https://delta-travel-web.onrender.com

API: https://delta-travel-api.onrender.com/api/v1

Health: https://delta-travel-api.onrender.com/api/v1/health/ready

Netlify vẫn có thể dùng làm frontend deployment hoặc deploy preview. Frontend đọc backend qua `NEXT_PUBLIC_API_URL`.

## Biến môi trường bắt buộc

Backend tối thiểu cần `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `WEB_ORIGIN`, `API_PUBLIC_URL`.

AI server side dùng `AI_PROVIDER`, `GROQ_API_KEY`, `GROQ_MODEL` hoặc Gemini tương ứng.

Reset password dùng provider mail và secret server side.

Avatar dùng Supabase server credentials. Không đặt server secret trong `NEXT_PUBLIC_*`.

## Payment gateway

CASH là phương thức nội bộ và đang available.

VNPay, MoMo và ZaloPay chỉ available khi đủ merchant credentials. Endpoint capability là nguồn sự thật cho frontend. Nếu credential thiếu, UI và API phải fail closed.

Webhook public:

- VNPay: `/api/v1/payments/webhooks/vnpay`
- MoMo: `/api/v1/payments/webhooks/momo`
- ZaloPay: `/api/v1/payments/webhooks/zalopay`

Return page: `/payments/return`.

## Release gate

Mọi release phải qua:

```bash
npm ci
npm run db:generate
npm run db:migrate
npm run format:check
npm run typecheck
npm run docs:generate
npm test
npm run build
npm run test:integration
npm audit --omit=dev --audit-level=high
```

Sau deploy chạy `npm run verify:live`.

Mutation E2E trên staging dùng `VERIFY_ALLOW_MUTATIONS=true npm run verify:staging`. Script tự tạo một customer test, chạy AI Agent checkpoint, approve, tạo CASH booking, kiểm tra persistence rồi hủy booking để trả chỗ. Không chạy mutation E2E trên database bán hàng thật nếu chưa chấp thuận dữ liệu test.

## Backup và rollback

PostgreSQL là source of truth. Backup phải được lưu ngoài instance ứng dụng và restore phải được thử định kỳ. Redis không thay thế backup DB.

Migration là forward only. Giữ release trước để rollback application nếu schema còn tương thích.

## Gate trước nhận tiền thật

Trước khi nhận tiền thật qua gateway cần sandbox pass cho từng provider, kiểm tra callback lặp, sai chữ ký, sai amount, người dùng đóng tab, callback sau timeout, network failure và reconciliation. Merchant portal và credentials phải do chủ tài khoản merchant cung cấp.
