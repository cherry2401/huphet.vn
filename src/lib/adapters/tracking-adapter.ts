import { cache } from "react";
import { mockTrackingLinks } from "@/lib/mock-data";
import { getCachedDeals, listCachedDealSnapshots } from "@/lib/shopee/cache";
import type { TrackingLink } from "@/lib/types";

function isValidTargetUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function findTrackingFromCache(pageUrl: string, slug: string): Promise<TrackingLink | null> {
  const latest = await getCachedDeals(pageUrl);
  const latestFound = latest?.data.find((deal) => deal.slug === slug);

  if (latestFound && isValidTargetUrl(latestFound.affiliateUrl)) {
    return {
      slug,
      url: latestFound.affiliateUrl,
      campaign: "deal-click",
      placement: "deal-grid",
      source: "website",
    };
  }

  const snapshots = await listCachedDealSnapshots(pageUrl);
  for (const snapshot of snapshots.slice(0, 12)) {
    const slotCached = await getCachedDeals(pageUrl, snapshot.slot);
    const slotFound = slotCached?.data.find((deal) => deal.slug === slug);

    if (slotFound && isValidTargetUrl(slotFound.affiliateUrl)) {
      return {
        slug,
        url: slotFound.affiliateUrl,
        campaign: "deal-click",
        placement: "deal-grid",
        source: "website",
      };
    }
  }

  return null;
}

export const getTrackingLinkBySlug = cache(
  async (slug: string): Promise<TrackingLink | null> => {
    const partnerPageUrl = process.env.TIENVE_CACHE_PAGE_URL ?? "tienve-partner";
    const fromPartnerCache = await findTrackingFromCache(partnerPageUrl, slug);
    if (fromPartnerCache) {
      return fromPartnerCache;
    }

    const fromShopeeCache = await findTrackingFromCache("shopee-sieu-re", slug);
    if (fromShopeeCache) {
      return fromShopeeCache;
    }

    const found = mockTrackingLinks.find((item) => item.slug === slug);
    return found ?? null;
  },
);
