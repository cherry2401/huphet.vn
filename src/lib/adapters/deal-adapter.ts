import { getSlotForTimestamp, slotLabels, slotOptions } from "@/lib/deal-filters";
import { mockDeals } from "@/lib/mock-data";
import {
  getCachedDeals,
  getCachedPartnerSyncStatus,
  listCachedDealSnapshots,
} from "@/lib/shopee/cache";
import { getShopeeCollectionDeals, getShopeeMicrositeSummary } from "@/lib/shopee/microsite";
import { getTienVePartnerDealFeed } from "@/lib/tienve/flash-deals";
import type { Deal, DealSlotSnapshot, DealSlotTab } from "@/lib/types";

export type DealFeed = {
  deals: Deal[];
  generatedAt: string | null;
  snapshotSlot: string;
  activeSlot: string;
  availableSlots: Record<string, DealSlotSnapshot | null>;
  slotTabs: DealSlotTab[];
  source:
  | "partner-cache"
  | "partner-api"
  | "supabase-slot"
  | "supabase-cache"
  | "server-fetch"
  | "mock";
};

const shopeeSlotTabs: DealSlotTab[] = slotOptions.map((slot) => ({
  slot,
  label: slotLabels[slot],
  sub: `Khung ${slotLabels[slot]}`,
}));

function isNumericSlot(value: string) {
  return /^\d+$/.test(value);
}

function toDisplayFromSlot(slot: string) {
  if (/^\d{4}$/.test(slot)) {
    return `${slot.slice(0, 2)}:${slot.slice(2, 4)}`;
  }

  if (isNumericSlot(slot)) {
    const timestamp = Number(slot);
    if (!Number.isNaN(timestamp) && timestamp > 0) {
      const date = new Date(timestamp * 1000);
      return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Saigon",
      }).format(date);
    }
  }

  return slot;
}

function sortSlotTabs(tabs: DealSlotTab[]) {
  return tabs.toSorted((left, right) => {
    const leftNumeric = isNumericSlot(left.slot);
    const rightNumeric = isNumericSlot(right.slot);

    if (leftNumeric && rightNumeric) {
      return Number(left.slot) - Number(right.slot);
    }

    if (leftNumeric) return -1;
    if (rightNumeric) return 1;
    return left.slot.localeCompare(right.slot);
  });
}

function sortDeals(deals: Deal[]) {
  return deals.toSorted((left, right) => right.discountPercent - left.discountPercent);
}

function isPartnerCacheStale(params: {
  generatedAt: string | null;
  slotTabs: DealSlotTab[];
  maxAgeMinutes?: number;
}) {
  const { generatedAt, slotTabs, maxAgeMinutes = 30 } = params;
  const nowMs = Date.now();
  const nowSec = Math.floor(nowMs / 1000);

  const generatedAtMs = generatedAt ? new Date(generatedAt).getTime() : 0;
  const ageMs = generatedAtMs > 0 ? nowMs - generatedAtMs : Number.POSITIVE_INFINITY;
  const isAgeExpired = ageMs > maxAgeMinutes * 60 * 1000;

  const allEnded =
    slotTabs.length > 0 &&
    slotTabs.every((tab) => typeof tab.endTimeSec === "number" && nowSec >= tab.endTimeSec);

  const numericSlotStarts = slotTabs
    .map((tab) => Number(tab.slot))
    .filter((value) => Number.isFinite(value) && value > 0);
  const newestSlotStartSec =
    numericSlotStarts.length > 0 ? Math.max(...numericSlotStarts) : 0;
  const slotsTooOld =
    newestSlotStartSec > 0 && nowSec - newestSlotStartSec > 6 * 60 * 60;

  return isAgeExpired || allEnded || slotsTooOld;
}

function mapSlotAvailability(snapshots: DealSlotSnapshot[]) {
  const picked = new Map(snapshots.map((snapshot) => [snapshot.slot, snapshot]));
  const mapped: Record<string, DealSlotSnapshot | null> = {};

  for (const [slot, snapshot] of picked) {
    mapped[slot] = snapshot ?? null;
  }

  return mapped;
}

function pickDefaultSlot(
  requestedSlot: string | undefined,
  snapshots: DealSlotSnapshot[],
  latestGeneratedAt: string | null,
  slotTabs: DealSlotTab[] = [],
) {
  if (requestedSlot && snapshots.some((snapshot) => snapshot.slot === requestedSlot)) {
    return requestedSlot;
  }

  // Prefer the currently ongoing slot based on startTimeSec/endTimeSec
  const nowSec = Math.floor(Date.now() / 1000);
  const ongoingTab = slotTabs.find(
    (tab) => tab.startTimeSec && tab.endTimeSec && nowSec >= tab.startTimeSec && nowSec < tab.endTimeSec,
  );
  if (ongoingTab && snapshots.some((snapshot) => snapshot.slot === ongoingTab.slot)) {
    return ongoingTab.slot;
  }

  const currentSlot = getSlotForTimestamp(new Date());
  if (snapshots.some((snapshot) => snapshot.slot === currentSlot)) {
    return currentSlot;
  }

  if (snapshots[0]) {
    return snapshots[0].slot;
  }

  return getSlotForTimestamp(latestGeneratedAt);
}

async function getFallbackDealsFromServer(): Promise<DealFeed | null> {
  try {
    const microsite = await getShopeeMicrositeSummary();
    const candidateCollections = microsite.productCollections
      .filter((collection) => /deal|flash|gia|re|rẻ/i.test(collection.componentName))
      .slice(0, 2);

    for (const collection of candidateCollections) {
      try {
        const deals = await getShopeeCollectionDeals(
          collection.collectionId,
          collection.componentName,
        );
        if (deals.length > 0) {
          const generatedAt = new Date().toISOString();
          const slot = getSlotForTimestamp(generatedAt);
          return {
            deals: sortDeals(deals),
            generatedAt,
            snapshotSlot: slot,
            activeSlot: slot,
            slotTabs: shopeeSlotTabs,
            availableSlots: {
              [slot]: {
                slot,
                generatedAt,
                count: deals.length,
                cacheKey: `deals:server-fetch:${slot}`,
              },
            },
            source: "server-fetch",
          };
        }
      } catch {
        continue;
      }
    }
  } catch {
    // Ignore and fall back to local mocks when Shopee blocks the request.
  }

  return null;
}

export async function getDealFeed(requestedSlot?: string): Promise<DealFeed> {
  const partnerPageUrl = process.env.TIENVE_CACHE_PAGE_URL ?? "tienve-partner";
  const [partnerSnapshots, partnerLatestDealsCache, partnerSyncStatus] = await Promise.all([
    listCachedDealSnapshots(partnerPageUrl),
    getCachedDeals(partnerPageUrl),
    getCachedPartnerSyncStatus(partnerPageUrl),
  ]);
  const partnerSlotTabsRaw =
    partnerSyncStatus?.data.slotTabs && partnerSyncStatus.data.slotTabs.length > 0
      ? partnerSyncStatus.data.slotTabs
      : partnerSnapshots.map((snapshot) => ({
        slot: snapshot.slot,
        label: toDisplayFromSlot(snapshot.slot),
        sub: `Slot ${toDisplayFromSlot(snapshot.slot)}`,
      }));
  const partnerSlotTabs = sortSlotTabs(partnerSlotTabsRaw);
  const allowedPartnerSlots = new Set(partnerSlotTabs.map((tab) => tab.slot));
  const filteredPartnerSnapshots =
    allowedPartnerSlots.size > 0
      ? partnerSnapshots.filter((snapshot) => allowedPartnerSlots.has(snapshot.slot))
      : partnerSnapshots;
  const resolvedPartnerActiveSlot = pickDefaultSlot(
    requestedSlot,
    filteredPartnerSnapshots,
    partnerLatestDealsCache?.generatedAt ?? null,
    partnerSlotTabs,
  );
  const partnerAvailableSlots = mapSlotAvailability(filteredPartnerSnapshots);
  const partnerSlotDealsCache = await getCachedDeals(partnerPageUrl, resolvedPartnerActiveSlot);
  const shouldBypassPartnerCache = isPartnerCacheStale({
    generatedAt: partnerSyncStatus?.generatedAt ?? partnerLatestDealsCache?.generatedAt ?? null,
    slotTabs: partnerSlotTabs,
    maxAgeMinutes: Number(process.env.TIENVE_PARTNER_CACHE_MAX_AGE_MINUTES ?? 30),
  });

  if (shouldBypassPartnerCache) {
    try {
      const partnerFeed = await getTienVePartnerDealFeed(requestedSlot);
      return {
        ...partnerFeed,
        source: "partner-api",
      };
    } catch {
      // Fall back to stale cache if live API is unavailable.
    }
  }

  if (partnerSlotDealsCache?.data.length) {
    return {
      deals: sortDeals(partnerSlotDealsCache.data),
      generatedAt: partnerSlotDealsCache.generatedAt,
      snapshotSlot: resolvedPartnerActiveSlot,
      activeSlot: resolvedPartnerActiveSlot,
      availableSlots: partnerAvailableSlots,
      slotTabs: partnerSlotTabs,
      source: "partner-cache",
    };
  }

  if (partnerLatestDealsCache?.data.length) {
    return {
      deals: sortDeals(partnerLatestDealsCache.data),
      generatedAt: partnerLatestDealsCache.generatedAt,
      snapshotSlot:
        filteredPartnerSnapshots[0]?.slot ?? getSlotForTimestamp(partnerLatestDealsCache.generatedAt),
      activeSlot: resolvedPartnerActiveSlot,
      availableSlots: partnerAvailableSlots,
      slotTabs: partnerSlotTabs,
      source: "partner-cache",
    };
  }

  try {
    const partnerFeed = await getTienVePartnerDealFeed(requestedSlot);
    return {
      ...partnerFeed,
      source: "partner-api",
    };
  } catch {
    // Fall through to worker cache and old fallbacks.
  }

  const [snapshots, latestDealsCache] = await Promise.all([
    listCachedDealSnapshots(),
    getCachedDeals(),
  ]);

  const activeSlot = pickDefaultSlot(requestedSlot, snapshots, latestDealsCache?.generatedAt ?? null);
  const availableSlots = mapSlotAvailability(snapshots);
  const slotDealsCache = await getCachedDeals("shopee-sieu-re", activeSlot);

  if (slotDealsCache?.data.length) {
    return {
      deals: sortDeals(slotDealsCache.data),
      generatedAt: slotDealsCache.generatedAt,
      snapshotSlot: activeSlot,
      activeSlot,
      availableSlots,
      slotTabs: shopeeSlotTabs,
      source: "supabase-slot",
    };
  }

  if (snapshots.length > 0) {
    return {
      deals: [],
      generatedAt: availableSlots[activeSlot]?.generatedAt ?? snapshots[0].generatedAt,
      snapshotSlot: activeSlot,
      activeSlot,
      availableSlots,
      slotTabs: shopeeSlotTabs,
      source: "supabase-slot",
    };
  }

  if (latestDealsCache?.data.length) {
    return {
      deals: sortDeals(latestDealsCache.data),
      generatedAt: latestDealsCache.generatedAt,
      snapshotSlot: getSlotForTimestamp(latestDealsCache.generatedAt),
      activeSlot,
      availableSlots,
      slotTabs: shopeeSlotTabs,
      source: "supabase-cache",
    };
  }

  const serverFeed = await getFallbackDealsFromServer();
  if (serverFeed) {
    return {
      ...serverFeed,
      activeSlot,
      slotTabs: shopeeSlotTabs,
      availableSlots: {
        ...availableSlots,
        [serverFeed.snapshotSlot]: {
          slot: serverFeed.snapshotSlot,
          generatedAt: serverFeed.generatedAt ?? new Date().toISOString(),
          count: serverFeed.deals.length,
          cacheKey: `deals:server-fetch:${serverFeed.snapshotSlot}`,
        },
      },
    };
  }

  return {
    deals: sortDeals(mockDeals),
    generatedAt: null,
    snapshotSlot: getSlotForTimestamp(null),
    activeSlot,
    availableSlots,
    slotTabs: shopeeSlotTabs,
    source: "mock",
  };
}

export async function getDeals(): Promise<Deal[]> {
  const feed = await getDealFeed();
  return feed.deals;
}
