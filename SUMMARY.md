# DELTA TRAVEL PLATFORM

Delta Travel là website quảng bá và đặt tour nội địa Việt Nam với frontend Next.js, backend NestJS, Prisma, PostgreSQL, Redis và AI Agent.

## Năng lực chính

- Duyệt tour, lịch khởi hành, giá và số chỗ từ backend thật.
- Đăng ký, đăng nhập, refresh session, quên mật khẩu qua email.
- Booking có transaction, inventory lock, idempotency, timeout và cancellation.
- Thanh toán CASH và contract cho VNPay, MoMo, ZaloPay.
- AI chat dùng Groq khi configured và fallback minh bạch khi provider lỗi.
- AI Agent có plan, constraints, candidate schedules, payment capability và explicit approval checkpoint trước khi tạo booking/payment.
- Avatar persistent qua Supabase Storage.
- Admin quản lý tour, lịch, booking, payment, audit và integration readiness.
- Song ngữ VI/EN ở frontend.
- CI gồm format, typecheck, docs generation, unit test, build, integration test và audit.

## Trạng thái production readiness

Frontend và API đã deploy lên Render và live smoke đã PASS. Groq, Resend, Supabase avatar và CASH đang available.

VNPay, MoMo và ZaloPay chưa được bật vì chưa có merchant credentials thật trên server. Hệ thống cố ý báo unavailable thay vì mô phỏng thanh toán.

Không lưu API key, mật khẩu admin mặc định hoặc PIN quản trị trong tài liệu. Secret chỉ được cấu hình ở môi trường server.

Xem `docs/VERIFICATION.md`, `docs/PRODUCTION_READINESS.md` và `docs/TEST_PLAN.md` cho bằng chứng và acceptance matrix.
