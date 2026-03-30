import { NextResponse } from "next/server";
import { createShortLink } from "@/lib/short-links/store";

type Body = {
  productUrl?: string;
  subId1?: string;
  shorten?: boolean;
};

function isShopeeUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.hostname.includes("shopee.vn");
  } catch {
    return false;
  }
}

/**
 * Resolve a short Shopee URL (s.shopee.vn/xxx) to the full product URL
 * by following the redirect chain.
 */
async function resolveShortLink(shortUrl: string): Promise<string> {
  try {
    const parsed = new URL(shortUrl);
    // Only resolve s.shopee.vn short links
    if (parsed.hostname !== "s.shopee.vn" || parsed.pathname === "/an_redir") {
      return shortUrl;
    }
    const res = await fetch(shortUrl, { redirect: "manual" });
    const location = res.headers.get("location");
    if (location && location.includes("shopee.vn")) {
      return location;
    }
    return shortUrl;
  } catch {
    return shortUrl;
  }
}

/**
 * Extract shopId and itemId from a Shopee product URL.
 * Supports: shopee.vn/product-name-i.{shopId}.{itemId}
 *           shopee.vn/opaanlp/{shopId}/{itemId}
 */
function extractShopeeIds(productUrl: string): { shopId: string; itemId: string } | null {
  try {
    const url = new URL(productUrl);
    const path = url.pathname;
    const iMatch = path.match(/-i\.(\d+)\.(\d+)/);
    if (iMatch) return { shopId: iMatch[1], itemId: iMatch[2] };
    const slashMatch = path.match(/\/(?:opaanlp|product)\/(\d+)\/(\d+)/);
    if (slashMatch) return { shopId: slashMatch[1], itemId: slashMatch[2] };
    return null;
  } catch {
    return null;
  }
}

function buildShopeeAffLink(productUrl: string, subId1: string) {
  const affiliateId = process.env.AFFILIATE_ID ?? "";
  const fbSubId = `addlivetag-${subId1}---`;

  // Match cuongtws.vn format exactly: /opaanlp/ + share_channel_code=4 + addlivetag- prefix
  // share_channel_code=4 = Facebook channel — triggers FB exclusive voucher 22%
  const ids = extractShopeeIds(productUrl);
  if (ids && affiliateId) {
    const cleanOriginLink = `https://shopee.vn/opaanlp/${ids.shopId}/${ids.itemId}`;
    return `https://s.shopee.vn/an_redir?origin_link=${encodeURIComponent(cleanOriginLink)}&share_channel_code=4&affiliate_id=${affiliateId}&sub_id=${fbSubId}`;
  }

  // Fallback: still use share_channel_code=4 + addlivetag format with original URL
  if (affiliateId) {
    return `https://s.shopee.vn/an_redir?origin_link=${encodeURIComponent(productUrl)}&share_channel_code=4&affiliate_id=${affiliateId}&sub_id=${fbSubId}`;
  }

  // Last resort: MMP params (no affiliate ID configured)
  const url = new URL(productUrl);
  url.searchParams.set("utm_medium", "affiliates");
  url.searchParams.set("utm_content", subId1 || "web");
  url.searchParams.set("utm_campaign", "-");
  return url.toString();
}

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  let productUrl = body.productUrl?.trim() ?? "";
  const subId1 = (body.subId1 ?? process.env.AFFILIATE_SUB_ID1 ?? "web").trim();
  const shorten = body.shorten !== false;

  if (!isShopeeUrl(productUrl)) {
    return NextResponse.json(
      { ok: false, error: "Vui long nhap link shopee.vn hop le." },
      { status: 400 },
    );
  }

  // Resolve short links (s.shopee.vn/xxx) → full product URL
  productUrl = await resolveShortLink(productUrl);

  const affiliateUrl = buildShopeeAffLink(productUrl, subId1);

  if (!shorten) {
    return NextResponse.json({
      ok: true,
      productUrl,
      affiliateUrl,
      shortUrl: null,
    });
  }

  const created = await createShortLink(affiliateUrl);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return NextResponse.json({
    ok: true,
    productUrl,
    affiliateUrl,
    shortUrl: `${appUrl}/l/${created.code}`,
  });
}

