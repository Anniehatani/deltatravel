# Báo cáo kiểm chứng bộ bàn giao

Ngày: 16/09/2026. Phạm vi: mã nguồn skeleton và phần SRS được cung cấp trong hội thoại. Không phải chứng nhận production hoặc chứng nhận sandbox của nhà cung cấp thanh toán.

## Đã kiểm tra

| Hạng mục                                      | Kết quả                                           | Phạm vi chứng minh                                                                        |
| --------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Cài sạch bằng npm ci                          | PASS                                              | Lockfile cài được trong môi trường kiểm tra                                               |
| Prisma generate 6.19.3                        | PASS                                              | Model/schema sinh được Prisma Client                                                      |
| TypeScript shared, API, web                   | PASS                                              | Type checking strict; web tự sinh route types bằng next typegen                           |
| NestJS compilation                            | PASS                                              | Backend biên dịch được                                                                    |
| Next.js 15.5.25 production build              | PASS                                              | Các route App Router biên dịch và tạo được build output                                   |
| API Contract / OpenAPI                        | PASS                                              | 37 operations; mọi ví dụ JSON chuẩn được shared Zod kiểm tra khi sinh                     |
| Unit, HTTP boundary, timeout, assistant tests | 39 PASS                                           | Quy tắc giá/thời gian, chữ ký, password, auth boundary, outbox recovery, quyền trợ lý     |
| Prisma + PostgreSQL WASM nghiệp vụ            | 17 PASS                                           | SQL migrations/CHECK, trạng thái, idempotency, snapshots, hủy, callback, refresh rotation |
| npm audit --omit=dev                          | 0 vulnerabilities được báo tại thời điểm kiểm tra | Snapshot dependency advisory, không chứng minh hệ thống không có lỗ hổng                  |

Môi trường thực hiện: Node.js 24.19.0, npm 11.9.0. Dự án hướng dẫn Node.js 22 LTS và CI cấu hình Node.js 22; CI chưa chạy trên GitHub trong phiên này.

## Giới hạn cần hiểu chính xác

- Kiểm tra database tại đây dùng PGlite qua PostgreSQL wire protocol, một kết nối. Các request Promise.all vẫn được tuần tự hóa qua kết nối này. Kết quả **không chứng minh** tính đúng đắn dưới nhiều kết nối PostgreSQL native đồng thời.
- File `test/integration/runtime.test.ts` yêu cầu PostgreSQL và Redis native. Bài smoke test runtime này được bỏ qua ở môi trường WASM; CI sẽ chạy khi REDIS_URL được cung cấp.
- Chưa chạy Docker Compose, Docker image hoặc workflow GitHub Actions thực tế vì môi trường không có Docker daemon và chưa có repository của nhóm.
- Chưa chạy giao dịch merchant sandbox/live VNPay, MoMo, ZaloPay. Các tests chữ ký và callback dùng fixture. Phải kiểm thử với merchant thật trước khi nghiệm thu thanh toán.
- Chưa gọi Gemini live vì không có API key/model của nhóm. Đã kiểm tra chế độ rule-based và quyền truy cập dữ liệu.
- Chưa có E2E UI trọn tám bước, vì các trang đặt tour/admin là skeleton bàn giao cho An hoàn thiện.
- Chưa thực hiện load test, kiểm thử tấn công độc lập, hoặc diễn tập backup/restore trên host triển khai.

## Dependency pinning

Giữ Next.js 15 theo yêu cầu. Lockfile có overrides cho `multer`, `postcss`, `effect`, `deepmerge-ts` để dùng phiên bản đã xử lý các advisory phát hiện trong lượt kiểm tra. Đây là các pin có chủ ý; không tự xóa chúng khi giải quyết conflict. Cài sạch, Prisma generate, tests và build đã được dùng để kiểm tra khả năng tương thích trong phạm vi skeleton. Khi nâng version, chạy lại CI và kiểm tra advisory tại thời điểm release.

## Điều kiện còn lại trước nghiệm thu

Đăng/Phúc chạy toàn bộ CI trên PostgreSQL/Redis native, đặc biệt chỗ cuối cùng, webhook/hủy đồng thời và restart worker. Leader và Thắm đối chiếu DECISIONS.md với toàn văn SRS. An hoàn thiện UI theo contract. Nhóm chạy sandbox ba cổng, kiểm thử quyền trên UI và API, xác nhận chính sách hoàn tiền rồi mới triển khai public.

Các bài đã pass là bằng chứng kỹ thuật cụ thể, không phải bảo đảm đạt 10 điểm. Rubric, độ hoàn thiện UI, tài liệu và khả năng giải thích của từng thành viên vẫn quyết định kết quả bảo vệ.
