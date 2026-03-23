export const sitePrinciples = [
  "Public pages phải tách khỏi tool nội bộ và account operations.",
  "Deal data nên đi qua adapter riêng để dễ thay nguồn và cache.",
  "Tracking click cần chuẩn hóa trước khi scale SEO hoặc ads.",
  "Community traffic là kênh phụ trợ, không phải lõi kiến trúc.",
];

export const referenceReuse = [
  {
    tag: "Nên giữ",
    title: "Landing page theo từng intent",
    description:
      "Cách tách route riêng cho live, flash sale, voucher, cộng đồng là đúng. Nó giúp mỗi trang tập trung một nhu cầu và dễ SEO hơn.",
  },
  {
    tag: "Nên giữ",
    title: "Deal card + countdown + promo bar",
    description:
      "Các pattern hiển thị deal theo giờ, countdown đến khung sale, và card sản phẩm ngắn gọn đều đáng tái sử dụng dưới dạng component sạch.",
  },
  {
    tag: "Nên giữ",
    title: "Static-first deploy trên Vercel",
    description:
      "Public website aff rất hợp với Next.js App Router + ISR hoặc cache để giữ tốc độ và chi phí thấp.",
  },
  {
    tag: "Nên sửa",
    title: "Form funnel vào nhóm cộng đồng",
    description:
      "Có thể dùng cho Telegram/Zalo channel, nhưng nên là block CTA phụ. Đừng để community link trở thành logic chính của site.",
  },
  {
    tag: "Phải bỏ",
    title: "Account manager, token, QR login",
    description:
      "Các module quản lý tài khoản, lưu token ở localStorage, hay thao tác account Shopee không phù hợp với website aff public.",
  },
  {
    tag: "Phải bỏ",
    title: "Hardcode API ngoài repo",
    description:
      "Google Apps Script, Forms, Render endpoint, và binary lạ không nên là nền móng cho project mới nếu bạn muốn maintain lâu dài.",
  },
];

export const affModules = [
  {
    name: "Public Content Layer",
    layer: "App Router pages",
    summary:
      "Các route public để kéo traffic và chuyển đổi: trang chủ, deal hub, live hot, flash sale, voucher, top sản phẩm, blog ngắn.",
    items: [
      "Trang chủ tổng hợp campaign đang chạy",
      "Route riêng cho deal, live, voucher, flash sale",
      "Landing page theo keyword hoặc dịp sale lớn",
    ],
  },
  {
    name: "Data Adapter Layer",
    layer: "src/lib/adapters",
    summary:
      "Một lớp chuẩn hóa nguồn dữ liệu để bạn có thể thay API nội bộ, sheet, crawler, hoặc manual JSON mà không đụng UI.",
    items: [
      "Chuẩn hóa Product, Campaign, LiveSession, Coupon",
      "Có mock data cho local dev",
      "Dễ thêm cache hoặc fallback source",
    ],
  },
  {
    name: "Tracking Layer",
    layer: "redirect + analytics",
    summary:
      "Mọi outbound affiliate link nên đi qua một chuẩn tracking riêng, không rải UTM cứng trong component.",
    items: [
      "Route redirect nội bộ như /go/[slug]",
      "Gắn source, campaign, placement",
      "Ghi click event trước khi chuyển hướng",
    ],
  },
  {
    name: "Admin Separation",
    layer: "private app",
    summary:
      "Nếu cần panel quản lý link, campaign, hoặc import deal, hãy để ở app admin tách biệt hoàn toàn khỏi site public.",
    items: [
      "Admin sau auth riêng",
      "Không commit secret hay token client-side",
      "Không lẫn route internal với route public",
    ],
  },
];

export const sampleDeals = [
  {
    badge: "Deal Hub",
    metric: "SEO + social",
    title: "Trang tổng hợp deal nổi bật trong ngày",
    description:
      "Nhóm deal theo danh mục, giá, mức giảm, và độ hot. Đây là trang dễ scale content và kéo organic traffic nhất.",
  },
  {
    badge: "Live",
    metric: "Conversion",
    title: "Trang live hot và khung giờ nhận xu",
    description:
      "Hiển thị live sắp chạy, countdown, CTA vào live, và note shop nên follow. Giữ dạng public-info, không nhúng tool nội bộ.",
  },
  {
    badge: "Voucher",
    metric: "Retention",
    title: "Trang voucher và mã freeship",
    description:
      "Cập nhật mã ngắn, dễ copy, có trạng thái còn hạn hay đã hết. Đây là block giữ người dùng quay lại nhiều lần trong ngày.",
  },
];

export const implementationPhases = [
  {
    title: "Khóa domain model",
    description:
      "Chốt types cho Product, DealCampaign, LiveSession, Coupon, TrackingLink để mọi route dùng chung một ngôn ngữ dữ liệu.",
  },
  {
    title: "Chọn nguồn dữ liệu thật",
    description:
      "Ưu tiên một adapter ổn định: API riêng, sheet đã cache, hoặc import CMS. Tránh để UI gọi trực tiếp nhiều endpoint công khai lẻ tẻ.",
  },
  {
    title: "Thêm tracking redirect",
    description:
      "Tạo route redirect nội bộ để chuẩn hóa affiliate link, placement, UTM, và event logging.",
  },
  {
    title: "Bổ sung trang nội dung",
    description:
      "Xây deal hub, live hot, voucher page, và landing page cho các dịp như payday, 15.15, 11.11, 12.12.",
  },
];
