import type { Deal, DealSlotSnapshot, DealSlotTab } from "@/lib/types";

const TIENVE_BASE_URL =
  process.env.TIENVE_FLASH_DEALS_API_URL ?? "https://api.tienve.vn/api/v1/flash-deals/partner";

const priceRanges = ["1K", "9K", "29K"] as const;

type PartnerTimeSlot = {
  startTime: number;
  endTime: number;
  startTimeDisplay: string;
  endTimeDisplay: string;
};

type PartnerProduct = {
  id: number;
  name: string;
  image?: string;
  price?: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  stock?: number;
  shopeeUrl?: string;
  affiliateUrl?: string;
};

type PartnerPayload = {
  mode: "flash-sale" | "super-cheap";
  priceRange: "1K" | "9K" | "29K";
  page: number;
  hasNext: boolean;
  timeSlots: PartnerTimeSlot[];
  currentTime: number;
  activeSlot: number;
  products: PartnerProduct[];
  total: number;
};

type PartnerResponse = {
  success: boolean;
  data?: PartnerPayload;
};

type SlotResolution = {
  slot: string;
  startTime?: number;
  activeSlot: string;
  slotTabs: DealSlotTab[];
};

function normalizeMoney(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  if (value > 100000000) {
    return Math.round(value / 100000);
  }

  return Math.round(value);
}

function parseProductUrl(url: string | undefined) {
  if (!url) {
    return { shopId: undefined, itemId: undefined };
  }

  const match = url.match(/\/product\/(\d+)\/(\d+)/);
  if (!match) {
    return { shopId: undefined, itemId: undefined };
  }

  return {
    shopId: Number(match[1]),
    itemId: Number(match[2]),
  };
}

function toSlotKey(startTime: number) {
  return String(startTime);
}

function toLegacyLabelKey(value: string) {
  return value.replace(":", "");
}

function mapTimeSlotsToTabs(timeSlots: PartnerTimeSlot[]): DealSlotTab[] {
  return timeSlots.map((entry) => ({
    slot: toSlotKey(entry.startTime),
    label: entry.startTimeDisplay,
    sub: `${entry.startTimeDisplay}-${entry.endTimeDisplay}`,
    startTimeSec: entry.startTime,
    endTimeSec: entry.endTime,
  }));
}

async function fetchPartnerDeals(params: {
  priceRange: "1K" | "9K" | "29K";
  startTime?: number;
  mode?: "flash-sale" | "super-cheap";
}) {
  const searchParams = new URLSearchParams({
    mode: params.mode ?? "flash-sale",
    priceRange: params.priceRange,
    page: "1",
    pageSize: "50",
  });

  if (params.startTime) {
    searchParams.set("startTime", String(params.startTime));
  }

  const response = await fetch(`${TIENVE_BASE_URL}?${searchParams.toString()}`, {
    next: { revalidate: 45 },
  });

  if (!response.ok) {
    throw new Error(`TienVe partner API failed (${response.status})`);
  }

  const parsed = (await response.json()) as PartnerResponse;
  if (!parsed.success || !parsed.data) {
    throw new Error("TienVe partner API returned invalid payload");
  }

  return parsed.data;
}

function resolveSlot(requestedSlot: string | undefined, metaPayload: PartnerPayload): SlotResolution {
  const bySlot = new Map<string, PartnerTimeSlot>();
  const byLegacyKey = new Map<string, PartnerTimeSlot>();

  for (const timeSlot of metaPayload.timeSlots) {
    bySlot.set(toSlotKey(timeSlot.startTime), timeSlot);
    byLegacyKey.set(toLegacyLabelKey(timeSlot.startTimeDisplay), timeSlot);
  }

  const activeSlot = toSlotKey(metaPayload.activeSlot);
  let resolvedSlot = activeSlot;

  if (requestedSlot) {
    if (bySlot.has(requestedSlot)) {
      resolvedSlot = requestedSlot;
    } else {
      const fromLegacy = byLegacyKey.get(requestedSlot);
      if (fromLegacy) {
        resolvedSlot = toSlotKey(fromLegacy.startTime);
      }
    }
  }

  const chosen = bySlot.get(resolvedSlot);

  return {
    slot: resolvedSlot,
    startTime: chosen?.startTime,
    activeSlot,
    slotTabs: mapTimeSlotsToTabs(metaPayload.timeSlots),
  };
}

function buildOwnAffiliateUrl(productUrl: string | undefined): string | null {
  if (!productUrl) return null;

  const template = process.env.AFFILIATE_LINK_TEMPLATE;
  const affiliateId = process.env.AFFILIATE_ID ?? "";
  const subId1 = process.env.AFFILIATE_SUB_ID1 ?? "huphet";

  if (template && affiliateId) {
    return template
      .replaceAll("{{encodedProductUrl}}", encodeURIComponent(productUrl))
      .replaceAll("{{productUrl}}", productUrl)
      .replaceAll("{{affiliateId}}", affiliateId)
      .replaceAll("{{sub_id1}}", subId1);
  }

  // Fallback: append mmp params
  try {
    const url = new URL(productUrl);
    if (affiliateId) {
      url.searchParams.set("mmp_pid", `an_${affiliateId}`);
      url.searchParams.set("utm_source", `an_${affiliateId}`);
    }
    url.searchParams.set("utm_medium", "affiliates");
    url.searchParams.set("utm_content", subId1);
    url.searchParams.set("utm_campaign", "-");
    return url.toString();
  } catch {
    return null;
  }
}

function mapProductToDeal(product: PartnerProduct, slot: string): Deal | null {
  if (!product.name) {
    return null;
  }

  const salePrice = normalizeMoney(product.price);
  const originalPriceRaw = normalizeMoney(product.originalPrice);
  const originalPrice = originalPriceRaw > 0 ? originalPriceRaw : salePrice;
  const discountPercent =
    typeof product.discount === "number"
      ? Math.max(0, Math.round(product.discount))
      : originalPrice > salePrice && originalPrice > 0
        ? Math.max(0, Math.round(((originalPrice - salePrice) / originalPrice) * 100))
        : 0;
  const slugBase = product.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
  const productUrl = product.shopeeUrl ?? undefined;
  const { shopId, itemId } = parseProductUrl(productUrl);

  const ownAffiliateUrl = buildOwnAffiliateUrl(productUrl);

  return {
    id: `partner-${product.id}`,
    slug: `${slugBase}-${product.id}`,
    title: product.name,
    category: "tech",
    salePrice,
    originalPrice,
    discountPercent,
    badge: "Flash Sale",
    affiliateUrl: ownAffiliateUrl ?? product.affiliateUrl ?? product.shopeeUrl ?? "#",
    productUrl,
    source: "tienve-partner",
    imageUrl: product.image,
    shopId,
    itemId,
    collectionName: `Partner ${slot}`,
    ratingStar: typeof product.rating === "number" ? product.rating : undefined,
    stock: typeof product.stock === "number" ? Math.max(0, Math.round(product.stock)) : undefined,
    sourceKind: "partner-api",
  };
}

function dedupeDeals(input: Deal[]) {
  const picked = new Map<string, Deal>();

  for (const deal of input) {
    if (!picked.has(deal.id)) {
      picked.set(deal.id, deal);
    }
  }

  return [...picked.values()].toSorted((left, right) => right.discountPercent - left.discountPercent);
}

function mapSnapshots(
  slotTabs: DealSlotTab[],
  selectedSlot: string,
  generatedAt: string,
  selectedCount: number,
) {
  const available: Record<string, DealSlotSnapshot | null> = {};

  for (const tab of slotTabs) {
    available[tab.slot] = {
      slot: tab.slot,
      generatedAt,
      count: tab.slot === selectedSlot ? selectedCount : 0,
      cacheKey: `deals:tienve-partner:${tab.slot}`,
    };
  }

  return available;
}

export type PartnerDealFeed = {
  deals: Deal[];
  generatedAt: string;
  snapshotSlot: string;
  activeSlot: string;
  availableSlots: Record<string, DealSlotSnapshot | null>;
  slotTabs: DealSlotTab[];
};

export async function getTienVePartnerSlotTabs() {
  const metaPayload = await fetchPartnerDeals({ priceRange: "1K" });
  return mapTimeSlotsToTabs(metaPayload.timeSlots);
}

export async function getTienVePartnerDealFeed(requestedSlot?: string): Promise<PartnerDealFeed> {
  const metaPayload = await fetchPartnerDeals({ priceRange: "1K" });
  const resolved = resolveSlot(requestedSlot, metaPayload);

  const payloads = await Promise.all(
    priceRanges.map((priceRange) =>
      fetchPartnerDeals({
        priceRange,
        startTime: resolved.startTime,
      }),
    ),
  );

  const mappedDeals = payloads.flatMap((payload) =>
    payload.products
      .map((product) => mapProductToDeal(product, resolved.slot))
      .filter((entry): entry is Deal => entry !== null),
  );

  const generatedAt = new Date().toISOString();
  const deals = dedupeDeals(mappedDeals);

  return {
    deals,
    generatedAt,
    snapshotSlot: resolved.slot,
    activeSlot: resolved.slot,
    availableSlots: mapSnapshots(resolved.slotTabs, resolved.slot, generatedAt, deals.length),
    slotTabs: resolved.slotTabs,
  };
}
