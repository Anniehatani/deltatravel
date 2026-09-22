# Quy ước phát triển

## Đặt tên

- TypeScript strict, PascalCase cho class/type/schema, camelCase cho field/function, kebab-case cho file.
- Enum wire/database UPPER_SNAKE_CASE tiếng Anh; nhãn UI tiếng Việt lấy từ shared.
- API `/api/v1`, tài nguyên số nhiều, JSON camelCase, UUID cho ID.
- Không import Prisma ở web/shared. Không nhân bản interface riêng ở frontend.
- Controller: validate, identity, gọi service. Service: nghiệp vụ và transaction. DTO: chỉ field public.
- Comment giải thích lý do khóa, retry, security boundary; tránh diễn giải từng dòng hiển nhiên.

| Enum chính thức | Nhãn SRS       |
| --------------- | -------------- |
| PENDING_PAYMENT | CHỜ THANH TOÁN |
| PAID            | ĐÃ THANH TOÁN  |
| CONFIRMED       | ĐÃ XÁC NHẬN    |
| COMPLETED       | HOÀN THÀNH     |
| CANCELLED       | ĐÃ HỦY         |

Không đổi thành PENDING, SUCCESS, CANCELED hoặc tiếng Việt trong payload. Status thanh toán là enum riêng, không dùng chung BookingStatus.

## Git

`main` là bản chạy ổn định, bật branch protection và CI required sau khi tạo repository. Mỗi người làm branch ngắn từ main: `feat/auth-refresh`, `feat/web-tour-list`, `feat/db-schedule`, `test/booking-races`, `chore/ci`. Không force push main. PR nhỏ, một mục tiêu rõ, nêu vấn đề, thay đổi và bằng chứng kiểm tra.

Commit theo Conventional Commits: `feat(bookings): reserve seats atomically`, `fix(payments): reject amount mismatch`, `docs(api): add cancellation examples`, `test(inventory): cover concurrent last-seat requests`.

## Quyền sở hữu file

1. An sửa `apps/web/**`. Đọc shared và docs. Đề xuất thay contract bằng PR riêng, leader review trước khi merge.
2. Thắm sửa schema, migrations và ERD. Mỗi migration mới có tên rõ, không sửa migration đã chạy ở staging.
3. Mạnh sở hữu transaction, auth, payments và shared API. Các thay đổi schema cần Thắm review.
4. Đăng/Phúc sở hữu test, CI, Docker, deployment docs. Không tắt test/security gate để merge cho nhanh.
5. `package-lock.json`, `packages/shared`, `scripts/contract-manifest.mjs` và file môi trường mẫu cần leader review để tránh conflict.

## Đổi API có kiểm soát

Sửa Zod schema dùng chung -> service/controller -> cập nhật manifest + ví dụ -> `npm run docs:generate` -> cập nhật frontend -> kiểm thử -> cùng PR. Nếu đổi phá vỡ client đã phát hành, tạo API version mới. Đồ án trước khi phát hành vẫn cần thống nhất nhóm trước khi sửa contract.

Không thêm số tiền từ client, tự set PAID, bỏ validation, thêm infant, đổi timeout hoặc tính 72 giờ bằng số ngày lịch. Thay nghiệp vụ phải có quyết định ghi vào DECISIONS.md và căn cứ SRS.

## Bảo mật và lỗi

Không log password, cookie, token, secret gateway, toàn bộ thông tin liên hệ hoặc raw callback. Log requestId để tra lỗi. Xác minh quyền tại backend, không dựa vào menu ẩn của frontend.

Frontend hiển thị thông báo dễ hiểu theo `error.code`, có thể kèm requestId khi báo lỗi. Giữ form data khi mạng lỗi, giữ idempotency key khi retry. Nút bấm disabled chỉ cải thiện UX; backend vẫn phải chống request trùng.

Trước merge: typecheck, test liên quan, docs generation nếu đổi contract, format và CI. Không thêm test chỉ để kiểm tra tên biến; ưu tiên biên thời gian, auth, race, tiền, lỗi hạ tầng và trạng thái.
