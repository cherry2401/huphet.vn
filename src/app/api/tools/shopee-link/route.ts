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

function buildFromTemplate(productUrl: string, subId1: string) {
  const template = process.env.AFFILIATE_LINK_TEMPLATE;
  if (!template) {
    return null;
  }

  return template
    .replaceAll("{{encodedProductUrl}}", encodeURIComponent(productUrl))
    .replaceAll("{{productUrl}}", productUrl)
    .replaceAll("{{affiliateId}}", process.env.AFFILIATE_ID ?? "")
    .replaceAll("{{sub_id1}}", subId1)
    .replaceAll("{{sub_id2}}", "")
    .replaceAll("{{sub_id3}}", "")
    .replaceAll("{{sub_id4}}", "")
    .replaceAll("{{sub_id5}}", "");
}

function buildFromMmp(productUrl: string, subId1: string) {
  const url = new URL(productUrl);
  const affiliateId = process.env.AFFILIATE_ID ?? "";
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

  const affiliateUrl = buildFromTemplate(productUrl, subId1) ?? buildFromMmp(productUrl, subId1);

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

