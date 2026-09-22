# Việt Hành: Tour Booking Monorepo

Khung đồ án **Website Quảng bá và Đặt Tour Du lịch Trực tuyến**, chỉ tour nội địa Việt Nam. Căn cứ phần SRS-TOUR-2026-v1.0 được cung cấp trong yêu cầu. Chưa được đối chiếu với toàn văn tài liệu SRS gốc hoặc rubric chấm điểm của giảng viên.

Đây là backend đã triển khai các luồng cốt lõi kèm frontend skeleton để An tiếp tục. Không phải lời cam kết hệ thống đã nghiệm thu production hoặc chắc chắn được 10 điểm. Đọc `docs/VERIFICATION.md` để biết đúng phần đã chạy kiểm tra.

## 1. Chạy lần đầu

Cài Node.js 22 LTS, npm đi kèm, Git và Docker Desktop có Docker Compose. Mở terminal tại thư mục `tour-booking`, không mở riêng `apps/web` khi cài dependencies.

```bash
npm ci
npm run setup
docker compose up -d --wait
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

`setup` tự tạo `.env` và mật khẩu admin ngẫu nhiên, giữ nguyên file nếu đã tồn tại. Đọc `SEED_ADMIN_EMAIL` và `SEED_ADMIN_PASSWORD` trong `apps/api/.env` để đăng nhập admin. Seed chỉ chạy local/test, không chạy production. Không gửi `.env` vào nhóm chat hoặc commit lên Git.

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1
- API health: http://localhost:4000/api/v1/health/ready
- Swagger Editor/Postman: import `docs/openapi.json`.
- 3 tour và 3 lịch khởi hành mẫu được tạo, không phải tour bán thật.
- Frontend `/tours`, `/checkout`, `/bookings`, `/admin` đang là trang khung theo yêu cầu. `/login`, `/register`, `/assistant` và `/payments/return` có logic cơ bản để tham khảo.

Nếu thay shared schemas lúc dev, chạy lại `npm run build -w @tour/shared`, rồi refresh web hoặc khởi động lại `npm run dev` nếu cần. Shared không tự watch trong bản skeleton này.

## 2. Cấu trúc và trách nhiệm

```text
tour-booking/
  apps/
    api/
      prisma/                 schema, SQL migrations, seed
      src/
        auth/                 đăng nhập, JWT, refresh rotation, phân quyền
        tours/                tour ACTIVE
        schedules/            lịch và kho chỗ
        bookings/             đặt, hủy, trạng thái, timeout/outbox
        payments/             ba cổng thanh toán và webhook
        admin/                vận hành, audit, đối soát
        assistant/            trợ lý có quyền hạn và nguồn dữ liệu
        common/               response, errors, validation, env
        database/             Prisma + transaction retry
        cache/                Redis
      test/                   unit, HTTP, integration
    web/
      src/app/                Next.js App Router
      src/components/         layout, auth forms, Shadcn button
      src/lib/api.ts          API client có runtime validation
      src/providers/          auth state trong bộ nhớ
      src/hooks/              polling availability
  packages/
    shared/src/index.ts       enums, DTOs, Zod schemas, pure rules
    config/                   TypeScript strict
  docs/                       contract, ERD, decisions, runbook, QA
  scripts/                    setup và sinh API Contract/OpenAPI
  .github/workflows/          CI và publish image theo yêu cầu thủ công
  docker-compose.yml          PostgreSQL + Redis local
```

| Thành viên   | Sở hữu chính                                        | Cần review chung                           |
| ------------ | --------------------------------------------------- | ------------------------------------------ |
| Mạnh, Leader | `apps/api/src`, `docs/API_CONTRACT.md`, integration | shared schemas, Prisma migrations, bảo mật |
| Hồng Thắm    | `apps/api/prisma`, `docs/DATABASE_SCHEMA.md`        | thay đổi Entity/DTO và ràng buộc SQL       |
| Lê Văn An    | `apps/web`                                          | thay đổi API client hoặc shared contract   |
| Lê Hải Đăng  | test matrix, integration, hồi quy                   | SRS acceptance và bug reports              |
| Nguyễn Phúc  | Docker, CI, release, backup/restore                 | secrets, môi trường staging, rollback      |

Phân chia Đăng/Phúc là gợi ý triển khai trong nhóm Testing + Deploy mà leader có thể đổi. An dùng Antigravity theo `docs/ANTIGRAVITY_HANDOFF.md`, không tự sửa database/backend để khớp UI.

## 3. Phần đã có trong code

- Auth thật: password scrypt có salt, access JWT 15 phút, refresh token random lưu hash, rotation, revoke cả family khi phát hiện reuse; cookie HttpOnly.
- Phân quyền backend và chống IDOR. Vai trò được đọc từ DB cho mỗi request, không tin role client gửi.
- Tạo đơn trong transaction Serializable, khóa row lịch khởi hành, ghi giá snapshot, key chống tạo trùng, kiểm tra kho chỗ dưới khóa.
- Deadline 900000 ms, BullMQ delayed job, outbox dựa trên booking, sweep dự phòng và thu hồi quá hạn khi đọc/tạo đơn. Không gia hạn khi retry.
- Hủy đơn trả chỗ đúng một lần; ràng buộc >=72 giờ cho khách; admin không giảm sức chứa dưới chỗ đã giữ/đặt.
- VNPay, MoMo, ZaloPay: tạo checkout, xác minh callback, kiểm tra amount/merchant/reference, callback idempotent. Không có endpoint giả đánh dấu đã thanh toán cho client.
- Hoàn tiền: tự đánh dấu `REFUND_REQUIRED`; admin ghi bằng chứng sau khi hoàn tiền ngoài hệ thống. Chưa tự động gọi refund API.
- Redis cache thống kê, health check, rate limit theo process, exception filter, request ID và audit log.
- Trợ lý truy xuất tour, số chỗ, đơn của chính người dùng, chính sách và thống kê theo quyền. Gemini là tùy chọn; không có key dùng chế độ rule-based được ghi rõ trên UI.

## 4. Thử luồng backend trước khi An hoàn thiện UI

1. Dùng Postman import `docs/openapi.json`.
2. Đăng ký khách bằng `POST /auth/register`, gửi `Origin: http://localhost:3000` và `X-CSRF-Protection: 1`.
3. Lấy access token từ `data.accessToken`, dùng Bearer cho request cần đăng nhập.
4. Lấy tour rồi lịch khởi hành qua `/tours`, `/tours/{id}/schedules`.
5. Gửi `/bookings/quote`, sau đó `/bookings` với cùng cấu hình số người và một `Idempotency-Key` UUID.
6. Kiểm tra `expiresAt`, gửi lại request cùng key để chứng minh chỉ có một đơn.
7. Cấu hình merchant sandbox rồi gọi `/payments`; mở `checkoutUrl`.
8. Chờ webhook và kiểm tra `/bookings/{id}`. Browser redirect không tự đổi PAID.
9. Dùng admin xác nhận đơn, hoặc thử hủy hợp lệ và quan sát chỗ được trả.

Chưa có credential sandbox thì các đơn mất tiền trả `503 PROVIDER_NOT_CONFIGURED`. Đây là hành vi có chủ ý, không coi là thanh toán thành công. Unit/integration có fixture để kiểm tra backend, không đưa fixture giả vào môi trường bán tour.

## 5. Các lệnh dùng hằng ngày

```bash
npm run typecheck
npm test
npm run build
npm run docs:generate
npm run format
npm run format:check
```

Integration cần DB riêng có tên `tour_booking_test`. Không dùng DB dữ liệu thật. CI tự tạo DB này và chạy migrations. Xem `docs/TEST_PLAN.md` để chạy local Windows/Linux/macOS.

## 6. Những phần phải hoàn thiện trước nghiệm thu

1. An xây giao diện các trang khung và nối API theo contract, gồm loading/error/empty states.
2. Nhóm xác nhận các cách hiểu trong `docs/DECISIONS.md` với toàn văn SRS và rubric.
3. Đăng/Phúc chạy CI trên PostgreSQL/Redis native, sandbox ba cổng, kiểm thử trên hai trình duyệt và mobile.
4. Bổ sung nghiệp vụ chưa có trong phần SRS trích dẫn nếu giảng viên yêu cầu: email verification, quên mật khẩu, quản lý thông tin hành khách theo từng người, chính sách phí/hoàn tiền, báo cáo doanh thu, lịch trình chi tiết, ảnh tour.
5. Chọn host, tên miền và merchant thật; chạy các gate trong `docs/DEPLOYMENT.md`.

Mục tiêu điểm cao cần bằng chứng test, mô hình dữ liệu, giải thích được transaction và demo đúng các tình huống biên. Không thêm chức năng tùy ý khiến nhóm không thể giải thích khi bảo vệ.
