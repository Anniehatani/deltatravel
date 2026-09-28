# Security Checklist

Cập nhật: 28/09/2026.

| Kiểm soát                 | Trạng thái       | Ghi chú                                                    |
| ------------------------- | ---------------- | ---------------------------------------------------------- |
| Password hashing          | PASS             | scrypt + salt                                              |
| Access JWT ngắn hạn       | PASS             | 15 phút                                                    |
| Refresh rotation          | PASS             | hash token, family revoke khi replay                       |
| HttpOnly refresh cookie   | PASS             | client JavaScript không đọc token                          |
| CSRF boundary             | PASS             | Origin + X-CSRF-Protection ở mutation nhạy cảm             |
| RBAC                      | PASS             | role lấy từ DB, ADMIN/OPERATIONS tách quyền                |
| IDOR                      | PASS             | customer không đọc booking/payment người khác              |
| Input validation          | PASS             | shared Zod + DB constraints                                |
| SQL injection surface     | PASS by design   | Prisma parameterization, raw SQL có review                 |
| Booking race              | PASS             | Serializable + schedule lock + retry                       |
| Idempotency               | PASS             | booking create và payment callback                         |
| Payment signature         | PASS in fixtures | VNPay/MoMo/ZaloPay verification                            |
| Provider fail closed      | PASS             | thiếu merchant credential => unavailable                   |
| Secret exposure           | PASS             | secret scan + server-only env                              |
| Frontend security headers | PASS             | nosniff, frame deny, referrer policy, permissions policy   |
| Backend headers           | PASS             | Helmet                                                     |
| CORS                      | PASS             | allowlist từ WEB_ORIGIN/WEB_ORIGINS                        |
| Rate limiting             | PASS             | global + endpoint throttles                                |
| Audit trail               | PASS             | booking/payment/admin side effects                         |
| Error envelope            | PASS             | request ID, không trả stack trace client                   |
| Dependency audit          | PASS gate        | npm audit production high threshold                        |
| Avatar upload controls    | PASS             | MIME allowlist, 2 MiB, signed upload                       |
| Public health privacy     | PASS             | readiness chỉ trả boolean/provider names, không trả secret |

## Những việc không nên làm

Không commit .env. Không đưa key vào NEXT_PUBLIC. Không bật gateway nếu chỉ có một phần credential. Không cho browser return tự đổi trạng thái thanh toán. Không bỏ RBAC để demo nhanh. Không gọi dữ liệu fixture là giao dịch merchant thật.

## Gate trước tiền thật

Merchant sandbox phải pass. Callback URL phải HTTPS công khai. Backup restore cần được diễn tập. Cần rà dependency advisory tại thời điểm release và thực hiện security review độc lập nếu hệ thống trở thành dịch vụ thật.
