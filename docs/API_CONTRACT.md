# API Contract v1.0

SRS-TOUR-2026-v1.0. Sinh từ shared Zod schemas và scripts/contract-manifest.mjs bằng npm run docs:generate. Không sửa trực tiếp phần sinh tự động.

## Quy ước chung

- Base URL local: http://localhost:4000/api/v1. HTTPS bắt buộc khi triển khai.
- JSON UTF-8. Tên trường camelCase; ID UUID; tiền là số nguyên VND không âm. Database dùng BIGINT, response chuyển số nguyên trong giới hạn an toàn.
- Ngày giờ ISO 8601 có offset, lưu UTC, UI hiển thị Asia/Ho_Chi_Minh. So sánh 72 giờ theo milliseconds, không trừ ngày lịch.
- Response thành công: {data,meta:{requestId,timestamp}}. Lỗi: {error:{code,message,details?},meta}. Webhook dùng định dạng riêng ở cuối tài liệu.
- JWT: Authorization: Bearer <token>. Không lưu token vào localStorage. Refresh nằm trong cookie HttpOnly, SameSite=Strict, Secure ở production.
- Auth POST: Origin phải bằng WEB_ORIGIN, X-CSRF-Protection: 1, credentials: include. curl/Postman cũng phải gửi hai header này.
- Pagination: page mặc định 1, pageSize mặc định 20, tối đa 100; response items,page,pageSize,total. q/destination tùy chọn.
- Guest là chưa đăng nhập, không phải một giá trị role trong DB. User = mọi tài khoản đang hoạt động, dữ liệu cá nhân vẫn lọc theo userId.
- 400 validation/chữ ký/số tiền; 401 thiếu/sai phiên; 403 quyền/CSRF; 404 không thấy hoặc không sở hữu; 409 xung đột nghiệp vụ; 422 giới hạn cổng; 429 rate limit; 502 phản hồi cổng không hợp lệ; 503 chưa cấu hình hoặc phụ thuộc lỗi.
- Chỉ CUSTOMER được tạo đơn. Admin/Operations dùng phân hệ vận hành. Header hoặc body giả role/userId đều không cấp quyền.

## Các bất biến mà frontend phải giữ

1. adults >= 1, children >= 0, không có infants. Cả hai cùng chiếm một chỗ/người.
2. Tổng tiền do backend tính từ giá trong DB. Client không gửi totalAmount hoặc status.
3. Một Idempotency-Key UUID cho một lần xác nhận đặt; giữ nguyên khi retry sau timeout mạng. Thay nội dung phải tạo key mới.
4. Quote không giữ chỗ. Tạo đơn mới kiểm tra và khóa chỗ trong transaction.
5. expiresAt = createdAt + 900000ms. now >= expiresAt là hết hạn. Không gia hạn khi refresh, retry hoặc tạo payment.
6. Countdown dùng expiresAt và serverTime. Poll kho chỗ mỗi 3 giây là thông tin cập nhật gần realtime; không thay cho kiểm tra nguyên tử khi đặt.
7. Browser return URL không phải bằng chứng thanh toán. Chỉ webhook xác thực được phép đánh dấu PAID.
8. Hủy đơn và hoàn tiền là hai quy trình. REFUND_REQUIRED không có nghĩa đã hoàn tiền.

## Endpoint index

| Method | Path                               | Quyền            | Request body           | Data response         | HTTP |
| ------ | ---------------------------------- | ---------------- | ---------------------- | --------------------- | ---- |
| POST   | /auth/register                     | Guest            | RegisterSchema         | AuthResultSchema      | 201  |
| POST   | /auth/login                        | Guest            | LoginSchema            | AuthResultSchema      | 200  |
| POST   | /auth/refresh                      | Cookie           | EmptySchema            | AuthResultSchema      | 200  |
| POST   | /auth/logout                       | Cookie           | EmptySchema            | AckSchema             | 200  |
| GET    | /auth/me                           | User             | Không                  | UserSchema            | 200  |
| GET    | /tours                             | Guest            | Không                  | TourSchema[]          | 200  |
| GET    | /tours/{id}                        | Guest            | Không                  | TourSchema            | 200  |
| GET    | /tours/{id}/schedules              | Guest            | Không                  | ScheduleSchema[]      | 200  |
| GET    | /schedules/{id}/availability       | Guest            | Không                  | ScheduleSchema        | 200  |
| POST   | /bookings/quote                    | Guest            | QuoteSchema            | QuoteResultSchema     | 200  |
| POST   | /bookings                          | CUSTOMER         | CreateBookingSchema    | BookingSchema         | 201  |
| GET    | /bookings                          | User             | Không                  | BookingSchema[]       | 200  |
| GET    | /bookings/{id}                     | User             | Không                  | BookingSchema         | 200  |
| POST   | /bookings/{id}/cancel              | User             | CancelSchema           | BookingSchema         | 200  |
| POST   | /payments                          | User             | CreatePaymentSchema    | PaymentSchema         | 200  |
| GET    | /payments/{id}                     | User             | Không                  | PaymentSchema         | 200  |
| GET    | /admin/summary                     | ADMIN,OPERATIONS | Không                  | SummarySchema         | 200  |
| GET    | /admin/tours                       | ADMIN,OPERATIONS | Không                  | TourSchema[]          | 200  |
| POST   | /admin/tours                       | ADMIN,OPERATIONS | CreateTourSchema       | TourSchema            | 201  |
| PATCH  | /admin/tours/{id}                  | ADMIN,OPERATIONS | UpdateTourSchema       | TourSchema            | 200  |
| DELETE | /admin/tours/{id}                  | ADMIN            | Không                  | AckSchema             | 200  |
| GET    | /admin/schedules                   | ADMIN,OPERATIONS | Không                  | ScheduleSchema[]      | 200  |
| POST   | /admin/schedules                   | ADMIN,OPERATIONS | CreateScheduleSchema   | ScheduleSchema        | 201  |
| PATCH  | /admin/schedules/{id}              | ADMIN,OPERATIONS | UpdateScheduleSchema   | ScheduleSchema        | 200  |
| GET    | /admin/bookings                    | ADMIN,OPERATIONS | Không                  | BookingSchema[]       | 200  |
| GET    | /admin/bookings/{id}               | ADMIN,OPERATIONS | Không                  | BookingSchema         | 200  |
| PATCH  | /admin/bookings/{id}/status        | ADMIN,OPERATIONS | TransitionSchema       | BookingSchema         | 200  |
| POST   | /admin/bookings/{id}/cancel        | ADMIN,OPERATIONS | CancelSchema           | BookingSchema         | 200  |
| GET    | /admin/payments                    | ADMIN,OPERATIONS | Không                  | PaymentSchema[]       | 200  |
| POST   | /admin/payments/{id}/refund-record | ADMIN            | RefundRecordSchema     | PaymentSchema         | 200  |
| GET    | /admin/audit-logs                  | ADMIN            | Không                  | AuditSchema[]         | 200  |
| POST   | /assistant/chat                    | Guest            | AssistantRequestSchema | AssistantResultSchema | 200  |
| GET    | /health/live                       | Guest            | Không                  | HealthSchema          | 200  |
| GET    | /health/ready                      | Guest            | Không                  | HealthSchema          | 200  |

## POST /auth/register

Quyền: Guest. HTTP thành công: 201. Tạo tài khoản CUSTOMER. Yêu cầu Origin và X-CSRF-Protection. Set-Cookie refresh_token.

Request (RegisterSchema):

```json
{
  "name": "Nguyễn Minh Anh",
  "email": "minhanh@example.com",
  "password": "DemoPassword_123!"
}
```

Response:

```json
{
  "data": {
    "user": {
      "id": "44444444-4444-4444-8444-444444444444",
      "name": "Nguyễn Minh Anh",
      "email": "minhanh@example.com",
      "role": "CUSTOMER"
    },
    "accessToken": "<JWT_ACCESS_TOKEN>",
    "expiresIn": 900
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## POST /auth/login

Quyền: Guest. HTTP thành công: 200. Đăng nhập. Set-Cookie refresh_token.

Request (LoginSchema):

```json
{
  "email": "minhanh@example.com",
  "password": "DemoPassword_123!"
}
```

Response:

```json
{
  "data": {
    "user": {
      "id": "44444444-4444-4444-8444-444444444444",
      "name": "Nguyễn Minh Anh",
      "email": "minhanh@example.com",
      "role": "CUSTOMER"
    },
    "accessToken": "<JWT_ACCESS_TOKEN>",
    "expiresIn": 900
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## POST /auth/refresh

Quyền: Cookie. HTTP thành công: 200. Rotate refresh token. Gửi cookie, Origin, X-CSRF-Protection: 1.

Request (EmptySchema):

```json
{}
```

Response:

```json
{
  "data": {
    "user": {
      "id": "44444444-4444-4444-8444-444444444444",
      "name": "Nguyễn Minh Anh",
      "email": "minhanh@example.com",
      "role": "CUSTOMER"
    },
    "accessToken": "<JWT_ACCESS_TOKEN>",
    "expiresIn": 900
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## POST /auth/logout

Quyền: Cookie. HTTP thành công: 200. Thu hồi cả họ refresh token và xóa cookie. Access JWT đã phát còn tối đa 15 phút.

Request (EmptySchema):

```json
{}
```

Response:

```json
{
  "data": {
    "ok": true
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## GET /auth/me

Quyền: User. HTTP thành công: 200. Hồ sơ hiện tại.

Response:

```json
{
  "data": {
    "id": "44444444-4444-4444-8444-444444444444",
    "name": "Nguyễn Minh Anh",
    "email": "minhanh@example.com",
    "role": "CUSTOMER"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## GET /tours

Quyền: Guest. HTTP thành công: 200. Chỉ ACTIVE, countryCode VN, chưa soft-delete.

Query: q, destination, page=1&pageSize=20.

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "11111111-1111-4111-8111-111111111111",
        "title": "Đà Nẵng và Hội An",
        "slug": "da-nang-hoi-an",
        "description": "Hành trình khám phá Đà Nẵng và Hội An trong ba ngày.",
        "destination": "Đà Nẵng",
        "countryCode": "VN",
        "durationDays": 3,
        "status": "ACTIVE",
        "createdAt": "2026-12-01T01:00:00.000Z",
        "updatedAt": "2026-12-01T01:00:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## GET /tours/{id}

Quyền: Guest. HTTP thành công: 200. Chỉ xem được tour công khai.

Response:

```json
{
  "data": {
    "id": "11111111-1111-4111-8111-111111111111",
    "title": "Đà Nẵng và Hội An",
    "slug": "da-nang-hoi-an",
    "description": "Hành trình khám phá Đà Nẵng và Hội An trong ba ngày.",
    "destination": "Đà Nẵng",
    "countryCode": "VN",
    "durationDays": 3,
    "status": "ACTIVE",
    "createdAt": "2026-12-01T01:00:00.000Z",
    "updatedAt": "2026-12-01T01:00:00.000Z"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## GET /tours/{id}/schedules

Quyền: Guest. HTTP thành công: 200. Các lịch OPEN trong tương lai.

Query: page=1&pageSize=20.

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "22222222-2222-4222-8222-222222222222",
        "tourId": "11111111-1111-4111-8111-111111111111",
        "departureAt": "2026-12-15T01:00:00.000Z",
        "totalSeats": 30,
        "reservedSeats": 8,
        "availableSeats": 22,
        "adultPrice": 3990000,
        "childPrice": 2490000,
        "status": "OPEN",
        "serverTime": "2026-12-01T01:00:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## GET /schedules/{id}/availability

Quyền: Guest. HTTP thành công: 200. Đọc PostgreSQL và thu hồi hold quá hạn trước khi trả chỗ. Không cache.

Response:

```json
{
  "data": {
    "id": "22222222-2222-4222-8222-222222222222",
    "tourId": "11111111-1111-4111-8111-111111111111",
    "departureAt": "2026-12-15T01:00:00.000Z",
    "totalSeats": 30,
    "reservedSeats": 8,
    "availableSeats": 22,
    "adultPrice": 3990000,
    "childPrice": 2490000,
    "status": "OPEN",
    "serverTime": "2026-12-01T01:00:00.000Z"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## POST /bookings/quote

Quyền: Guest. HTTP thành công: 200. Báo giá tham khảo, chưa giữ chỗ.

Request (QuoteSchema):

```json
{
  "scheduleId": "22222222-2222-4222-8222-222222222222",
  "adults": 2,
  "children": 1
}
```

Response:

```json
{
  "data": {
    "scheduleId": "22222222-2222-4222-8222-222222222222",
    "adults": 2,
    "children": 1,
    "adultPrice": 3990000,
    "childPrice": 2490000,
    "totalAmount": 10470000,
    "currency": "VND",
    "availableSeats": 22,
    "serverTime": "2026-12-01T01:00:00.000Z"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## POST /bookings

Quyền: CUSTOMER. HTTP thành công: 201. Bắt buộc Idempotency-Key UUID. Replay cùng dữ liệu trả lại đơn cũ; khác dữ liệu trả 409.

Request (CreateBookingSchema):

```json
{
  "scheduleId": "22222222-2222-4222-8222-222222222222",
  "adults": 2,
  "children": 1,
  "contactName": "Nguyễn Minh Anh",
  "contactEmail": "minhanh@example.com",
  "contactPhone": "0901234567"
}
```

Response:

```json
{
  "data": {
    "id": "33333333-3333-4333-8333-333333333333",
    "scheduleId": "22222222-2222-4222-8222-222222222222",
    "adults": 2,
    "children": 1,
    "contactName": "Nguyễn Minh Anh",
    "contactEmail": "minhanh@example.com",
    "contactPhone": "0901234567",
    "status": "PENDING_PAYMENT",
    "totalAmount": 10470000,
    "currency": "VND",
    "expiresAt": "2026-12-01T01:15:00.000Z",
    "createdAt": "2026-12-01T01:00:00.000Z",
    "paidAt": null,
    "cancelledAt": null,
    "cancelReason": null,
    "tourTitle": "Đà Nẵng và Hội An",
    "departureAt": "2026-12-15T01:00:00.000Z",
    "details": [
      {
        "kind": "ADULT",
        "quantity": 2,
        "unitPrice": 3990000,
        "lineTotal": 7980000
      },
      {
        "kind": "CHILD",
        "quantity": 1,
        "unitPrice": 2490000,
        "lineTotal": 2490000
      }
    ],
    "serverTime": "2026-12-01T01:00:00.000Z"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## GET /bookings

Quyền: User. HTTP thành công: 200. Chỉ đơn thuộc người đăng nhập.

Query: page=1&pageSize=20.

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "33333333-3333-4333-8333-333333333333",
        "scheduleId": "22222222-2222-4222-8222-222222222222",
        "adults": 2,
        "children": 1,
        "contactName": "Nguyễn Minh Anh",
        "contactEmail": "minhanh@example.com",
        "contactPhone": "0901234567",
        "status": "PENDING_PAYMENT",
        "totalAmount": 10470000,
        "currency": "VND",
        "expiresAt": "2026-12-01T01:15:00.000Z",
        "createdAt": "2026-12-01T01:00:00.000Z",
        "paidAt": null,
        "cancelledAt": null,
        "cancelReason": null,
        "tourTitle": "Đà Nẵng và Hội An",
        "departureAt": "2026-12-15T01:00:00.000Z",
        "details": [
          {
            "kind": "ADULT",
            "quantity": 2,
            "unitPrice": 3990000,
            "lineTotal": 7980000
          },
          {
            "kind": "CHILD",
            "quantity": 1,
            "unitPrice": 2490000,
            "lineTotal": 2490000
          }
        ],
        "serverTime": "2026-12-01T01:00:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## GET /bookings/{id}

Quyền: User. HTTP thành công: 200. 404 nếu đơn không thuộc người đăng nhập.

Response:

```json
{
  "data": {
    "id": "33333333-3333-4333-8333-333333333333",
    "scheduleId": "22222222-2222-4222-8222-222222222222",
    "adults": 2,
    "children": 1,
    "contactName": "Nguyễn Minh Anh",
    "contactEmail": "minhanh@example.com",
    "contactPhone": "0901234567",
    "status": "PENDING_PAYMENT",
    "totalAmount": 10470000,
    "currency": "VND",
    "expiresAt": "2026-12-01T01:15:00.000Z",
    "createdAt": "2026-12-01T01:00:00.000Z",
    "paidAt": null,
    "cancelledAt": null,
    "cancelReason": null,
    "tourTitle": "Đà Nẵng và Hội An",
    "departureAt": "2026-12-15T01:00:00.000Z",
    "details": [
      {
        "kind": "ADULT",
        "quantity": 2,
        "unitPrice": 3990000,
        "lineTotal": 7980000
      },
      {
        "kind": "CHILD",
        "quantity": 1,
        "unitPrice": 2490000,
        "lineTotal": 2490000
      }
    ],
    "serverTime": "2026-12-01T01:00:00.000Z"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## POST /bookings/{id}/cancel

Quyền: User. HTTP thành công: 200. Chỉ PENDING_PAYMENT hoặc PAID và còn >=72 giờ. Replay đơn đã hủy không hoàn chỗ thêm.

Request (CancelSchema):

```json
{
  "reason": "Thay đổi kế hoạch cá nhân"
}
```

Response:

```json
{
  "data": {
    "id": "33333333-3333-4333-8333-333333333333",
    "scheduleId": "22222222-2222-4222-8222-222222222222",
    "adults": 2,
    "children": 1,
    "contactName": "Nguyễn Minh Anh",
    "contactEmail": "minhanh@example.com",
    "contactPhone": "0901234567",
    "status": "CANCELLED",
    "totalAmount": 10470000,
    "currency": "VND",
    "expiresAt": "2026-12-01T01:15:00.000Z",
    "createdAt": "2026-12-01T01:00:00.000Z",
    "paidAt": null,
    "cancelledAt": "2026-12-01T01:00:00.000Z",
    "cancelReason": "Thay đổi kế hoạch cá nhân",
    "tourTitle": "Đà Nẵng và Hội An",
    "departureAt": "2026-12-15T01:00:00.000Z",
    "details": [
      {
        "kind": "ADULT",
        "quantity": 2,
        "unitPrice": 3990000,
        "lineTotal": 7980000
      },
      {
        "kind": "CHILD",
        "quantity": 1,
        "unitPrice": 2490000,
        "lineTotal": 2490000
      }
    ],
    "serverTime": "2026-12-01T01:00:00.000Z"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## POST /payments

Quyền: User. HTTP thành công: 200. Tạo/lấy giao dịch của đơn thuộc user; một provider cho mỗi đơn. Không nhận số tiền từ client.

Request (CreatePaymentSchema):

```json
{
  "bookingId": "33333333-3333-4333-8333-333333333333",
  "provider": "VNPAY"
}
```

Response:

```json
{
  "data": {
    "id": "55555555-5555-4555-8555-555555555555",
    "bookingId": "33333333-3333-4333-8333-333333333333",
    "provider": "VNPAY",
    "status": "INITIATED",
    "amount": 10470000,
    "currency": "VND",
    "checkoutUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?example=only",
    "createdAt": "2026-12-01T01:00:00.000Z"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## GET /payments/{id}

Quyền: User. HTTP thành công: 200. Chỉ giao dịch của đơn thuộc user.

Response:

```json
{
  "data": {
    "id": "55555555-5555-4555-8555-555555555555",
    "bookingId": "33333333-3333-4333-8333-333333333333",
    "provider": "VNPAY",
    "status": "INITIATED",
    "amount": 10470000,
    "currency": "VND",
    "checkoutUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?example=only",
    "createdAt": "2026-12-01T01:00:00.000Z"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## GET /admin/summary

Quyền: ADMIN,OPERATIONS. HTTP thành công: 200. Thống kê cache tối đa 15 giây.

Response:

```json
{
  "data": {
    "tours": 3,
    "bookings": 12,
    "pendingRefunds": 1
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## GET /admin/tours

Quyền: ADMIN,OPERATIONS. HTTP thành công: 200. Bao gồm DRAFT và INACTIVE, bỏ tour đã archive.

Query: q, destination, page=1&pageSize=20.

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "11111111-1111-4111-8111-111111111111",
        "title": "Đà Nẵng và Hội An",
        "slug": "da-nang-hoi-an",
        "description": "Hành trình khám phá Đà Nẵng và Hội An trong ba ngày.",
        "destination": "Đà Nẵng",
        "countryCode": "VN",
        "durationDays": 3,
        "status": "ACTIVE",
        "createdAt": "2026-12-01T01:00:00.000Z",
        "updatedAt": "2026-12-01T01:00:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## POST /admin/tours

Quyền: ADMIN,OPERATIONS. HTTP thành công: 201. Tạo tour nội địa.

Request (CreateTourSchema):

```json
{
  "title": "Đà Nẵng và Hội An",
  "slug": "da-nang-hoi-an",
  "description": "Hành trình khám phá Đà Nẵng và Hội An trong ba ngày.",
  "destination": "Đà Nẵng",
  "countryCode": "VN",
  "durationDays": 3,
  "status": "ACTIVE"
}
```

Response:

```json
{
  "data": {
    "id": "11111111-1111-4111-8111-111111111111",
    "title": "Đà Nẵng và Hội An",
    "slug": "da-nang-hoi-an",
    "description": "Hành trình khám phá Đà Nẵng và Hội An trong ba ngày.",
    "destination": "Đà Nẵng",
    "countryCode": "VN",
    "durationDays": 3,
    "status": "ACTIVE",
    "createdAt": "2026-12-01T01:00:00.000Z",
    "updatedAt": "2026-12-01T01:00:00.000Z"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## PATCH /admin/tours/{id}

Quyền: ADMIN,OPERATIONS. HTTP thành công: 200. Cập nhật các trường được khai báo; không thay ID.

Request (UpdateTourSchema):

```json
{
  "status": "ACTIVE"
}
```

Response:

```json
{
  "data": {
    "id": "11111111-1111-4111-8111-111111111111",
    "title": "Đà Nẵng và Hội An",
    "slug": "da-nang-hoi-an",
    "description": "Hành trình khám phá Đà Nẵng và Hội An trong ba ngày.",
    "destination": "Đà Nẵng",
    "countryCode": "VN",
    "durationDays": 3,
    "status": "ACTIVE",
    "createdAt": "2026-12-01T01:00:00.000Z",
    "updatedAt": "2026-12-01T01:00:00.000Z"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## DELETE /admin/tours/{id}

Quyền: ADMIN. HTTP thành công: 200. Soft delete; lịch sử đơn vẫn được giữ, không tự hủy đơn đã đặt.

Response:

```json
{
  "data": {
    "ok": true
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## GET /admin/schedules

Quyền: ADMIN,OPERATIONS. HTTP thành công: 200. Danh sách lịch cho vận hành.

Query: page=1&pageSize=20.

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "22222222-2222-4222-8222-222222222222",
        "tourId": "11111111-1111-4111-8111-111111111111",
        "departureAt": "2026-12-15T01:00:00.000Z",
        "totalSeats": 30,
        "reservedSeats": 8,
        "availableSeats": 22,
        "adultPrice": 3990000,
        "childPrice": 2490000,
        "status": "OPEN",
        "serverTime": "2026-12-01T01:00:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## POST /admin/schedules

Quyền: ADMIN,OPERATIONS. HTTP thành công: 201. Ngày khởi hành phải ở tương lai.

Request (CreateScheduleSchema):

```json
{
  "tourId": "11111111-1111-4111-8111-111111111111",
  "departureAt": "2026-12-15T01:00:00.000Z",
  "totalSeats": 30,
  "adultPrice": 3990000,
  "childPrice": 2490000,
  "status": "OPEN"
}
```

Response:

```json
{
  "data": {
    "id": "22222222-2222-4222-8222-222222222222",
    "tourId": "11111111-1111-4111-8111-111111111111",
    "departureAt": "2026-12-15T01:00:00.000Z",
    "totalSeats": 30,
    "reservedSeats": 8,
    "availableSeats": 22,
    "adultPrice": 3990000,
    "childPrice": 2490000,
    "status": "OPEN",
    "serverTime": "2026-12-01T01:00:00.000Z"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## PATCH /admin/schedules/{id}

Quyền: ADMIN,OPERATIONS. HTTP thành công: 200. Tổng chỗ >= số đang giữ/đã đặt. Giá mới không sửa giá snapshot của đơn cũ. Không cho đổi ngày khởi hành trên endpoint này.

Request (UpdateScheduleSchema):

```json
{
  "totalSeats": 35,
  "childPrice": 2490000
}
```

Response:

```json
{
  "data": {
    "id": "22222222-2222-4222-8222-222222222222",
    "tourId": "11111111-1111-4111-8111-111111111111",
    "departureAt": "2026-12-15T01:00:00.000Z",
    "totalSeats": 30,
    "reservedSeats": 8,
    "availableSeats": 22,
    "adultPrice": 3990000,
    "childPrice": 2490000,
    "status": "OPEN",
    "serverTime": "2026-12-01T01:00:00.000Z"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## GET /admin/bookings

Quyền: ADMIN,OPERATIONS. HTTP thành công: 200. Danh sách đơn toàn hệ thống.

Query: page=1&pageSize=20.

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "33333333-3333-4333-8333-333333333333",
        "scheduleId": "22222222-2222-4222-8222-222222222222",
        "adults": 2,
        "children": 1,
        "contactName": "Nguyễn Minh Anh",
        "contactEmail": "minhanh@example.com",
        "contactPhone": "0901234567",
        "status": "PENDING_PAYMENT",
        "totalAmount": 10470000,
        "currency": "VND",
        "expiresAt": "2026-12-01T01:15:00.000Z",
        "createdAt": "2026-12-01T01:00:00.000Z",
        "paidAt": null,
        "cancelledAt": null,
        "cancelReason": null,
        "tourTitle": "Đà Nẵng và Hội An",
        "departureAt": "2026-12-15T01:00:00.000Z",
        "details": [
          {
            "kind": "ADULT",
            "quantity": 2,
            "unitPrice": 3990000,
            "lineTotal": 7980000
          },
          {
            "kind": "CHILD",
            "quantity": 1,
            "unitPrice": 2490000,
            "lineTotal": 2490000
          }
        ],
        "serverTime": "2026-12-01T01:00:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## GET /admin/bookings/{id}

Quyền: ADMIN,OPERATIONS. HTTP thành công: 200. Chi tiết đơn cho vận hành.

Response:

```json
{
  "data": {
    "id": "33333333-3333-4333-8333-333333333333",
    "scheduleId": "22222222-2222-4222-8222-222222222222",
    "adults": 2,
    "children": 1,
    "contactName": "Nguyễn Minh Anh",
    "contactEmail": "minhanh@example.com",
    "contactPhone": "0901234567",
    "status": "PENDING_PAYMENT",
    "totalAmount": 10470000,
    "currency": "VND",
    "expiresAt": "2026-12-01T01:15:00.000Z",
    "createdAt": "2026-12-01T01:00:00.000Z",
    "paidAt": null,
    "cancelledAt": null,
    "cancelReason": null,
    "tourTitle": "Đà Nẵng và Hội An",
    "departureAt": "2026-12-15T01:00:00.000Z",
    "details": [
      {
        "kind": "ADULT",
        "quantity": 2,
        "unitPrice": 3990000,
        "lineTotal": 7980000
      },
      {
        "kind": "CHILD",
        "quantity": 1,
        "unitPrice": 2490000,
        "lineTotal": 2490000
      }
    ],
    "serverTime": "2026-12-01T01:00:00.000Z"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## PATCH /admin/bookings/{id}/status

Quyền: ADMIN,OPERATIONS. HTTP thành công: 200. Chỉ PAID -> CONFIRMED -> COMPLETED. Không cho tự đánh dấu PAID.

Request (TransitionSchema):

```json
{
  "status": "CONFIRMED"
}
```

Response:

```json
{
  "data": {
    "id": "33333333-3333-4333-8333-333333333333",
    "scheduleId": "22222222-2222-4222-8222-222222222222",
    "adults": 2,
    "children": 1,
    "contactName": "Nguyễn Minh Anh",
    "contactEmail": "minhanh@example.com",
    "contactPhone": "0901234567",
    "status": "CONFIRMED",
    "totalAmount": 10470000,
    "currency": "VND",
    "expiresAt": "2026-12-01T01:15:00.000Z",
    "createdAt": "2026-12-01T01:00:00.000Z",
    "paidAt": "2026-12-01T01:00:00.000Z",
    "cancelledAt": null,
    "cancelReason": null,
    "tourTitle": "Đà Nẵng và Hội An",
    "departureAt": "2026-12-15T01:00:00.000Z",
    "details": [
      {
        "kind": "ADULT",
        "quantity": 2,
        "unitPrice": 3990000,
        "lineTotal": 7980000
      },
      {
        "kind": "CHILD",
        "quantity": 1,
        "unitPrice": 2490000,
        "lineTotal": 2490000
      }
    ],
    "serverTime": "2026-12-01T01:00:00.000Z"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## POST /admin/bookings/{id}/cancel

Quyền: ADMIN,OPERATIONS. HTTP thành công: 200. Hủy nghiệp vụ ở mọi trạng thái theo sơ đồ SRS, bắt buộc lý do và audit. Xem DECISIONS.md.

Request (CancelSchema):

```json
{
  "reason": "Thay đổi kế hoạch cá nhân"
}
```

Response:

```json
{
  "data": {
    "id": "33333333-3333-4333-8333-333333333333",
    "scheduleId": "22222222-2222-4222-8222-222222222222",
    "adults": 2,
    "children": 1,
    "contactName": "Nguyễn Minh Anh",
    "contactEmail": "minhanh@example.com",
    "contactPhone": "0901234567",
    "status": "CANCELLED",
    "totalAmount": 10470000,
    "currency": "VND",
    "expiresAt": "2026-12-01T01:15:00.000Z",
    "createdAt": "2026-12-01T01:00:00.000Z",
    "paidAt": null,
    "cancelledAt": "2026-12-01T01:00:00.000Z",
    "cancelReason": "Thay đổi kế hoạch cá nhân",
    "tourTitle": "Đà Nẵng và Hội An",
    "departureAt": "2026-12-15T01:00:00.000Z",
    "details": [
      {
        "kind": "ADULT",
        "quantity": 2,
        "unitPrice": 3990000,
        "lineTotal": 7980000
      },
      {
        "kind": "CHILD",
        "quantity": 1,
        "unitPrice": 2490000,
        "lineTotal": 2490000
      }
    ],
    "serverTime": "2026-12-01T01:00:00.000Z"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## GET /admin/payments

Quyền: ADMIN,OPERATIONS. HTTP thành công: 200. Đối soát và tìm REFUND_REQUIRED.

Query: page=1&pageSize=20.

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "55555555-5555-4555-8555-555555555555",
        "bookingId": "33333333-3333-4333-8333-333333333333",
        "provider": "VNPAY",
        "status": "INITIATED",
        "amount": 10470000,
        "currency": "VND",
        "checkoutUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?example=only",
        "createdAt": "2026-12-01T01:00:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## POST /admin/payments/{id}/refund-record

Quyền: ADMIN. HTTP thành công: 200. Ghi nhận bằng chứng đã hoàn tiền thủ công. Endpoint không chuyển tiền.

Request (RefundRecordSchema):

```json
{
  "reference": "REFUND-20261201-001",
  "note": "Đã đối soát hoàn tiền đầy đủ qua cổng thanh toán"
}
```

Response:

```json
{
  "data": {
    "id": "55555555-5555-4555-8555-555555555555",
    "bookingId": "33333333-3333-4333-8333-333333333333",
    "provider": "VNPAY",
    "status": "REFUNDED",
    "amount": 10470000,
    "currency": "VND",
    "checkoutUrl": null,
    "createdAt": "2026-12-01T01:00:00.000Z"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## GET /admin/audit-logs

Quyền: ADMIN. HTTP thành công: 200. Nhật ký thay đổi quan trọng.

Query: page=1&pageSize=20.

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "11111111-1111-4111-8111-111111111111",
        "actorId": "44444444-4444-4444-8444-444444444444",
        "action": "BOOKING_CREATED",
        "entityId": "33333333-3333-4333-8333-333333333333",
        "metadata": {
          "seats": 3,
          "totalAmount": 10470000
        },
        "createdAt": "2026-12-01T01:00:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## POST /assistant/chat

Quyền: Guest. HTTP thành công: 200. JWT tùy chọn. Backend áp dụng quyền user cho từng công cụ.

Request (AssistantRequestSchema):

```json
{
  "message": "Tìm tour Đà Nẵng",
  "history": []
}
```

Response:

```json
{
  "data": {
    "reply": "Đà Nẵng và Hội An tại Đà Nẵng, 3 ngày. Xem lịch để có giá và chỗ hiện tại.",
    "mode": "RULE_BASED",
    "actions": [
      {
        "label": "Xem Đà Nẵng và Hội An",
        "href": "/tours/11111111-1111-4111-8111-111111111111",
        "requiresConfirmation": false
      }
    ],
    "sources": [
      {
        "type": "TOUR",
        "id": "11111111-1111-4111-8111-111111111111",
        "label": "Đà Nẵng và Hội An"
      }
    ]
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## GET /health/live

Quyền: Guest. HTTP thành công: 200. Tiến trình đang phục vụ.

Response:

```json
{
  "data": {
    "status": "ok"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## GET /health/ready

Quyền: Guest. HTTP thành công: 200. Kiểm tra PostgreSQL và Redis; lỗi trả 503.

Response:

```json
{
  "data": {
    "status": "ok"
  },
  "meta": {
    "requestId": "example-request-id",
    "timestamp": "2026-12-01T01:00:00.000Z"
  }
}
```

## Webhook thanh toán

Không có JWT. Chữ ký là bắt buộc; không gọi webhook từ frontend. Không dùng response envelope. Các ví dụ sau chỉ minh họa cấu trúc, không phải chữ ký hợp lệ.

### GET /payments/webhooks/vnpay

VNPay IPN qua query, HMAC-SHA512. amount đơn vị VND x100.

Query parameters, biểu diễn dưới dạng object để dễ đọc:

```json
{
  "vnp_TmnCode": "TESTCODE",
  "vnp_TxnRef": "55555555-5555-4555-8555-555555555555",
  "vnp_Amount": "1047000000",
  "vnp_TransactionNo": "123456789",
  "vnp_ResponseCode": "00",
  "vnp_TransactionStatus": "00",
  "vnp_SecureHash": "<HMAC_SHA512>"
}
```

ACK: { "RspCode": "00", "Message": "Confirm Success" }.

### POST /payments/webhooks/momo

MoMo IPN JSON, HMAC-SHA256. HTTP 204 khi đã ghi nhận bền vững.

Request JSON:

```json
{
  "partnerCode": "<PARTNER_CODE>",
  "orderId": "55555555-5555-4555-8555-555555555555",
  "requestId": "55555555-5555-4555-8555-555555555555",
  "amount": 10470000,
  "orderInfo": "Thanh toan tour",
  "orderType": "momo_wallet",
  "transId": 123456789,
  "resultCode": 0,
  "message": "Successful",
  "payType": "qr",
  "responseTime": 1796086800000,
  "extraData": "",
  "signature": "<HMAC_SHA256>"
}
```

ACK: Không có body (204).

### POST /payments/webhooks/zalopay

ZaloPay JSON {data:string,mac:string,type?:number}. HMAC-SHA256 key2 trên đúng chuỗi data.

Request JSON:

```json
{
  "data": "{\"app_id\":2553,\"app_trans_id\":\"261201_55555555555545558555555555555555\",\"zp_trans_id\":123456789,\"amount\":10470000}",
  "mac": "<HMAC_SHA256>",
  "type": 1
}
```

ACK: { "return_code": 1, "return_message": "success" }.

VNPay query tối thiểu: vnp_TmnCode, vnp_TxnRef, vnp_Amount, vnp_TransactionNo, vnp_ResponseCode, vnp_TransactionStatus, vnp_SecureHash. Ký toàn bộ tham số trả về trừ vnp_SecureHash và vnp_SecureHashType, sort tên rồi URL encode, dấu cách thành +. Cả hai trạng thái phải 00. ACK 02 khi đã ghi nhận, 97 chữ ký sai, 01 không thấy giao dịch, 04 sai tiền, 99 lỗi khác.

MoMo JSON có partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature. Canonical signature gồm accessKey cộng các trường theo thứ tự trong gateways.ts. resultCode=0 thành công. Callback số nguyên vượt giới hạn an toàn JS bị từ chối, không làm tròn im lặng. ACK 204 sau commit, lỗi 4xx/5xx để đối soát/retry.

ZaloPay data chứa app_id, app_trans_id, zp_trans_id, amount. Callback này chỉ thông báo thành công; xác minh key2 và app_id. ACK return_code=1, sai MAC=-1, lỗi xử lý=0.

Replay hợp lệ không đổi trạng thái hoặc trả chỗ lần hai. Sai provider/merchant/reference/amount không đánh dấu PAID. Tiền đến sau timeout hoặc sau hủy: REFUND_REQUIRED và giữ đơn CANCELLED. Thời điểm quyết định là clock_timestamp() của DB sau khi lấy khóa lịch.

## Lỗi mẫu

```json
{
  "error": { "code": "INSUFFICIENT_SEATS", "message": "Không đủ chỗ" },
  "meta": { "requestId": "example-request-id", "timestamp": "2026-12-01T01:00:00.000Z" }
}
```

Mã nghiệp vụ ổn định: VALIDATION_ERROR, INVALID_CREDENTIALS, UNAUTHORIZED, FORBIDDEN, CSRF_REJECTED, NOT_FOUND, CONFLICT, IDEMPOTENCY_CONFLICT, INSUFFICIENT_SEATS, SCHEDULE_UNAVAILABLE, CANCELLATION_NOT_ALLOWED, INVALID_TRANSITION, TOUR_NOT_STARTED, CAPACITY_BELOW_RESERVED, BOOKING_NOT_PAYABLE, PAYMENT_PROVIDER_LOCKED, PROVIDER_NOT_CONFIGURED, PROVIDER_AMOUNT_LIMIT, PROVIDER_TIME_LIMIT, PROVIDER_UNAVAILABLE, INVALID_PROVIDER_RESPONSE, INVALID_SIGNATURE, MERCHANT_MISMATCH, AMOUNT_MISMATCH, TRANSACTION_MISMATCH, REFUND_NOT_REQUIRED, REFUND_REFERENCE_CONFLICT, RETRY_TRANSACTION, RATE_LIMITED.

Chi tiết từng trường và required/optional nằm trong openapi.json và packages/shared/src/index.ts. OpenAPI bao gồm schema request/response; các ví dụ ở tài liệu này được Zod kiểm tra khi sinh.
