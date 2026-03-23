# Business Rules — Húp Hết

## Cashback

### Tỷ lệ hoàn tiền
- **Tạo link tự thân** (`/hoan-tien`): Cashback rate = **70%** hoa hồng
- **Nhập đơn từ MXH** (`/nhap-don`): Cashback rate = **50%** hoa hồng
- Lưu ý: tỷ lệ hoa hồng phụ thuộc từng sản phẩm trên Shopee

### Flow nhập đơn
1. Khách mua qua link affiliate Húp Hết trên MXH (Facebook, Zalo, TikTok)
2. Khách copy mã đơn từ Shopee
3. Khách dán mã đơn vào form `/nhap-don`
4. API validate: format alphanumeric 10-30 ký tự, check trùng
5. Tạo record `cashback_orders` với `status: 'pending'`, `source: 'manual'`
6. Admin verify thủ công (chưa có auto-verify qua Shopee API)
7. Sau khi duyệt: cộng xu vào `cashback_wallets`

### Flow tạo link cashback
1. Khách đăng nhập → vào `/hoan-tien`
2. Dán link sản phẩm → nhận affiliate link riêng (sub_id = `cb_{userId}`)
3. Mua hàng qua link đó
4. Hệ thống auto-track qua AccessTrade/Shopee Affiliate
5. Cashback cộng tự động

### Rút tiền
- Yêu cầu rút tiền qua `/rut-tien`
- Admin duyệt thủ công qua `/admin/withdrawals`
- Status: pending → approved → paid (hoặc rejected)
- Số tiền rút phải > 0 và ≤ balance

### Chống gian lận (nhập đơn)
- Unique constraint trên `order_code` → không nhập trùng mã
- Nếu mã đã được nhập bởi user khác → báo lỗi
- Đơn phải qua admin verify trước khi cộng xu

## Affiliate Link

### Modes (ưu tiên từ cao → thấp)
1. **Custom link API** (`AFFILIATE_CUSTOM_LINK_API_URL`): Browser/GQL qua Shopee Affiliate
2. **Template** (`AFFILIATE_LINK_TEMPLATE`): Nối template với placeholders
3. **MMP PID**: Gắn `mmp_pid=an_{AFFILIATE_ID}` vào URL sản phẩm

### Merchants hỗ trợ
- Shopee (`shopee.vn`, `s.shopee.vn`)
- Lazada (`lazada.vn`)
- Tiki (`tiki.vn`)
- TikTok Shop (`tiktok.com`)
