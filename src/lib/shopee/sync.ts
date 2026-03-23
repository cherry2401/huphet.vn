import type { Deal, ShopeeMicrositeSummary } from "@/lib/types";
import {
  getShopeeCollectionDeals,
  getShopeeMicrositeSummary,
} from "@/lib/shopee/microsite";
import {
  writeCachedDeals,
  writeCachedMicrositeSummary,
  getCachePaths,
  getCacheBackendInfo,
} from "@/lib/shopee/cache";
import { getShopeeDebugConfig } from "@/lib/shopee/client";
import { getSlotForTimestamp } from "@/lib/deal-filters";

type SyncResult = {
  pageUrl: string;
  microsite: ShopeeMicrositeSummary;
  deals: Deal[];
  errors: string[];
  cachePaths: ReturnType<typeof getCachePaths> & ReturnType<typeof getCacheBackendInfo>;
  debug: ReturnType<typeof getShopeeDebugConfig>;
};

function rankCollectionName(name: string) {
  const normalized = name.toLowerCase();

  if (/top deal|deal|flash|rebate|sieu re|siêu rẻ/.test(normalized)) {
    return 3;
  }

  if (/flatprice|choice|seasonal|addon/.test(normalized)) {
    return 2;
  }

  return 1;
}

export async function syncShopeeCache(pageUrl = "shopee-sieu-re"): Promise<SyncResult> {
  const errors: string[] = [];
  const microsite = await getShopeeMicrositeSummary(pageUrl);
  const rankedCollections = microsite.productCollections
    .map((collection) => ({
      ...collection,
      score: rankCollectionName(collection.componentName),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  const deals: Deal[] = [];

  for (const collection of rankedCollections) {
    try {
      const items = await getShopeeCollectionDeals(
        collection.collectionId,
        collection.componentName,
      );
      deals.push(...items);
    } catch (error) {
      errors.push(
        `collection ${collection.collectionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  const uniqueDeals = dedupeDeals(
    deals.toSorted((left, right) => right.discountPercent - left.discountPercent),
  );
  const generatedAt = new Date().toISOString();
  const slotKey = getSlotForTimestamp(generatedAt);

  await Promise.all([
    writeCachedMicrositeSummary(pageUrl, microsite, generatedAt),
    writeCachedDeals(pageUrl, uniqueDeals, undefined, generatedAt),
    writeCachedDeals(pageUrl, uniqueDeals, slotKey, generatedAt),
  ]);

  return {
    pageUrl,
    microsite,
    deals: uniqueDeals,
    errors,
    cachePaths: {
      ...getCachePaths(pageUrl),
      ...getCacheBackendInfo(),
    },
    debug: getShopeeDebugConfig(),
  };
}

function dedupeDeals(entries: Deal[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.id)) {
      return false;
    }
    seen.add(entry.id);
    return true;
  });
}
