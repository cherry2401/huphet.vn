# Reuse Review From `shopeelivecoin`

## Nên tái sử dụng

- Tách route theo intent người dùng: `flashsale`, `live`, `tui`, `xue`.
- Pattern card sản phẩm ngắn gọn: ảnh, badge giảm giá, giá mới, giá cũ, trạng thái.
- Promo bar theo khung giờ và countdown cho campaign sắp chạy.
- Mô hình static-first deploy trên Vercel cho public pages.
- Community CTA như Telegram/Zalo chỉ nên giữ ở vai trò phụ trợ traffic.

## Chỉ nên tái sử dụng sau khi làm sạch

- Search, filter, sort ở trang flash sale: nên chuyển thành component typed, không hardcode endpoint.
- Landing page live/voucher: giữ funnel, nhưng dữ liệu phải đi qua adapter nội bộ.
- Redirect affiliate links: nên chuẩn hóa thành route redirect riêng thay vì nhúng thẳng URL aff trong component.

## Không nên mang sang project mới

- Module quản lý tài khoản, token, QR login, hay account operations.
- Bất kỳ luồng nào lưu token trong `localStorage`.
- Các endpoint Google Apps Script, Google Forms, Render API hardcode trực tiếp trong frontend.
- File nhị phân không rõ vai trò như APK/ZIP.
- Dữ liệu nhạy cảm render ra client như username/password.

## Kết luận

Repo tham chiếu đáng học ở phần tổ chức public funnels và cách trình bày deal.

Repo đó không phù hợp làm nền chính cho website Shopee affiliate dài hạn vì:

- phụ thuộc nặng vào dịch vụ ngoài repo
- lẫn public marketing với internal operations
- thiếu docs, type safety, test, và boundary bảo mật
