import { cache } from "react";
import type { LiveSession } from "@/lib/types";

type TienVeXuItem = {
  drawId: number;
  sessionId: number;
  userId: number;
  shopId: string;
  userName: string;
  startTime: number;
  slot: number;
  maxcoin: number;
  viewer_count: string;
};

type TienVeXuResponse = {
  success: boolean;
  data: TienVeXuItem[];
};

const API_URL = "https://api.tienve.vn/api/v1/flash-deals/shopee-xu";

function buildLiveAffiliateUrl(sessionId: number): string {
  const liveUrl = `https://live.shopee.vn/share?from=live&session=${sessionId}`;
  const template = process.env.AFFILIATE_LINK_TEMPLATE;
  const affiliateId = process.env.AFFILIATE_ID ?? "";
  const subId1 = process.env.AFFILIATE_SUB_ID1 ?? "huphet";

  if (template && affiliateId) {
    return template
      .replaceAll("{{encodedProductUrl}}", encodeURIComponent(liveUrl))
      .replaceAll("{{productUrl}}", liveUrl)
      .replaceAll("{{affiliateId}}", affiliateId)
      .replaceAll("{{sub_id1}}", subId1);
  }

  return liveUrl;
}

function mapXuItemToSession(item: TienVeXuItem): LiveSession {
  let startsAt: string;
  try {
    const d = new Date(item.startTime);
    startsAt = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    startsAt = new Date().toISOString();
  }

  return {
    id: `xu-${item.drawId}`,
    slug: `xu-${item.drawId}`,
    title: item.userName,
    hostName: item.userName,
    startsAt,
    rewardLabel: `${item.maxcoin.toLocaleString("vi-VN")} xu`,
    affiliateUrl: buildLiveAffiliateUrl(item.sessionId),
    source: "tienve-xu-api",
    maxcoin: item.maxcoin,
  };
}

export const getLiveSessions = cache(async (): Promise<LiveSession[]> => {
  try {
    const res = await fetch(API_URL, {
      next: { revalidate: 60 }, // Cache 60s, background revalidation
    });

    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }

    const json: TienVeXuResponse = await res.json();

    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
      throw new Error("API returned no data");
    }

    return json.data
      .map(mapXuItemToSession)
      .sort((a, b) => (b.maxcoin ?? 0) - (a.maxcoin ?? 0));
  } catch (error) {
    console.error("[live-adapter] Failed to fetch Shopee Xu:", error);
    return [];
  }
});
