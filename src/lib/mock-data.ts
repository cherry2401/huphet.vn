import type { Deal, LiveSession, TrackingLink, Voucher } from "@/lib/types";

export const mockDeals: Deal[] = [
  {
    id: "deal-1",
    slug: "serum-30-off",
    title: "Serum phục hồi da đang giảm sâu 30%",
    category: "beauty",
    salePrice: 189000,
    originalPrice: 269000,
    discountPercent: 30,
    badge: "Deal hot hôm nay",
    affiliateUrl: "https://shopee.vn/serum-aff-link",
    source: "mock-feed",
  },
  {
    id: "deal-2",
    slug: "air-fryer-payday",
    title: "Nồi chiên không dầu khung payday",
    category: "home",
    salePrice: 1299000,
    originalPrice: 1899000,
    discountPercent: 32,
    badge: "Payday",
    affiliateUrl: "https://shopee.vn/airfryer-aff-link",
    source: "mock-feed",
  },
  {
    id: "deal-3",
    slug: "office-headset-flash",
    title: "Tai nghe làm việc flash sale giữa trưa",
    category: "tech",
    salePrice: 459000,
    originalPrice: 699000,
    discountPercent: 34,
    badge: "Flash sale",
    affiliateUrl: "https://shopee.vn/headset-aff-link",
    source: "mock-feed",
  },
];

export const mockLiveSessions: LiveSession[] = [
  {
    id: "live-1",
    slug: "live-skincare-8pm",
    title: "Live skincare tối nay",
    hostName: "Glow House Official",
    startsAt: "2026-03-12T20:00:00+07:00",
    rewardLabel: "Voucher 50k + quà follow",
    affiliateUrl: "https://shopee.vn/live-skincare-aff-link",
    source: "mock-feed",
  },
  {
    id: "live-2",
    slug: "live-home-11am",
    title: "Live đồ gia dụng khung 11h",
    hostName: "Home Select",
    startsAt: "2026-03-13T11:00:00+07:00",
    rewardLabel: "Mã freeship + combo giá sốc",
    affiliateUrl: "https://shopee.vn/live-home-aff-link",
    source: "mock-feed",
  },
];

export const mockVouchers: Voucher[] = [
  {
    id: "voucher-1",
    slug: "freeship-50k",
    title: "Mã freeship toàn sàn",
    code: "FREESHIP50",
    description: "Giảm tối đa 50k cho đơn từ 0đ trong khung campaign.",
    expiresAt: "2026-03-13T23:59:00+07:00",
    affiliateUrl: "https://shopee.vn/freeship-aff-link",
    source: "mock-feed",
  },
  {
    id: "voucher-2",
    slug: "beauty-30k",
    title: "Voucher ngành hàng beauty",
    code: "BEAUTY30",
    description: "Giảm 30k cho đơn beauty từ 299k.",
    expiresAt: "2026-03-14T21:00:00+07:00",
    affiliateUrl: "https://shopee.vn/beauty-voucher-aff-link",
    source: "mock-feed",
  },
];

export const mockTrackingLinks: TrackingLink[] = [
  {
    slug: "serum-30-off",
    url: "https://shopee.vn/serum-aff-link",
    campaign: "daily-deals",
    placement: "deal-grid",
    source: "website",
  },
  {
    slug: "live-skincare-8pm",
    url: "https://shopee.vn/live-skincare-aff-link",
    campaign: "live-hot",
    placement: "live-list",
    source: "website",
  },
  {
    slug: "freeship-50k",
    url: "https://shopee.vn/freeship-aff-link",
    campaign: "voucher-hub",
    placement: "voucher-list",
    source: "website",
  },
];
