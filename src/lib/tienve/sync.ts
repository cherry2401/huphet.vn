import {
  listCachedDealSnapshots,
  writeCachedDeals,
  writeCachedPartnerSyncStatus,
} from "@/lib/shopee/cache";
import { rewriteDealsWithAffiliateLinks } from "@/lib/affiliate/link-generator";
import { getTienVePartnerDealFeed, getTienVePartnerSlotTabs } from "@/lib/tienve/flash-deals";
import type { Deal, DealSlotSnapshot, DealSlotTab, PartnerSlotSyncStatus } from "@/lib/types";

type PartnerSyncResult = {
  ok: boolean;
  pageUrl: string;
  generatedAt: string;
  updatedSlots: string[];
  dealCount: number;
  errors: string[];
  snapshots: DealSlotSnapshot[];
  slotResults: PartnerSlotSyncStatus[];
  slotTabs: DealSlotTab[];
  affiliate: {
    mode: "passthrough" | "template" | "http" | "mmp_pid" | "custom-link";
    rewritten: number;
    fallback: number;
    customLink?: {
      requested: number;
      converted: number;
      failed: number;
      mmpFallback: number;
      sessionStatus: "ok" | "login_required" | "blocked" | "unexpected_page" | "transport_error";
      error: string | null;
      subIds: {
        sub_id1: string;
        sub_id2: string;
        sub_id3: string;
        sub_id4: string;
        sub_id5: string;
      };
    };
  };
};

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

export async function syncTienVePartnerCache(
  pageUrl = process.env.TIENVE_CACHE_PAGE_URL ?? "tienve-partner",
): Promise<PartnerSyncResult> {
  const errors: string[] = [];
  const slotDealMap = new Map<string, Deal[]>();
  const slotResults: PartnerSlotSyncStatus[] = [];
  let affiliateMode: "passthrough" | "template" | "http" | "mmp_pid" | "custom-link" = "passthrough";
  let affiliateRewritten = 0;
  let affiliateFallback = 0;
  let customLinkRequested = 0;
  let customLinkConverted = 0;
  let customLinkFailed = 0;
  let customLinkMmpFallback = 0;
  let customLinkSessionStatus: "ok" | "login_required" | "blocked" | "unexpected_page" | "transport_error" =
    "ok";
  let customLinkError: string | null = null;
  let customLinkSubIds = {
    sub_id1: "",
    sub_id2: "",
    sub_id3: "",
    sub_id4: "",
    sub_id5: "",
  };
  const generatedAt = new Date().toISOString();
  const slotTabs = await getTienVePartnerSlotTabs();

  for (const slotTab of slotTabs) {
    const slot = slotTab.slot;
    try {
      const feed = await getTienVePartnerDealFeed(slot);
      const rewritten = await rewriteDealsWithAffiliateLinks(feed.deals);
      slotDealMap.set(feed.snapshotSlot, rewritten.deals);
      affiliateMode = rewritten.stats.mode;
      affiliateRewritten += rewritten.stats.rewritten;
      affiliateFallback += rewritten.stats.fallback;
      if (rewritten.stats.customLink) {
        customLinkRequested += rewritten.stats.customLink.requested;
        customLinkConverted += rewritten.stats.customLink.converted;
        customLinkFailed += rewritten.stats.customLink.failed;
        customLinkMmpFallback += rewritten.stats.customLink.mmpFallback;
        customLinkSessionStatus = rewritten.stats.customLink.sessionStatus;
        customLinkError = rewritten.stats.customLink.error;
        customLinkSubIds = rewritten.stats.customLink.subIds;
      }
      slotResults.push({
        slot,
        ok: true,
        dealCount: rewritten.deals.length,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${slot}: ${message}`);
      slotResults.push({
        slot,
        ok: false,
        dealCount: 0,
        error: message,
      });
    }
  }

  const updatedSlots = [...slotDealMap.keys()];
  const allDeals = dedupeDeals(
    [...slotDealMap.values()].flat().toSorted((left, right) => right.discountPercent - left.discountPercent),
  );

  await Promise.all([
    writeCachedDeals(pageUrl, allDeals, undefined, generatedAt),
    ...updatedSlots.map((slot) => writeCachedDeals(pageUrl, slotDealMap.get(slot) ?? [], slot, generatedAt)),
    writeCachedPartnerSyncStatus(
      pageUrl,
      {
        pageUrl,
        generatedAt,
        updatedSlots,
        dealCount: allDeals.length,
        errors,
        slotResults,
        slotTabs,
        affiliate: {
          mode: affiliateMode,
          rewritten: affiliateRewritten,
          fallback: affiliateFallback,
          customLink:
            affiliateMode === "custom-link"
              ? {
                  requested: customLinkRequested,
                  converted: customLinkConverted,
                  failed: customLinkFailed,
                  mmpFallback: customLinkMmpFallback,
                  sessionStatus: customLinkSessionStatus,
                  error: customLinkError,
                  subIds: customLinkSubIds,
                }
              : undefined,
        },
      },
      generatedAt,
    ),
  ]);

  const snapshots = await listCachedDealSnapshots(pageUrl);

  return {
    ok: errors.length < slotTabs.length,
    pageUrl,
    generatedAt,
    updatedSlots,
    dealCount: allDeals.length,
    errors,
    snapshots,
    slotResults,
    slotTabs,
    affiliate: {
      mode: affiliateMode,
      rewritten: affiliateRewritten,
      fallback: affiliateFallback,
      customLink:
        affiliateMode === "custom-link"
          ? {
              requested: customLinkRequested,
              converted: customLinkConverted,
              failed: customLinkFailed,
              mmpFallback: customLinkMmpFallback,
              sessionStatus: customLinkSessionStatus,
              error: customLinkError,
              subIds: customLinkSubIds,
            }
          : undefined,
    },
  };
}
