/**
 * TikTok Sale Adapter
 * Fetch sản phẩm TikTok Shop từ AccessTrade Product Feeds API
 */

// AT deep link template for TikTok Shop
const TIKTOK_AT_MERCHANT_ID = "6570088397752993170";
const TIKTOK_AT_CAMPAIGN_ID = "6648523843406889655";
const AT_SUB4 = "oneatweb";

function buildAffiliateUrl(productUrl: string): string {
  const encodedUrl = encodeURIComponent(productUrl);
  return `https://go.isclix.com/deep_link/${TIKTOK_AT_MERCHANT_ID}/${TIKTOK_AT_CAMPAIGN_ID}?sub4=${AT_SUB4}&url=${encodedUrl}`;
}

export type TikTokProduct = {
  id: string;
  title: string;
  imageUrl: string;
  detailLink: string;
  affiliateUrl: string;
  originalPriceMin: number;
  originalPriceMax: number;
  salePriceMin: number;
  salePriceMax: number;
  commissionAmount: number;
  commissionRate: number; // percent, e.g. 10 = 10%
  shopName: string;
  unitsSold: number;
};

type ATProduct = {
  id: string;
  title: string;
  main_image_url: string;
  detail_link: string;
  original_price: {
    currency: string;
    minimum_amount: string;
    maximum_amount: string;
  };
  sales_price: {
    currency: string;
    minimum_amount: string;
    maximum_amount: string;
  };
  commission: {
    amount: string;
    currency: string;
    rate: number; // 1000 = 10%
  };
  shop: { name: string };
  units_sold: number;
};

type ATResponse = {
  data: {
    next_page_token: string;
    products: ATProduct[];
  };
};

function mapProduct(p: ATProduct): TikTokProduct {
  const detailLink = p.detail_link ?? "";
  return {
    id: p.id,
    title: p.title,
    imageUrl: p.main_image_url,
    detailLink,
    affiliateUrl: detailLink ? buildAffiliateUrl(detailLink) : detailLink,
    originalPriceMin: Number(p.original_price?.minimum_amount ?? 0),
    originalPriceMax: Number(p.original_price?.maximum_amount ?? 0),
    salePriceMin: Number(p.sales_price?.minimum_amount ?? 0),
    salePriceMax: Number(p.sales_price?.maximum_amount ?? 0),
    commissionAmount: Number(p.commission?.amount ?? 0),
    commissionRate: (p.commission?.rate ?? 0) / 100, // 1000 → 10%
    shopName: p.shop?.name ?? "TikTok Shop",
    unitsSold: p.units_sold ?? 0,
  };
}

export type TikTokFeed = {
  products: TikTokProduct[];
  nextPageToken: string | null;
  error: string | null;
};

export async function getTikTokProducts(options?: {
  sortField?: string;
  sortOrder?: string;
  limit?: number;
  keyword?: string;
  pageToken?: string;
}): Promise<TikTokFeed> {
  const {
    sortField = "RECOMMENDED",
    sortOrder = "DESC",
    limit = 40,
    pageToken,
  } = options ?? {};

  const token = process.env.ACCESSTRADE_TOKEN;
  if (!token) {
    console.error("[TikTok Sale] ACCESSTRADE_TOKEN not configured");
    return { products: [], nextPageToken: null, error: "Token not configured" };
  }

  const url = new URL(
    "https://pub2-api.accesstrade.vn/v1/tools/tiktok-shop-products"
  );
  url.searchParams.set("sort_field", sortField);
  url.searchParams.set("sort_order", sortOrder);
  url.searchParams.set("limit", String(limit));
  if (pageToken) url.searchParams.set("page_token", pageToken);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      next: { revalidate: 300 }, // cache 5 phút
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[TikTok Sale] API error ${res.status}: ${text}`);
      return { products: [], nextPageToken: null, error: `API error ${res.status}` };
    }

    const json = (await res.json()) as ATResponse;
    const products = (json.data?.products ?? []).map(mapProduct);

    return {
      products,
      nextPageToken: json.data?.next_page_token ?? null,
      error: null,
    };
  } catch (err) {
    console.error("[TikTok Sale] Fetch error:", err);
    return { products: [], nextPageToken: null, error: "Fetch failed" };
  }
}
