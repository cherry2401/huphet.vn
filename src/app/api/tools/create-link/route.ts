import { NextResponse } from "next/server";
import { createShortLink } from "@/lib/short-links/store";
import { createRateLimiter, getClientIP } from "@/lib/rate-limit";

// 20 link creations per minute per IP
const linkLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

type Body = {
  productUrl?: string;
  subId1?: string;
  shorten?: boolean;
  provider?: "shopee" | "lazada" | "tiktok";
};

function detectProvider(url: string): "shopee" | "lazada" | "tiktok" | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("shopee.vn") || host.includes("shp.ee")) return "shopee";
    if (host.includes("lazada.vn") || host.includes("lzd.co")) return "lazada";
    if (host.includes("tiktok.com") || host.includes("vt.tiktok.com")) return "tiktok";
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract shopId and itemId from a Shopee product URL.
 * Supports formats:
 *   - shopee.vn/product-name-i.{shopId}.{itemId}
 *   - shopee.vn/opaanlp/{shopId}/{itemId}
 *   - shopee.vn/product/{shopId}/{itemId}
 */
function extractShopeeIds(productUrl: string): { shopId: string; itemId: string } | null {
  try {
    const url = new URL(productUrl);
    const path = url.pathname;

    // Format: /product-name-i.shopId.itemId
    const iMatch = path.match(/-i\.(\d+)\.(\d+)/);
    if (iMatch) return { shopId: iMatch[1], itemId: iMatch[2] };

    // Format: /opaanlp/shopId/itemId or /product/shopId/itemId
    const slashMatch = path.match(/\/(?:opaanlp|product)\/(\d+)\/(\d+)/);
    if (slashMatch) return { shopId: slashMatch[1], itemId: slashMatch[2] };

    return null;
  } catch {
    return null;
  }
}

function buildShopeeLink(productUrl: string, subId1: string): string {
  const affiliateId = process.env.AFFILIATE_ID ?? "";

  // Use /product/ format (NOT /opaanlp/) — required for FB voucher activation
  const ids = extractShopeeIds(productUrl);
  if (ids && affiliateId) {
    const cleanOriginLink = `https://shopee.vn/product/${ids.shopId}/${ids.itemId}`;
    return `https://s.shopee.vn/an_redir?origin_link=${encodeURIComponent(cleanOriginLink)}&affiliate_id=${affiliateId}&sub_id=${subId1}`;
  }

  // Fallback: use template or MMP if can't extract IDs
  const template = process.env.AFFILIATE_LINK_TEMPLATE;
  if (template) {
    return template
      .replaceAll("{{encodedProductUrl}}", encodeURIComponent(productUrl))
      .replaceAll("{{productUrl}}", productUrl)
      .replaceAll("{{affiliateId}}", affiliateId)
      .replaceAll("{{sub_id1}}", subId1)
      .replaceAll("{{sub_id2}}", "")
      .replaceAll("{{sub_id3}}", "")
      .replaceAll("{{sub_id4}}", "")
      .replaceAll("{{sub_id5}}", "");
  }
  // Fallback MMP
  const url = new URL(productUrl);
  if (affiliateId) {
    url.searchParams.set("mmp_pid", `an_${affiliateId}`);
    url.searchParams.set("utm_source", `an_${affiliateId}`);
  }
  url.searchParams.set("utm_medium", "affiliates");
  url.searchParams.set("utm_content", subId1 || "web");
  url.searchParams.set("utm_campaign", "-");
  return url.toString();
}

function buildLazadaLink(productUrl: string, subId1: string): string {
  // Lazada: base64-encode the URL into url_enc parameter
  const base64Url = Buffer.from(productUrl).toString("base64");
  const publisherId = "6570088397752993170";
  const campaignId = "5127144557053758578";
  return `https://go.isclix.com/deep_link/v5/${publisherId}/${campaignId}?sub4=${encodeURIComponent(subId1)}&url_enc=${encodeURIComponent(base64Url)}`;
}

function buildTiktokLink(productUrl: string, subId1: string): string {
  // TikTok: URL-encode the product URL into url parameter
  const publisherId = "6570088397752993170";
  const campaignId = "6648523843406889655";
  return `https://go.isclix.com/deep_link/${publisherId}/${campaignId}?sub4=${encodeURIComponent(subId1)}&url=${encodeURIComponent(productUrl)}`;
}

export async function POST(request: Request) {
  // Rate limit
  const ip = getClientIP(request);
  if (!linkLimiter.check(ip)) {
    return NextResponse.json({ error: "Quá nhiều yêu cầu, thử lại sau" }, { status: 429 });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const productUrl = body.productUrl?.trim() ?? "";
  const subId1 = (body.subId1 ?? process.env.AFFILIATE_SUB_ID1 ?? "web").trim();
  const shorten = body.shorten !== false;

  if (!productUrl) {
    return NextResponse.json(
      { ok: false, error: "Vui lòng nhập link sản phẩm." },
      { status: 400 },
    );
  }

  // Auto-detect or use specified provider
  const provider = body.provider ?? detectProvider(productUrl);

  if (!provider) {
    return NextResponse.json(
      { ok: false, error: "Không nhận diện được sàn. Vui lòng nhập link từ Shopee, Lazada hoặc TikTok Shop." },
      { status: 400 },
    );
  }

  let affiliateUrl: string;
  switch (provider) {
    case "shopee":
      affiliateUrl = buildShopeeLink(productUrl, subId1);
      break;
    case "lazada":
      affiliateUrl = buildLazadaLink(productUrl, subId1);
      break;
    case "tiktok":
      affiliateUrl = buildTiktokLink(productUrl, subId1);
      break;
  }

  if (!shorten) {
    return NextResponse.json({
      ok: true,
      provider,
      productUrl,
      affiliateUrl,
      shortUrl: null,
    });
  }

  const created = await createShortLink(affiliateUrl);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return NextResponse.json({
    ok: true,
    provider,
    productUrl,
    affiliateUrl,
    shortUrl: `${appUrl}/l/${created.code}`,
  });
}
