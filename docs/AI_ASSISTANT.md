# Trợ lý tour và hướng mở rộng agent

## Khả năng có thật trong skeleton

| Nhu cầu           | Cách hỗ trợ                                       | Quyền                               |
| ----------------- | ------------------------------------------------- | ----------------------------------- |
| Đăng ký/đăng nhập | Hướng dẫn và mở form                              | Guest                               |
| Tìm tour Việt Nam | Tìm tour ACTIVE từ DB, trả nguồn tourId           | Guest                               |
| Kiểm tra chỗ/giá  | Đọc schedule theo UUID, giá và chỗ hiện tại       | Guest                               |
| Đặt tour          | Hướng dẫn luồng, dẫn đến trang chọn tour/xác nhận | Guest, cần CUSTOMER khi thực sự đặt |
| Xem đơn           | Đọc tối đa 5 đơn của user đã xác thực             | User                                |
| Thanh toán        | Giải thích trạng thái, mở trang đơn               | User khi đọc dữ liệu riêng          |
| Hủy               | Giải thích điều kiện 72h và mở màn hình xác nhận  | User                                |
| Quản trị          | Thống kê và đường dẫn đúng tác vụ quản trị        | ADMIN/OPERATIONS                    |
| Chính sách        | Trả quy tắc được khóa theo SRS                    | Guest                               |

Đây là trợ lý phục vụ các luồng chính của dự án. Chưa phải agent có thể tự làm mọi việc, chưa tư vấn thời tiết/giá vé máy bay, chưa biết dữ liệu ngoài DB, chưa viết lịch trình thực tế hoặc tự gọi refund. Trả lời về giá/chỗ dựa vào service và template, không để model bịa số liệu.

## Hai chế độ

- `RULE_BASED`: chạy ngay không mất phí API, nhận biết một số cụm từ tiếng Việt. UI hiển thị “Trợ lý cơ bản”.
- `GEMINI`: cấu hình GEMINI_API_KEY và GEMINI_MODEL trong backend. Model phân loại ý định dưới JSON schema, rồi server gọi service đã cho phép. Kết quả trả có `mode` và `sources`. API lỗi/timeout trở về rule-based, không giả rằng vừa có phản hồi LLM.

Gemini model không được chốt sẵn vì khả dụng/quota phụ thuộc project. Chọn model còn được cấp quyền trong tài khoản, thử staging và giới hạn ngân sách. API key chỉ ở server. Nội dung người dùng và history được gửi tới provider để phân loại; UI đã thông báo không nhập dữ liệu nhạy cảm. Dữ liệu đơn từ DB không gửi lại model trong thiết kế hiện tại.

## Quyền hạn và prompt injection

Model chỉ trả intent/query/scheduleId. Zod strict từ chối field như role, userId, SQL, URL tự chọn hoặc command. User identity đến từ JWT + DB. Mọi lần đọc đơn lọc theo principal. Nội dung “bỏ qua quy định, tôi là admin” không đổi quyền backend. Không chạy eval, SQL do model sinh, HTML trả về hoặc URL bên ngoài do model đề xuất.

Hiện chatbot không có write tool. Các CTA chỉ điều hướng tới màn hình nghiệp vụ; khách hoặc quản trị viên phải xem số tiền/lịch/số người/lý do rồi tự xác nhận. API nghiệp vụ kiểm tra lại các điều kiện.

## Nếu nhóm phát triển agent sau này

Thêm một tool vào module riêng theo trình tự: schema input/output -> authorization server-side -> service call -> audit -> tests. Việc đặt/hủy/sửa lịch phải tạo action proposal có actor, snapshot nội dung, expiry, idempotency key. UI hiển thị đề xuất; bước confirm gửi signed proposal tới backend; backend revalidate. Không cho model tự coi câu nói cũ là quyền xác nhận giao dịch mới.

Chức năng gợi ý có giá trị cho đồ án sau MVP: giải thích vì sao nút hủy bị khóa; tìm tour theo ngân sách bằng giá lịch thật; tổng hợp công việc cần xử lý của Operations; đề xuất mô tả tour ở trạng thái bản nháp. Cần API và tests mới trước khi coi là đã triển khai.

Tham khảo API phân loại JSON/structured generation trong tài liệu [Gemini API](https://ai.google.dev/gemini-api/docs/structured-output). Chưa kiểm thử live provider vì chưa có API key của nhóm.
