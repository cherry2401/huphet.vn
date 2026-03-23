/**
 * AccessTrade API Helper Module
 * Tái sử dụng cho: submit-order, cashback link, cronjob sync
 */

const AT_BASE = "https://api.accesstrade.vn/v1";

function getHeaders(): HeadersInit {
  const token = process.env.ACCESSTRADE_API_KEY;
  if (!token) throw new Error("ACCESSTRADE_API_KEY is not configured");
  return {
    Authorization: `Token ${token}`,
    "Content-Type": "application/json",
  };
}

// ========================
// 1. Verify Order (Tra cứu đơn hàng bằng mã đơn)
// ========================

export type ATTransaction = {
  transaction_id: string;
  status: number; // 0=pending, 1=approved, 2=rejected
  merchant: string;
  transaction_value: number;
  commission: number;
  product_name: string | null;
  product_image: string | null;
  product_category: string | null;
  click_time: string | null;
  transaction_time: string | null;
  update_time: string | null;
  confirmed_time: string | null;
  is_confirmed: number;
  reason_reject: string | null;
  customer_type: string | null;
  conversion_id: string | null;
  _utm_source: string | null;
  _utm_medium: string | null;
  _utm_campaign: string | null;
  _utm_content: string | null;
};

/**
 * Tra cứu đơn hàng trên AccessTrade bằng transaction_id (mã đơn hàng).
 * Trả về transaction đầu tiên match hoặc null nếu không tìm thấy.
 */
export async function verifyOrder(
  orderCode: string
): Promise<ATTransaction | null> {
  try {
    // Search trong khoảng 90 ngày gần nhất
    const until = new Date();
    const since = new Date(until.getTime() - 90 * 24 * 60 * 60 * 1000);

    const url = new URL(`${AT_BASE}/transactions`);
    url.searchParams.set("since", since.toISOString());
    url.searchParams.set("until", until.toISOString());
    url.searchParams.set("transaction_id", orderCode);
    url.searchParams.set("limit", "5");

    const res = await fetch(url.toString(), { headers: getHeaders() });

    if (!res.ok) {
      console.error(
        `[AT verifyOrder] API error ${res.status}:`,
        await res.text()
      );
      return null;
    }

    const json = await res.json();
    const data = json.data;

    if (!Array.isArray(data) || data.length === 0) return null;

    // Trả về transaction đầu tiên match
    return data[0] as ATTransaction;
  } catch (err) {
    console.error("[AT verifyOrder] Error:", err);
    return null;
  }
}

// ========================
// 2. Tạo Tracking Link (AccessTrade Deep Link + Short Link)
// ========================

export type ATTrackingResult = {
  affLink: string;
  shortLink: string;
  urlOrigin: string;
};

/**
 * Gọi AccessTrade API tạo tracking link với sub1 tracking user.
 * campaignId: ID chiến dịch trên AT (VD: Shopee VN)
 * productUrl: Link sản phẩm gốc
 * userId: UUID prefix 8 ký tự của user (để tracking cashback)
 */
export async function createTrackingLink(
  campaignId: string,
  productUrl: string,
  userId: string
): Promise<ATTrackingResult | null> {
  try {
    const res = await fetch(`${AT_BASE}/product_link/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        campaign_id: campaignId,
        urls: [productUrl],
        url_enc: true,
        sub1: `cb_${userId.slice(0, 8)}`, // Tracking user
        sub4: "huphet", // Source identifier
        utm_source: "huphet",
        utm_medium: "website",
        utm_campaign: "cashback",
      }),
    });

    if (!res.ok) {
      console.error(
        `[AT createTrackingLink] API error ${res.status}:`,
        await res.text()
      );
      return null;
    }

    const json = await res.json();

    if (!json.success || !json.data?.success_link?.length) {
      console.error("[AT createTrackingLink] No success links:", json);
      return null;
    }

    const link = json.data.success_link[0];
    return {
      affLink: link.aff_link,
      shortLink: link.short_link,
      urlOrigin: link.url_origin,
    };
  } catch (err) {
    console.error("[AT createTrackingLink] Error:", err);
    return null;
  }
}

// ========================
// 3. Fetch Conversions (Lấy danh sách giao dịch cho cronjob)
// ========================

/**
 * Lấy danh sách giao dịch từ AccessTrade trong khoảng thời gian.
 * since/until: format "YYYY-MM-DD"
 * page: trang (bắt đầu từ 1)
 */
export async function fetchConversions(
  since: string,
  until: string,
  page = 1,
  limit = 100
): Promise<ATTransaction[]> {
  const url = new URL(`${AT_BASE}/transactions`);
  url.searchParams.set("since", `${since}T00:00:00Z`);
  url.searchParams.set("until", `${until}T23:59:59Z`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("page", String(page));

  const res = await fetch(url.toString(), { headers: getHeaders() });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AccessTrade API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return (json.data ?? []) as ATTransaction[];
}

// ========================
// 4. Helpers
// ========================

/** Map AT status number → hệ thống status string */
export function mapATStatus(
  atStatus: number
): "pending" | "approved" | "rejected" {
  if (atStatus === 1) return "approved";
  if (atStatus === 2) return "rejected";
  return "pending";
}

/** Tính cashback cho user dựa trên commission */
export function calcCashback(commission: number, rate = 0.7): number {
  return Math.round(commission * rate);
}

/** Lấy campaign ID cho merchant */
export function getCampaignId(merchant: string): string | null {
  const campaignMap: Record<string, string | undefined> = {
    shopee: process.env.ACCESSTRADE_MERCHANT_ID,
    lazada: "5127144557053758578",
    tiktok: "6648523843406889655",
  };
  return campaignMap[merchant.toLowerCase()] ?? null;
}
