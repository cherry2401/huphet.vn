# API Documentation — Húp Hết

## Public (Không cần auth)

### GET `/api/live-xu`
- **Mô tả**: Lấy danh sách livestream Shopee có xu
- **Response**: `{ data: LiveSession[] }`

---

## Tools (Không cần auth)

### POST `/api/tools/shopee-link`
- **Mô tả**: Tạo affiliate link Shopee
- **Body**: `{ productUrl: string, subId1?: string, shorten?: boolean }`
- **Response**: `{ ok: true, productUrl, affiliateUrl, shortUrl }`
- **Errors**: 400 (invalid URL)

---

## Cashback (Auth required)

### POST `/api/cashback/link`
- **Mô tả**: Tạo cashback affiliate link cho user
- **Body**: `{ productUrl: string }`
- **Response**: `{ ok: true, affiliateUrl, merchant, cashbackRate }`
- **Side effect**: Tạo record `cashback_orders` với `status: 'clicked'`, `source: 'link'`
- **Errors**: 401 (not logged in), 400 (invalid URL)

### POST `/api/cashback/submit-order`
- **Mô tả**: Nhập mã đơn hàng Shopee (từ MXH) để claim cashback
- **Body**: `{ orderCode: string }`
- **Validate**: Regex `[A-Z0-9]{10,30}`, check trùng
- **Response**: `{ ok: true, message }`
- **Side effect**: Tạo record `cashback_orders` với `status: 'pending'`, `source: 'manual'`, `cashback_rate: 50`
- **Errors**: 401, 400, 409 (trùng mã)

### GET `/api/cashback/submit-order`
- **Mô tả**: Lấy lịch sử đơn đã nhập (source=manual)
- **Response**: `{ ok: true, orders: Order[] }`

### GET `/api/cashback/withdraw`
- **Mô tả**: Lấy ví + lịch sử rút tiền + đơn hàng
- **Response**: `{ wallet, withdrawals, orders }`

### POST `/api/cashback/withdraw`
- **Mô tả**: Yêu cầu rút tiền
- **Body**: `{ amount, bankName, bankAccount, accountName }`
- **Response**: `{ ok: true, message }`

---

## Admin (Auth required — admin credentials)

### GET `/api/admin/users`
- **Mô tả**: Danh sách users
- **Query**: `?page=1&per_page=10`

### GET `/api/admin/withdrawals`
- **Mô tả**: Danh sách yêu cầu rút tiền

---

## Internal (API key required)

### POST `/api/internal/affiliate/custom-link`
- **Mô tả**: Tạo custom affiliate link qua browser/GQL
- **Header**: `Authorization: Bearer <INTERNAL_API_KEY>`

### POST `/api/internal/partner/sync`
- **Mô tả**: Sync deals từ partner

### GET `/api/internal/shopee/status`
- **Mô tả**: Kiểm tra trạng thái Shopee session

### POST `/api/internal/shopee/sync`
- **Mô tả**: Sync dữ liệu Shopee

---

## Cron (CRON_SECRET required)

### GET `/api/cron/cashback-sync`
- **Mô tả**: Sync trạng thái cashback orders
- **Header**: `Authorization: Bearer <CRON_SECRET>`

### GET `/api/cron/partner-sync`
- **Mô tả**: Sync deals từ partner
- **Header**: `Authorization: Bearer <CRON_SECRET>`
