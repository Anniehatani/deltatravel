# Bàn giao cho Lê Văn An và Antigravity

## Prompt có thể dán vào Antigravity

> Tôi phụ trách toàn bộ frontend của monorepo tour-booking. Chỉ sửa apps/web. Đọc docs/API_CONTRACT.md, docs/openapi.json, packages/shared/src/index.ts và docs/DECISIONS.md trước khi code. Stack bắt buộc Next.js 15 App Router, TypeScript strict, Tailwind CSS, Shadcn/UI. Dùng schema và DTO từ @tour/shared, API qua src/lib/api.ts. Không tự tạo mock endpoint để che API lỗi, không import Prisma và không sửa backend/schema/shared/lockfile nếu chưa có PR được leader review. Chỉ tour nội địa VN, chỉ người lớn và trẻ em. Xây từng trang theo contract, đầy đủ loading/error/empty/success, accessibility, responsive. Giá và số chỗ cuối cùng do backend quyết định. Không dùng localStorage cho token. Mỗi tác vụ đặt tour cần một Idempotency-Key giữ nguyên khi retry. Countdown dựa trên expiresAt và serverTime. Payment return phải gọi backend xác nhận, không dựa trên query string. Chatbot không được bỏ qua xác nhận đặt, hủy, thanh toán. Sau mỗi phần, chạy typecheck/build và báo thay đổi cụ thể cùng phần chưa hoàn thành.

## Route đã chốt

| Route web                | Việc An cần làm                              | API                                                |
| ------------------------ | -------------------------------------------- | -------------------------------------------------- |
| `/`                      | Landing, nội dung thương hiệu, CTA           | GET /tours                                         |
| `/tours`                 | Tìm kiếm, phân trang, thẻ tour               | GET /tours                                         |
| `/tours/[id]`            | Mô tả, lịch, số người, giá                   | GET /tours/:id và /schedules, POST /bookings/quote |
| `/checkout/[scheduleId]` | Liên hệ, xác nhận quote, giữ chỗ             | POST /bookings                                     |
| `/login`, `/register`    | Hoàn thiện UX form đang có                   | Auth API                                           |
| `/bookings`              | Danh sách đơn riêng                          | GET /bookings                                      |
| `/bookings/[id]`         | Countdown, chọn cổng, hủy có xác nhận        | Booking/Payment API                                |
| `/payments/return`       | Hoàn thiện trang kiểm tra trạng thái đang có | GET /bookings/:id                                  |
| `/assistant`             | Hoàn thiện chat và lưu history tối đa 8 lượt | POST /assistant/chat                               |
| `/admin`                 | Dashboard                                    | GET /admin/summary                                 |
| `/admin/tours`           | Tour CRUD/soft-delete                        | Admin Tours                                        |
| `/admin/schedules`       | Giá/chỗ/lịch                                 | Admin Schedules                                    |
| `/admin/bookings`        | Xác nhận/hoàn thành/hủy                      | Admin Bookings                                     |
| `/admin/payments`        | Đối soát, pending refund                     | Admin Payments                                     |
| `/admin/audit-logs`      | Nhật ký, chỉ ADMIN                           | GET /admin/audit-logs                              |

Route group `(auth)`, `(account)`, `(public)` không xuất hiện trong URL. Backend đã kiểm tra quyền; RequireAuth frontend chỉ hỗ trợ UX. Server Components không đọc access token trong bộ nhớ trình duyệt. Dùng client component cho dữ liệu cá nhân trong skeleton hiện tại; nếu chuyển BFF/SSR auth phải thiết kế lại riêng.

## Công thức và UX bắt buộc

`2 × 3.990.000 + 1 × 2.490.000 = 10.470.000 VND`. `Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'})` chỉ để hiển thị. Không ghi ngược giá UI vào backend.

- Availability hook poll mỗi 3s. Khi API lỗi, hiển thị “Chưa kiểm tra được chỗ”; không dùng cached value để hứa giữ chỗ.
- Sau create, chuyển sang `/bookings/{id}`. Thời gian 15 phút không bắt đầu lại khi chuyển trang.
- Nếu request create mất mạng, giữ cùng payload và key, thử lại. Nếu sửa số người/lịch, tạo key mới.
- Tính countdown: lấy mốc serverTime, elapsed bằng monotonic clock khi có thể; không đổi expiresAt.
- Nút hủy chỉ hiển thị khi điều kiện phù hợp, nhưng vẫn xử lý 409 từ server khi thời gian/trạng thái đổi.
- Admin giảm chỗ nhận CAPACITY_BELOW_RESERVED: hiển thị lỗi ngay bên trường totalSeats.
- Cổng chưa cấu hình: báo chưa khả dụng, không tạo màn hình “thành công” giả.
- Không render HTML từ chatbot hoặc description bằng dangerouslySetInnerHTML.

## Thứ tự triển khai đề xuất

1. Tour list/detail + skeleton/loading/empty.
2. Quote -> tạo đơn -> chi tiết đơn/countdown.
3. Thanh toán/return/poll/hủy.
4. Admin tour/schedule/booking/payment.
5. Trợ lý, mobile, accessibility và kiểm thử người dùng.

Mỗi trang một PR nhỏ. Nếu cần hình tour, ghi nguồn/quyền sử dụng và alt text. Frontend chưa có ảnh hoặc lịch trình chi tiết vì không có dữ liệu thật trong yêu cầu.
