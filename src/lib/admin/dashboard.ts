import {
  getCacheBackendInfo,
  getCachedPartnerSyncStatus,
  getCachedDeals,
  getCachedMicrositeSummary,
  getCachePaths,
  listCachedDealSnapshots,
} from "@/lib/shopee/cache";
import { getShopeeDebugConfig } from "@/lib/shopee/client";
import { getSlotForTimestamp } from "@/lib/deal-filters";

async function getPartnerHealth() {
  const endpoint =
    process.env.TIENVE_FLASH_DEALS_API_URL ?? "https://api.tienve.vn/api/v1/flash-deals/partner";
  const startedAt = Date.now();

  try {
    const url = new URL(endpoint);
    url.searchParams.set("mode", "flash-sale");
    url.searchParams.set("priceRange", "1K");
    url.searchParams.set("page", "1");
    url.searchParams.set("pageSize", "1");

    const response = await fetch(url.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    return {
      endpoint,
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
      error: response.ok ? null : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      endpoint,
      ok: false,
      status: null,
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Partner API unreachable",
    };
  }
}

export async function getAdminDashboardData(pageUrl = "shopee-sieu-re") {
  const partnerPageUrl = process.env.TIENVE_CACHE_PAGE_URL ?? "tienve-partner";
  const [
    micrositeCache,
    dealsCache,
    dealSnapshots,
    partnerDealsCache,
    partnerDealSnapshots,
    partnerSyncStatus,
    partnerHealth,
  ] =
    await Promise.all([
    getCachedMicrositeSummary(pageUrl),
    getCachedDeals(pageUrl),
    listCachedDealSnapshots(pageUrl),
    getCachedDeals(partnerPageUrl),
    listCachedDealSnapshots(partnerPageUrl),
    getCachedPartnerSyncStatus(partnerPageUrl),
    getPartnerHealth(),
  ]);

  return {
    pageUrl,
    partnerPageUrl,
    cachePaths: getCachePaths(pageUrl),
    partnerCachePaths: getCachePaths(partnerPageUrl),
    cacheBackend: getCacheBackendInfo(),
    shopee: getShopeeDebugConfig(),
    partner: {
      apiHealth: partnerHealth,
      cacheGeneratedAt: partnerDealsCache?.generatedAt ?? null,
      dealCount: partnerDealsCache?.data.length ?? 0,
      latestDealSlot: partnerDealsCache?.generatedAt
        ? getSlotForTimestamp(partnerDealsCache.generatedAt)
        : null,
      dealSnapshots: partnerDealSnapshots,
      syncStatus: partnerSyncStatus?.data ?? null,
      affiliateConfig: {
        affiliateId: process.env.AFFILIATE_ID ?? "",
        customLinkApiUrl: process.env.AFFILIATE_CUSTOM_LINK_API_URL ?? "",
        subIds: {
          sub_id1: process.env.AFFILIATE_SUB_ID1 ?? "",
          sub_id2: process.env.AFFILIATE_SUB_ID2 ?? "",
          sub_id3: process.env.AFFILIATE_SUB_ID3 ?? "",
          sub_id4: process.env.AFFILIATE_SUB_ID4 ?? "",
          sub_id5: process.env.AFFILIATE_SUB_ID5 ?? "",
        },
      },
    },
    cache: {
      micrositeGeneratedAt: micrositeCache?.generatedAt ?? null,
      dealsGeneratedAt: dealsCache?.generatedAt ?? null,
      dealCount: dealsCache?.data.length ?? 0,
      collectionCount: micrositeCache?.data.productCollections.length ?? 0,
      voucherCollectionCount: micrositeCache?.data.voucherCollections.length ?? 0,
      flashSaleCount: micrositeCache?.data.flashSales.length ?? 0,
      latestDealSlot: dealsCache?.generatedAt ? getSlotForTimestamp(dealsCache.generatedAt) : null,
      dealSnapshots,
      anchors: micrositeCache?.data.anchors ?? [],
      voucherCollections: micrositeCache?.data.voucherCollections ?? [],
    },
  };
}
