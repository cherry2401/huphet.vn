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

  // Use /product/ format (NOT /opaanlp/) — required for FB voucher activation
  // Prefix addlivetag- to sub_id — Shopee uses this to identify FB traffic for exclusive vouchers
  const ids = extractShopeeIds(productUrl);
  if (ids && affiliateId) {
    const cleanOriginLink = `https://shopee.vn/product/${ids.shopId}/${ids.itemId}`;
    const fbSubId = `addlivetag-${subId1}---`;
    return `https://s.shopee.vn/an_redir?origin_link=${encodeURIComponent(cleanOriginLink)}&affiliate_id=${affiliateId}&sub_id=${fbSubId}`;
  }

  // Fallback: template
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

  // Fallback: MMP params
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

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const productUrl = body.productUrl?.trim() ?? "";
  const subId1 = (body.subId1 ?? process.env.AFFILIATE_SUB_ID1 ?? "web").trim();
  const shorten = body.shorten !== false;

  if (!isShopeeUrl(productUrl)) {
    return NextResponse.json(
      { ok: false, error: "Vui long nhap link shopee.vn hop le." },
      { status: 400 },
    );
  }

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

