# Requirements Traceability Matrix

Cập nhật: 28/09/2026.

Tài liệu này ánh xạ các yêu cầu đã xuất hiện trong phạm vi SRS được cung cấp trong quá trình phát triển sang code, API và bằng chứng kiểm thử. Project hiện chưa chứa toàn văn SRS hoặc rubric chính thức, vì vậy không tự tạo thêm yêu cầu mà nguồn chưa xác nhận.

| Nhóm yêu cầu           | Hiện thực                                                           | API / UI chính                                           | Bằng chứng                                        |
| ---------------------- | ------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------- |
| Đăng ký tài khoản      | CUSTOMER account, password hash, session, refresh rotation          | POST /auth/register, /login, /refresh, /auth/me          | HTTP, integration, staging mutation E2E           |
| Quên và đổi mật khẩu   | OTP email, challenge hết hạn, revoke refresh sessions               | /auth/forgot-password, /reset-password, /change-password | Unit, HTTP, mail readiness                        |
| Phân quyền             | CUSTOMER, OPERATIONS, ADMIN, backend role checks, IDOR protection   | auth guards, admin routes                                | HTTP boundary, integration                        |
| Quảng bá tour          | Catalog ACTIVE nội địa VN, tìm kiếm, chi tiết tour                  | /tours, /tours/{id}, web /tours                          | Build, browser smoke, live smoke                  |
| Lịch khởi hành         | Ngày đi, giá snapshot source, kho chỗ, OPEN/CLOSED                  | /tours/{id}/schedules, /admin/schedules                  | Integration, admin UI                             |
| Báo giá                | Báo giá từ schedule hiện tại, chưa giữ chỗ                          | POST /bookings/quote                                     | Unit, integration, customer UI                    |
| Đặt tour               | Serializable transaction, row lock, inventory guard                 | POST /bookings                                           | Native integration, staging mutation E2E          |
| Chống đặt trùng        | Idempotency-Key UUID và payload consistency                         | POST /bookings                                           | Integration                                       |
| Giữ chỗ có hạn         | expiresAt, delayed job, sweep, lazy reclaim                         | booking worker / DB                                      | Unit, integration, recovery tests                 |
| Hủy đơn                | Ràng buộc 72 giờ, trả chỗ đúng một lần, admin override có audit     | /bookings/{id}/cancel, /admin/bookings/{id}/cancel       | Unit, integration                                 |
| CASH                   | Tạo payment CASH, AWAITING_CASH, chỉ PAID khi nhân viên ghi receipt | /payments, /admin/payments/{id}/cash-receipt             | Staging mutation E2E, integration                 |
| VNPay                  | Checkout, signature, merchant, amount, idempotent callback          | /payments, /payments/webhooks/vnpay                      | Unit/integration fixtures; sandbox chờ credential |
| MoMo                   | Checkout và webhook verification                                    | /payments, /payments/webhooks/momo                       | Unit/integration fixtures; sandbox chờ credential |
| ZaloPay                | Checkout và callback verification                                   | /payments, /payments/webhooks/zalopay                    | Unit/integration fixtures; sandbox chờ credential |
| Browser return an toàn | Return page đọc trạng thái backend, không tự đánh dấu PAID          | /payments/return                                         | UI review, contract                               |
| Hoàn tiền              | REFUND_REQUIRED và record bằng chứng admin                          | /admin/payments/{id}/refund-record                       | Integration                                       |
| Quản trị tour          | Create, update, status, soft archive                                | /admin/tours                                             | Admin UI, API contract                            |
| Quản trị lịch          | Create, update giá, sức chứa, trạng thái                            | /admin/schedules                                         | Admin UI, API contract                            |
| Quản trị booking       | Danh sách, chi tiết, confirm, complete, cancel                      | /admin/bookings                                          | Admin UI, integration                             |
| Quản trị payment       | Đối soát CASH, refund evidence                                      | /admin/payments                                          | Admin UI, integration                             |
| Audit                  | Log side effects quan trọng                                         | /admin/audit-logs                                        | Integration, ADMIN-only UI                        |
| AI chat                | Trả lời có nguồn, server-side Groq/Gemini hoặc rule fallback        | /assistant/chat                                          | Live GROQ smoke                                   |
| AI Agent               | Lập kế hoạch, constraints, candidate, checkpoint, approve/decline   | /assistant/agent/plans*                                  | Staging mutation E2E                              |
| Human approval         | Side effect chỉ sau explicit checkpoint approval đúng version       | /assistant/agent/plans/{id}/approve                      | Staging mutation E2E, service tests               |
| Avatar                 | Signed upload, complete validation, persistent profile              | /profile/avatar/*                                        | Integration readiness, UI                         |
| Health                 | Liveness, DB/Redis readiness, integration capability                | /health/live, /health/ready, /health/integrations        | Live smoke                                        |
| API contract           | Zod source, generated OpenAPI, required-operation verifier          | docs/openapi.json                                        | docs:generate + verify:contract                   |
| Responsive web         | Public routes Chromium desktop/mobile và Firefox                    | web routes                                               | browser verification                              |
| Secret hygiene         | Server-only secrets, no committed common credential formats         | config + scan script                                     | scan:secrets in CI                                |
| Dependency quality     | Production dependency audit                                         | npm lockfile                                             | npm audit high threshold                          |
| Release quality        | format, typecheck, docs, tests, build, integration, audit           | GitHub Actions                                           | CI                                                |

## Dependencies bên ngoài chưa thể giả lập

Merchant sandbox credential của VNPay, MoMo và ZaloPay phải do nhà cung cấp hoặc tài khoản merchant cấp. Toàn văn SRS và rubric phải do giảng viên hoặc nhóm cung cấp nếu muốn traceability theo từng mã yêu cầu chính thức. Backup restore production và penetration test độc lập là hoạt động vận hành bên ngoài unit test.

## Quy tắc bằng chứng

Một tính năng chỉ được đánh dấu là hoạt động thật khi có ít nhất một bằng chứng chạy phù hợp. Fixture xác minh chữ ký gateway không được gọi là merchant sandbox certification. UI hiển thị readiness không thay thế backend authorization.
