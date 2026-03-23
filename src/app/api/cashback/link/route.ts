import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTrackingLink, getCampaignId } from "@/lib/accesstrade";

function isValidEcomUrl(value: string): { valid: boolean; merchant: string } {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("shopee.vn") || host.includes("s.shopee.vn"))
      return { valid: true, merchant: "shopee" };
    if (host.includes("lazada.vn")) return { valid: true, merchant: "lazada" };
    if (host.includes("tiki.vn")) return { valid: true, merchant: "tiki" };
    if (host.includes("tiktok.com")) return { valid: true, merchant: "tiktok" };
    return { valid: false, merchant: "" };
  } catch {
    return { valid: false, merchant: "" };
  }
}

// Fallback: tạo link bằng Shopee Affiliate template cũ
function buildFallbackLink(productUrl: string, userId: string): string | null {
  const template = process.env.AFFILIATE_LINK_TEMPLATE;
  if (!template) return null;

  return template
    .replaceAll("{{encodedProductUrl}}", encodeURIComponent(productUrl))
    .replaceAll("{{productUrl}}", productUrl)
    .replaceAll("{{affiliateId}}", process.env.AFFILIATE_ID ?? "")
    .replaceAll("{{sub_id1}}", `cb_${userId.slice(0, 8)}`)
    .replaceAll("{{sub_id2}}", "")
    .replaceAll("{{sub_id3}}", "")
    .replaceAll("{{sub_id4}}", "")
    .replaceAll("{{sub_id5}}", "");
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Vui lòng đăng nhập để sử dụng hoàn tiền." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const productUrl = (body.productUrl ?? "").trim();

    if (!productUrl) {
      return NextResponse.json(
        { ok: false, error: "Vui lòng nhập link sản phẩm." },
        { status: 400 }
      );
    }

    const { valid, merchant } = isValidEcomUrl(productUrl);
    if (!valid) {
      return NextResponse.json(
        {
          ok: false,
          error: "Chỉ hỗ trợ link từ Shopee, Lazada, Tiki, TikTok Shop.",
        },
        { status: 400 }
      );
    }

    // === Thử tạo tracking link qua AccessTrade API ===
    let affiliateUrl: string | null = null;
    let shortLink: string | null = null;
    let source: "accesstrade" | "template" = "template";

    const campaignId = getCampaignId(merchant);

    if (campaignId) {
      const atResult = await createTrackingLink(
        campaignId,
        productUrl,
        user.id
      );

      if (atResult) {
        affiliateUrl = atResult.affLink;
        shortLink = atResult.shortLink;
        source = "accesstrade";

      }
    }

    // Fallback: dùng Shopee Affiliate template cũ
    if (!affiliateUrl) {
      affiliateUrl = buildFallbackLink(productUrl, user.id);
      if (!affiliateUrl) {
        return NextResponse.json(
          { ok: false, error: "Chưa cấu hình affiliate link." },
          { status: 500 }
        );
      }

    }

    // Save cashback order
    await supabase.from("cashback_orders").insert({
      user_id: user.id,
      product_url: productUrl,
      affiliate_url: affiliateUrl,
      merchant,
      status: "clicked",
      cashback_rate: 70,
    });

    return NextResponse.json({
      ok: true,
      affiliateUrl: shortLink ?? affiliateUrl, // Ưu tiên short link nếu có
      fullAffiliateUrl: affiliateUrl, // Link đầy đủ (backup)
      merchant,
      source, // "accesstrade" hoặc "template"
    });
  } catch (err) {
    console.error("Cashback link error:", err);
    return NextResponse.json(
      { ok: false, error: "Đã có lỗi xảy ra, vui lòng thử lại." },
      { status: 500 }
    );
  }
}
