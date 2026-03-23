# Database Schema — Húp Hết (Supabase)

Project ID: `zlaetazzfuypwdoqavku`

## Bảng: `site_cache`
| Cột | Kiểu | Mô tả |
|---|---|---|
| `cache_key` (PK) | text | Key cache duy nhất |
| `kind` | text | Loại cache |
| `page_url` | text | URL trang |
| `generated_at` | timestamptz | Thời gian tạo |
| `payload` | jsonb | Data cache |

**RLS**: Tắt

---

## Bảng: `user_profiles`
| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` (PK, FK → auth.users) | uuid | User ID |
| `display_name` | text | Tên hiển thị |
| `avatar_url` | text | URL avatar |
| `phone` | text | SĐT |
| `created_at` | timestamptz | Ngày tạo |
| `updated_at` | timestamptz | Ngày cập nhật |

**RLS**: Bật — user chỉ xem/sửa profile của mình

---

## Bảng: `cashback_orders`
| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` (PK) | uuid | Auto-generated |
| `user_id` (FK → auth.users) | uuid | User sở hữu |
| `product_url` | text | URL sản phẩm gốc |
| `affiliate_url` | text | URL affiliate đã tạo |
| `merchant` | text | shopee/lazada/tiki/tiktok |
| `order_code` | text (nullable, unique) | Mã đơn Shopee (nhập thủ công) |
| `source` | text (default 'link') | Nguồn: `link` hoặc `manual` |
| `order_amount` | bigint | Giá trị đơn hàng |
| `commission` | bigint | Hoa hồng |
| `cashback_amount` | bigint | Số tiền hoàn |
| `cashback_rate` | smallint (default 70) | Tỷ lệ hoàn (70% link, 50% manual) |
| `status` | text | clicked/pending/approved/paid/rejected |
| `conversion_id` | text (nullable) | ID conversion từ Shopee |
| `click_time` | timestamptz | Thời gian click |
| `conversion_time` | timestamptz | Thời gian conversion |
| `created_at` | timestamptz | Ngày tạo |
| `updated_at` | timestamptz | Ngày cập nhật |

**RLS**: Bật
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`

**Business rules**:
- `source='link'`: Tạo từ trang Hoàn tiền, `cashback_rate=70`
- `source='manual'`: Nhập mã đơn từ MXH, `cashback_rate=50`
- `order_code` unique — không cho nhập trùng

---

## Bảng: `cashback_wallets`
| Cột | Kiểu | Mô tả |
|---|---|---|
| `user_id` (PK, FK → auth.users) | uuid | User |
| `balance` | bigint (default 0) | Số dư hiện tại |
| `total_earned` | bigint (default 0) | Tổng đã nhận |
| `total_withdrawn` | bigint (default 0) | Tổng đã rút |
| `updated_at` | timestamptz | Cập nhật cuối |

**RLS**: Bật

---

## Bảng: `cashback_withdrawals`
| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` (PK) | uuid | Auto-generated |
| `user_id` (FK → auth.users) | uuid | User yêu cầu |
| `amount` | bigint (check > 0) | Số tiền rút |
| `bank_name` | text | Tên ngân hàng |
| `bank_account` | text | STK |
| `account_name` | text | Chủ tài khoản |
| `status` | text | pending/approved/rejected/paid |
| `admin_note` | text (nullable) | Ghi chú admin |
| `created_at` | timestamptz | Ngày tạo |
| `processed_at` | timestamptz | Ngày xử lý |
| `processed_by` | text (nullable) | Admin xử lý |

**RLS**: Bật

---

## Bảng: `user_bank_accounts`
| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` (PK) | uuid | Auto-generated |
| `user_id` (FK → auth.users) | uuid | User |
| `bank_name` | text | Tên đầy đủ |
| `bank_short_name` | text | Tên viết tắt (VCB, TCB...) |
| `account_number` | text | STK |
| `account_name` | text | Chủ TK |
| `is_default` | boolean (default true) | TK mặc định |
| `created_at` | timestamptz | Ngày tạo |
| `updated_at` | timestamptz | Ngày cập nhật |

**RLS**: Bật
