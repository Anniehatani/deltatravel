# Báo cáo kiểm chứng

Cập nhật: 28/09/2026.

## Bằng chứng đã chạy

| Hạng mục                                | Kết quả        | Ghi chú                                                          |
| --------------------------------------- | -------------- | ---------------------------------------------------------------- |
| npm ci                                  | PASS           | cài sạch bằng lockfile                                           |
| Prisma generate + migrate               | PASS           | PostgreSQL native trong GitHub Actions                           |
| format:check                            | PASS           | Prettier                                                         |
| TypeScript strict                       | PASS           | shared, API, web                                                 |
| docs:generate                           | PASS           | contract và OpenAPI sinh được                                    |
| unit tests                              | PASS           | backend business rules và boundaries                             |
| production build                        | PASS           | NestJS + Next.js                                                 |
| integration tests                       | PASS           | PostgreSQL 16 + Redis service                                    |
| npm audit --omit=dev --audit-level=high | PASS           | không có advisory mức high trở lên tại lượt release              |
| Render web deploy                       | PASS           | service live                                                     |
| Render API deploy                       | PASS           | service live                                                     |
| public web smoke                        | PASS           | /, /assistant, /tours                                            |
| API readiness                           | PASS           | PostgreSQL + Redis reachable                                     |
| AI provider                             | PASS           | GROQ configured, fallback available                              |
| AI chat                                 | PASS           | live response mode GROQ, có sources                              |
| mail integration                        | PASS readiness | RESEND configured                                                |
| avatar integration                      | PASS readiness | Supabase storage configured                                      |
| payment capability                      | PASS           | CASH available, wallet gateways fail closed khi thiếu credential |

Full CI đã được chạy trên release tree trước khi merge vào upstream. Release tree trên upstream `main` và tree đã deploy trên Render là cùng nội dung source.

## Bằng chứng live gần nhất

`npm run verify:live` kiểm tra:

1. Web trả HTML hợp lệ tại trang chủ, AI Agent và danh sách tour.
2. `/health/ready` trả `status=ok`.
3. `/assistant/provider-status` báo provider thực tế.
4. `/health/integrations` báo trạng thái AI, mail, avatar và payment.
5. `/payments/providers/status` phải có CASH available.
6. `/assistant/chat` phải trả response đúng shape và sources.

## Những gì CI chứng minh

CI chứng minh build, type safety, migrations, unit tests, integration tests và dependency audit trong môi trường kiểm soát. Nó không thay thế merchant certification, penetration test độc lập hoặc SLA production.

## Staging mutation E2E đã chạy

Lượt kiểm chứng ngày 28/09/2026 đã tạo một customer tổng hợp, chọn lịch Hạ Long còn chỗ, tạo AI Agent plan ở mode GROQ, dừng tại trạng thái `READY_FOR_APPROVAL`, approve checkpoint, tạo booking và CASH payment, xác nhận booking persisted ở `AWAITING_CASH`, sau đó hủy booking để trả chỗ. Luồng direct booking riêng cũng được tạo và hủy cleanup thành công.

Browser smoke cũng đã chạy thành công trên Chromium desktop, Chromium mobile 390x844 và Firefox desktop cho năm route công khai chính. Không phát hiện page error trong lượt chạy đó.

## Phần cần credential hoặc quyền bên ngoài

VNPay, MoMo và ZaloPay chưa thể chạy giao dịch sandbox thật nếu chưa có merchant credentials do nhà cung cấp cấp. Đây là dependency bên ngoài duy nhất đang chặn full payment E2E của ba gateway.

Toàn văn SRS và rubric chính thức chưa có trong Project, nên chưa thể tuyên bố đã đối chiếu 100 phần trăm mọi tiêu chí ngoài phạm vi SRS đã được cung cấp.
