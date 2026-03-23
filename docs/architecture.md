# Shopee Affiliate Architecture

## Mục tiêu

Xây website Shopee affiliate public, nhanh, dễ mở rộng, và không trộn lẫn với tool vận hành nội bộ.

## Kiến trúc đề xuất

### 1. Public Web App

- Next.js App Router cho các route public
- ưu tiên Server Components cho page shell
- dùng cache hoặc ISR cho data không cần realtime tuyệt đối

Các route khuyến nghị:

- `/` trang chủ campaign
- `/deal` hub tổng hợp deal
- `/live` Hub livestream Shopee có xu (realtime từ tienve.vn)
- `/voucher` mã giảm giá, freeship, ưu đãi
- `/category/[slug]` trang danh mục SEO
- `/campaign/[slug]` landing page cho dịp sale
- `/tao-link` tạo affiliate link Shopee (sub_id tracking)
- `/hoan-tien` cashback: tạo link + ví + lịch sử
- `/nhap-don` nhập mã đơn Shopee (MXH) để claim cashback
- `/rut-tien` rút tiền từ ví cashback
- `/tai-khoan` dashboard user (tổng quan, thông tin, ví)
- `/login` đăng nhập

### 2. Data Adapters

Thư mục `src/lib/adapters` nên là nơi duy nhất chạm vào nguồn dữ liệu thật.

Ví dụ:

- `deal-adapter.ts`
- `live-adapter.ts`
- `voucher-adapter.ts`
- `tracking-adapter.ts`

Mỗi adapter trả về model chuẩn hóa, không trả raw response từ API ngoài.

## 3. Tracking Layer

Outbound link nên đi qua redirect nội bộ.

Ví dụ:

- `/go/[slug]`

Tại đây bạn có thể:

- map slug sang link aff thật
- thêm source, campaign, placement
- log click event
- redirect 302 sang Shopee

## 4. Cashback System

Hệ thống hoàn tiền cho user:

- **Tạo link cashback** (`/hoan-tien`): User dán link sản phẩm → nhận affiliate link riêng → mua qua link → nhận cashback 70%.
- **Nhập đơn** (`/nhap-don`): User mua qua link MXH → nhập mã đơn → admin verify → nhận cashback 50%.
- **Ví cashback**: Số dư, tổng đã nhận, tổng đã rút.
- **Rút tiền** (`/rut-tien`): Yêu cầu rút tiền → admin duyệt → chuyển khoản.

DB Tables:
- `cashback_orders` — đơn cashback (link/manual), có `order_code` + `source`
- `cashback_wallets` — ví user
- `cashback_withdrawals` — yêu cầu rút tiền
- `user_bank_accounts` — tài khoản ngân hàng

## 5. Admin Boundary

- Tách admin sang route group private (`/admin`)
- Dùng auth server-side + admin credentials
- Không render secret ra client
- Admin quản lý: users, withdrawals, cashback orders

## 6. Content Strategy

Website aff nên dựa trên 3 loại trang:

- evergreen: danh mục, top deal, top voucher
- event-driven: 15.15, payday, mega campaign
- high-intent: live hot, voucher còn hạn, deal theo mức giá

## 7. Không làm ở public app

- không quản lý account Shopee
- không lưu access token client-side
- không để client gọi trực tiếp quá nhiều API rời rạc
- không dùng Google Form hay sheet công khai làm lõi kiến trúc lâu dài
