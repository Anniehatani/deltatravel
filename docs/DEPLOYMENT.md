# Chạy thử, triển khai và vận hành

## Trạng thái

Compose là môi trường local, chưa phải production deployment. Repository chưa được tạo/push và chưa có host/domain/merchant credentials. CI và workflow publish image đã được cung cấp dạng mã cấu hình; chưa thực sự chạy trên GitHub trong phiên tạo skeleton.

## Staging tối thiểu

1. Deploy API và web thành hai dịch vụ, một PostgreSQL và một Redis riêng. Có thể cùng VPS để tiết kiệm, nhưng port DB/Redis chỉ mở mạng riêng.
2. Dùng HTTPS cho web/API trên cùng site, ví dụ www.example.vn và api.example.vn. Cookie SameSite=Strict yêu cầu cùng site; không đặt hai tên miền độc lập rồi bỏ bảo vệ CSRF cho dễ chạy.
3. Khai báo WEB_ORIGIN đúng origin web, API_PUBLIC_URL đúng origin API, NEXT_PUBLIC_API_URL bao gồm /api/v1. Build Next sau khi đặt biến NEXT_PUBLIC_API_URL.
4. Dùng JWT_SECRET ngẫu nhiên, mật khẩu DB riêng, Redis auth/TLS hoặc private network. Không đưa file .env vào image, frontend hoặc git.
5. Release chạy `npm ci`, `npm run build`, kiểm tra test; chạy migration bằng một job riêng `npm run db:migrate`, sau đó chạy app. Không seed demo production.
6. Health check `/api/v1/health/ready`; giám sát lỗi callback, pending expired, failed jobs, refund_required và DB connection pool.

Docker API build từ repo root: `docker build -f apps/api/Dockerfile -t tour-api:local .`. Image skeleton vẫn chứa toolchain để đơn giản hóa migration, chưa tối ưu kích thước; harden/prune theo môi trường trước public production. Không dùng image hoặc cấu hình mới nếu chưa qua smoke test.

Workflow `publish.yml` chỉ chạy thủ công sau khi có repository, kiểm tra CI rồi publish image GHCR. Nó chưa tự cài image lên một host vì nhóm chưa chọn hạ tầng. CD tới host phải thêm credential và môi trường staging cụ thể, không hardcode địa chỉ giả.

## Thanh toán sandbox

- VNPay: lấy TmnCode/hash secret, đăng ký IPN GET `/api/v1/payments/webhooks/vnpay` và return `/payments/return` theo merchant portal.
- MoMo: partnerCode/accessKey/secretKey, callback `/api/v1/payments/webhooks/momo`, test wallet theo tài liệu nhà cung cấp.
- ZaloPay: appId/key1/key2, callback `/api/v1/payments/webhooks/zalopay`.
- Callback phải tới được HTTPS công khai. localhost không nhận được webhook từ provider. API_PUBLIC_URL không phải URL frontend.
- URL return do server tạo, không nhận URL tùy ý từ client. Mọi giao dịch dùng reference ổn định từ DB.

MoMo có giới hạn số tiền trong adapter. ZaloPay yêu cầu thời hạn tối thiểu 300 giây, nên adapter chặn tạo payment ZaloPay khi còn dưới 5 phút. Sau khi provider đã được khóa trên một đơn, không đổi cổng trên cùng đơn. Tình huống provider nhận lệnh nhưng response mất mạng cần đối soát bằng merchant portal hoặc query API bổ sung. Không tự tạo reference mới vì có thể thu tiền hai lần.

Nhóm phải test ít nhất: thành công, từ chối, người dùng đóng tab, callback lặp, sai chữ ký, sai tiền, callback sau hết hạn, lỗi mạng khi tạo checkout. Fixture test nội bộ không thay cho chứng nhận merchant sandbox.

## Timeout và tải

API và BullMQ worker cùng chạy trong một Nest process ở skeleton để dễ học. Khi tăng tải có thể tách worker, nhưng phải giữ dispatcher/sweep đang hoạt động. Nhiều instance cùng chạy vẫn dùng khóa DB và jobId ổn định; rate limiter mặc định là theo process, cần Redis-backed throttler hoặc rate limit tại ingress trước khi scale.

Sweep mỗi 5 giây, batch 100. Cần theo dõi backlog, thời gian trễ và clock sync NTP. Khi Redis mất kết nối, booking/outbox vẫn nằm DB, sweeper/lazy reclaim xử lý. Nếu cả API/DB ngừng thì không có hệ thống nào thực thi đúng một deadline vật lý; sau phục hồi thu hồi theo mốc đã lưu. Mốc hiệu lực không được nới.

## Refund và đối soát

Không có tự động hoàn tiền trong skeleton. Khi gặp REFUND_REQUIRED, kiểm tra giao dịch ở merchant portal, áp dụng chính sách được phê duyệt, hoàn tiền tại portal, rồi ADMIN gọi refund-record với bằng chứng. Chưa hỗ trợ partial refund, chargeback hoặc reconciliation job tự truy vấn cổng. Không coi REFUNDED là trạng thái do người mua tự khai báo.

## Backup và rollback

Backup PostgreSQL hằng ngày bằng pg_dump, lưu ngoài máy chạy chính và thử restore vào DB thử nghiệm. Redis AOF hỗ trợ queue nhưng không thay backup PostgreSQL. Migration áp dụng forward-only; chuẩn bị migration sửa nếu có lỗi, không tự drop bảng. Giữ image release trước để rollback ứng dụng khi schema vẫn tương thích.

## Gate trước nhận tiền thật

Nhóm phải có: sandbox ba cổng pass, integration PostgreSQL/Redis native pass, policy hoàn tiền được chốt, HTTPS + secrets thật, backup/restore, rate limiting phù hợp số instance, dữ liệu tour và giá thật đã duyệt, test concurrent create/cancel/webhook, theo dõi refunds và lỗi webhook, rà soát dependency audit tại thời điểm release. Có bản build thành công chưa đáp ứng đủ các gate này.

## Nguồn tích hợp

- [VNPay PAY](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html)
- [MoMo one-time payment](https://developers.momo.vn/v3/vi/docs/payment/api/wallet/onetime/)
- [ZaloPay v2](https://developers.zalopay.vn/v2/general/overview.html)
- [NestJS queues](https://docs.nestjs.com/techniques/queues)
- [BullMQ delayed jobs](https://docs.bullmq.io/guide/jobs/delayed)
