# Demo Runbook

Cập nhật: 28/09/2026.

Mục tiêu của runbook là giúp nhóm demo đúng source of truth, không dựa vào dữ liệu giả và không phải sửa code ngay trước buổi bảo vệ.

## Trước giờ demo

Chạy CI trên commit sẽ trình bày. Kiểm tra `npm run verify:live`. Mở web, API health và trang admin system. Không đưa file .env, API key hoặc merchant secret lên màn hình.

## Kịch bản demo chính

1. Mở trang chủ và danh sách tour. Chỉ ra rằng catalog được lấy từ backend và giá trên card là giá thấp nhất của lịch OPEN còn chỗ.
2. Mở một tour, chọn lịch, thay số người. Chỉ ra quote thay đổi từ API và số chỗ hiện tại.
3. Đăng ký customer hoặc dùng tài khoản demo đã được chuẩn bị hợp lệ. Không dùng mật khẩu hardcode trong source.
4. Tạo booking thủ công. Giải thích Idempotency-Key, giá snapshot và thời hạn giữ chỗ.
5. Chọn CASH. Booking phải chuyển sang AWAITING_CASH, chưa được gọi là đã thanh toán.
6. Mở AI Agent. Cho Agent tìm lịch và dừng tại checkpoint. Chỉ sau nút phê duyệt mới tạo booking/payment.
7. Mở My Bookings, xem chi tiết, trạng thái, countdown và hủy một booking đủ điều kiện để chứng minh chỗ được trả.
8. Đăng nhập ADMIN hoặc OPERATIONS. Demo dashboard, tour, lịch, booking và payment. Với ADMIN có thể xem audit trail và ghi refund evidence.
9. Mở System Status để chỉ ra Groq, email, avatar storage và capability của payment gateway. Gateway thiếu credential phải hiện unavailable.
10. Kết thúc bằng CI, OpenAPI, test plan và traceability matrix.

## Tình huống biên nên chuẩn bị

Có thể quay video hoặc dùng test environment cho tranh chỗ cuối, callback lặp, timeout 15 phút, restart worker và các case concurrency để tránh làm gián đoạn buổi demo. Không thay HOLD_MS của bản chính thành giá trị ngắn chỉ để trình diễn.

## Khi giảng viên hỏi vì sao ví online chưa thanh toán thật

Trả lời đúng trạng thái kỹ thuật: adapter, signature verification, callback, amount/reference checks và fail-closed capability đã có; merchant sandbox certification cần credential do provider cấp. Không nhập secret vào frontend và không giả giao dịch thành công.

## Khi giảng viên hỏi AI có tự ý đặt tour không

Cho xem Agent checkpoint và endpoint approve. Agent được phép lập kế hoạch và đọc dữ liệu theo quyền, nhưng side effect tạo booking/payment chỉ xảy ra sau explicit approval của customer.
