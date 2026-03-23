# Changelog

Tất cả các thay đổi quan trọng đối với dự án này sẽ được lưu lại trong file này.

## [2026-03-15]

### Added
- **Trang Nhập đơn** (`/nhap-don`): Cho phép khách nhập mã đơn Shopee (mua qua link MXH) để claim cashback. Gồm hero cam, 3 bước hướng dẫn, form nhập mã, lịch sử đơn.
- **API** `/api/cashback/submit-order` (POST + GET): Validate mã đơn, check trùng, lưu DB với `source='manual'` và `cashback_rate=50`.
- **Trang Rút tiền** (`/rut-tien`): Trang rút tiền riêng với wallet summary, form rút tiền, lịch sử rút tiền, nút thêm tài khoản ngân hàng.
- **DB Migration**: Thêm `order_code` (text, nullable, unique) và `source` (text, default 'link') vào `cashback_orders`.
- **DB Migration**: Thêm RLS INSERT policy cho `cashback_orders`.
- **Header**: Thêm menu "Rút tiền" vào dropdown avatar.
- **Dashboard**: Quick action "Nhập đơn" trỏ sang `/nhap-don`, "Rút tiền" trỏ sang `/rut-tien`.
- **Bank accounts**: Hỗ trợ thêm tài khoản ngân hàng mới từ trang rút tiền.

### Changed
- **Dashboard**: Loại bỏ card "Thông tin tài khoản" ở tab tổng quan (đã có tab riêng).
- **Dashboard**: Fix sync `activeTab` với URL `?tab=` searchParams bằng `useEffect`.

### Fixed
- **Quick action links**: "Lịch sử giao dịch" → `?tab=cashback` giờ cập nhật UI đúng khi đã ở trang `/tai-khoan`.

## [2026-03-14]

### Added
- **Shopee Xu Integration**: Tích hợp API từ `api.tienve.vn` để hiển thị danh sách livestream có xu Shopee theo thời gian thực.
- **API Route**: Thêm `/api/live-xu` cho cơ chế client-side suto-refresh.
- **Live Xu UI**: Thiết kế lại hoàn toàn trang Live với Hero Banner thống kê, bộ lọc xu (1K, 2K, 5K) và sắp xếp (Xu nhiều nhất, Mới nhất).
- **Ranking Badges**: Hiển thị huy hiệu Vàng/Bạc/Đồng cho các shop có lượng xu dẫn đầu.
- **Xu Tier Badges**: Đánh dấu các shop có xu "KHỦNG" (5K+) và "NHIỀU" (2K+).

### Changed
- **Live Adapter**: Chuyển từ mock data sang fetch dữ liệu thật từ `tienve.vn`, revalidate mỗi 5 phút.
- **Types**: Thêm trường `maxcoin` vào type `LiveSession`.

### Fixed
- **Header flickering**: Khắc phục tình trạng nháy header khi chuyển trang bằng cách đưa `SiteHeader` lên root layout và tối ưu CSS isolation (`contain`, `will-change`).
- **Icon rendering**: Thay thế các emoji characters bằng SVG và CSS để tránh lỗi hiển thị trên Windows.
- **Font consistency**: Đồng bộ font hệ thống (Inter & Space Grotesk) trên tất cả các trang.
