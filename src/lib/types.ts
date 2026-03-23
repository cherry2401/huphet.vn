export type DealCategory = "beauty" | "fashion" | "home" | "tech";
export type SiteCacheKind = "microsite" | "deals" | "partner-status";
export type DataSourceKind =
  | "mock-feed"
  | "shopee-collection"
  | "browser-worker"
  | "voucher-grid"
  | "anchor"
  | "partner-api";
export type DealSlotKey = "0000" | "0900" | "1200" | "1500" | "2000";

export type Deal = {
  id: string;
  slug: string;
  title: string;
  category: DealCategory;
  salePrice: number;
  originalPrice: number;
  discountPercent: number;
  badge: string;
  affiliateUrl: string;
  productUrl?: string;
  source: string;
  imageUrl?: string;
  shopId?: number;
  itemId?: number;
  collectionId?: number;
  collectionName?: string;
  ratingStar?: number;
  stock?: number;
  sourceKind?: DataSourceKind;
};

export type LiveSession = {
  id: string;
  slug: string;
  title: string;
  hostName: string;
  startsAt: string;
  rewardLabel: string;
  affiliateUrl: string;
  source: string;
  maxcoin?: number;
};

export type Voucher = {
  id: string;
  slug: string;
  title: string;
  code: string;
  description: string;
  expiresAt: string;
  affiliateUrl: string;
  source: string;
  percentageUsed?: number;
  imageUrl?: string;
  timeLeft?: string;
};

export type TrackingLink = {
  slug: string;
  url: string;
  campaign: string;
  placement: string;
  source: string;
};

export type ShopeeTabAnchor = {
  label: string;
  anchoredComponentIds: string[];
};

export type ShopeeProductCollection = {
  feId: string;
  componentName: string;
  collectionId: number;
  hook: string | null;
};

export type ShopeeVoucherCollection = {
  componentId: number;
  feId: string;
  micrositeId: number | null;
  componentName: string;
  voucherCollectionId: string;
  numberOfVouchersPerRow: number;
  hook: string | null;
};

export type ShopeeFlashSaleConfig = {
  feId: string;
  componentName: string;
  categoryId: number | null;
  redirectUrl: string | null;
};

export type ShopeeMicrositeSummary = {
  pageUrl: string;
  micrositeId: number | null;
  anchors: ShopeeTabAnchor[];
  productCollections: ShopeeProductCollection[];
  voucherCollections: ShopeeVoucherCollection[];
  flashSales: ShopeeFlashSaleConfig[];
};

export type CachedDocument<T> = {
  generatedAt: string;
  pageUrl: string;
  data: T;
};

export type DealSlotSnapshot = {
  slot: string;
  generatedAt: string;
  count: number;
  cacheKey: string;
};

export type DealSlotTab = {
  slot: string;
  label: string;
  sub: string;
  startTimeSec?: number;
  endTimeSec?: number;
};

export type PartnerSlotSyncStatus = {
  slot: string;
  ok: boolean;
  dealCount: number;
  error: string | null;
};

export type PartnerSyncStatus = {
  pageUrl: string;
  generatedAt: string;
  updatedSlots: string[];
  dealCount: number;
  errors: string[];
  slotResults: PartnerSlotSyncStatus[];
  slotTabs: DealSlotTab[];
  affiliate: {
    mode: "passthrough" | "template" | "http" | "mmp_pid" | "custom-link";
    rewritten: number;
    fallback: number;
    customLink?: {
      requested: number;
      converted: number;
      failed: number;
      mmpFallback: number;
      sessionStatus: "ok" | "login_required" | "blocked" | "unexpected_page" | "transport_error";
      error: string | null;
      subIds: {
        sub_id1: string;
        sub_id2: string;
        sub_id3: string;
        sub_id4: string;
        sub_id5: string;
      };
    };
  };
};
