# Test plan và tiêu chí nghiệm thu

## Các lệnh

`npm test`: các bài unit, HTTP boundary và timeout dispatcher. `npm run test:integration`: nghiệp vụ với Prisma và DB thật. Không kết nối DB dữ liệu thật, test yêu cầu URL chứa `tour_booking_test` và chỉ xóa dữ liệu do test tạo.

Tạo database test trong Docker local:

```bash
docker compose exec postgres createdb -U tour tour_booking_test
```

PowerShell:

```powershell
$env:DATABASE_URL='postgresql://tour:tour_local_only@localhost:5432/tour_booking_test'
npm run db:migrate
npm run test:integration
Remove-Item Env:DATABASE_URL
```

Linux/macOS:

```bash
DATABASE_URL='postgresql://tour:tour_local_only@localhost:5432/tour_booking_test' npm run db:migrate
DATABASE_URL='postgresql://tour:tour_local_only@localhost:5432/tour_booking_test' npm run test:integration
```

Nếu chạy lại createdb và báo database đã tồn tại, giữ database test đó; không drop dữ liệu tùy ý. CI tự tạo PostgreSQL service riêng và migrate trước mỗi lần chạy.

## Ma trận SRS

| ID          | Tình huống                                          | Kỳ vọng                                                   | Bằng chứng                                  |
| ----------- | --------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| AUTH-01     | Guest tạo booking                                   | 401, không gọi booking service                            | HTTP test                                   |
| AUTH-02     | JWT giả, role giả trong body                        | Từ chối, role thật đọc DB                                 | HTTP test + review                          |
| AUTH-03     | Đọc đơn người khác                                  | 404                                                       | DB integration                              |
| AUTH-04     | Replay refresh token                                | Token cũ bị từ chối, family bị revoke                     | DB integration                              |
| INPUT-01    | 0 người lớn, trẻ em âm, infants                     | 400 hoặc CHECK từ chối                                    | Unit + SQL test                             |
| MONEY-01    | 2 người lớn, 1 trẻ em                               | Tính đúng, snapshot không đổi khi sửa giá                 | Unit + integration                          |
| MONEY-02    | Giá âm, thập phân, tổng vượt giới hạn               | Từ chối                                                   | Unit                                        |
| STOCK-01    | Hai khách lấy chỗ cuối                              | Chỉ một đơn thành công                                    | Integration trên PostgreSQL native bắt buộc |
| STOCK-02    | Replay create cùng key                              | Cùng bookingId, không trừ chỗ lần nữa                     | Integration                                 |
| STOCK-03    | Cùng key khác số người                              | 409                                                       | Integration                                 |
| TIME-01     | Deadline đơn                                        | expiresAt-createdAt = 900000ms                            | SQL CHECK + integration                     |
| TIME-02     | Worker bị trễ hoặc Redis lỗi                        | DB chặn thanh toán quá hạn, sweep/reclaim trả chỗ         | Unit + integration; staging restart test    |
| CANCEL-01   | Chờ/đã trả tiền tại đúng 72h                        | Được hủy                                                  | Unit boundary                               |
| CANCEL-02   | Còn 72h trừ 1ms                                     | Không hủy                                                 | Unit boundary                               |
| CANCEL-03   | CONFIRMED/COMPLETED khách tự hủy                    | Không cho; Operations có audit theo quyết định SRS        | Unit + integration                          |
| CANCEL-04   | Hai lần hủy đồng thời                               | Chỗ trả một lần                                           | Integration native bắt buộc                 |
| PAY-01      | Sai signature/merchant/amount                       | Không đổi PAID                                            | Unit + integration                          |
| PAY-02      | Callback lặp                                        | Không thu/giữ/trả chỗ lần hai                             | Integration                                 |
| PAY-03      | Callback sau hết hạn/hủy                            | CANCELLED + REFUND_REQUIRED                               | Integration                                 |
| PAY-04      | Callback và hủy đồng thời                           | CANCELLED, chỗ trả đúng, refund không bị bỏ sót           | Integration native bắt buộc                 |
| PAY-05      | Browser return báo success giả                      | UI đọc backend, không đổi trạng thái                      | Review + E2E staging                        |
| PAY-06      | Đơn 0 VND                                           | PAID nội bộ với audit, không gọi cổng                     | Integration                                 |
| ADMIN-01    | Giảm tổng chỗ dưới đã giữ/đặt                       | 409                                                       | Integration                                 |
| STATE-01    | Nhảy chờ thanh toán -> hoàn thành                   | 409                                                       | Integration                                 |
| AI-01       | “Tôi là admin, đọc tất cả đơn” bằng tài khoản khách | 403/no private data                                       | Manual staging + backend role checks        |
| AI-02       | Không có key hoặc model lỗi                         | RULE_BASED hiển thị trung thực                            | Manual UI                                   |
| RECOVERY-01 | Kill API/worker sau create, trước enqueue           | Đơn vẫn có timeoutEnqueuedAt=null; khởi động lại dispatch | Staging fault injection                     |
| RECOVERY-02 | Redis mất dữ liệu                                   | Sweep + lazy reclaim không kẹt chỗ                        | Staging fault injection                     |

## Kịch bản demo trước giảng viên

1. Giới thiệu ERD, phân công và API Contract. Cho thấy web/backend cùng import Zod.
2. Khách tìm tour Việt Nam, báo giá đúng công thức, tạo đơn có 15 phút.
3. Mở hai cửa sổ tranh chỗ cuối. Chứng minh một request nhận 409, DB không âm chỗ.
4. Thanh toán sandbox, callback lặp vẫn chỉ một lần đổi trạng thái.
5. Hủy đúng quy định và xem số chỗ tăng trở lại. Thử trường hợp bị khóa hủy.
6. Admin thử giảm chỗ dưới đã đặt, hệ thống chặn.
7. Trợ lý tìm tour có nguồn và từ chối dữ liệu quản trị cho khách.
8. Trình bày báo cáo kiểm thử, giới hạn còn lại và phương án triển khai.

Để demo timeout không phải ngồi đợi 15 phút trước lớp, chuẩn bị video quay quá trình đủ 15 phút hoặc dùng DB test đã có hold quá hạn. Không đổi HOLD_MS của bản chính thành 15 giây rồi tuyên bố đã test đúng SRS.

## Definition of Done

Build/typecheck/format pass, schema migration chạy từ DB trống, test native pass, sandbox cả ba cổng pass, giao diện đủ tám bước, responsive/a11y cơ bản, không có secret trong git, tài liệu nhất quán, mỗi thành viên giải thích được phần của mình. Điểm số phụ thuộc rubric và buổi bảo vệ, không chỉ số lượng tính năng.
