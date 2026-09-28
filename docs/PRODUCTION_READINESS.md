# Production Readiness

Cập nhật: 28/09/2026.

## Đã đạt

- Frontend Next.js và backend NestJS build production thành công.
- PostgreSQL migrations và Redis integration chạy trong CI native.
- Auth, RBAC, refresh rotation, CSRF boundary và IDOR protection có test.
- Booking transaction, inventory locking, idempotency, timeout reclaim và cancellation có test.
- AI Agent dùng human approval checkpoint trước action có side effect.
- Groq provider đang live, deterministic fallback vẫn có.
- Resend readiness và Supabase avatar storage readiness đang live.
- CASH payment hoạt động theo trạng thái `AWAITING_CASH`, không giả thành PAID.
- VNPay, MoMo và ZaloPay fail closed khi chưa cấu hình.
- Full quality gate PASS.
- Render deploy PASS.
- Public live smoke PASS.

## Tự động hóa kiểm thử

`npm run verify:live` là smoke test read only cho public deployment.

`VERIFY_ALLOW_MUTATIONS=true npm run verify:staging` là mutation E2E dành cho staging. Nó kiểm tra register, auth/me, catalog, schedule, AI Agent plan, explicit approval, booking, CASH payment, persistence và cancellation cleanup.

## Còn phụ thuộc bên ngoài

### Merchant sandbox

Cần credential thật do VNPay, MoMo và ZaloPay cấp. Không thể và không nên tự sinh credential. Sau khi có credential, cấu hình trên backend và chạy payment sandbox matrix.

### SRS và rubric đầy đủ

Project hiện không chứa toàn văn SRS hoặc rubric chính thức. Vì vậy chỉ có thể đối chiếu các yêu cầu đã được cung cấp trước đó. Nếu giảng viên có file chính thức, cần đưa file đó vào Project để chạy traceability review cuối.

### Production operations

Backup restore drill, external penetration test và domain merchant production là hoạt động vận hành bên ngoài codebase. Chúng không thể được chứng minh chỉ bằng unit test.

## Definition of Done kỹ thuật

Một release được coi là đạt kỹ thuật khi CI xanh, deploy xanh, live smoke xanh, không có secret trong Git, payment unavailable được báo trung thực và mọi action tạo booking hoặc payment của AI đều yêu cầu explicit approval.
