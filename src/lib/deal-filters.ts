import type { Deal } from "@/lib/types";

export const slotOptions = ["0000", "0900", "1200", "1500", "2000"] as const;
export const priceOptions = ["1k", "9k", "29k", "all"] as const;

export type SlotFilter = (typeof slotOptions)[number];
export type PriceFilter = (typeof priceOptions)[number];

const slotSet = new Set<string>(slotOptions);
const priceSet = new Set<string>(priceOptions);

export const slotLabels: Record<SlotFilter, string> = {
  "0000": "00:00",
  "0900": "09:00",
  "1200": "12:00",
  "1500": "15:00",
  "2000": "20:00",
};

export const priceLabels: Record<PriceFilter, string> = {
  "1k": "1K",
  "9k": "9K",
  "29k": "29K",
  all: "Tat ca",
};

export function normalizeSlotFilter(value?: string, fallback: SlotFilter = "0900"): SlotFilter {
  return value && slotSet.has(value) ? (value as SlotFilter) : fallback;
}

export function normalizePriceFilter(value?: string): PriceFilter {
  return value && priceSet.has(value) ? (value as PriceFilter) : "all";
}

export function getSlotForTimestamp(value: string | Date | null | undefined): SlotFilter {
  const date = value ? new Date(value) : new Date();
  const hour = Number.isNaN(date.getTime()) ? new Date().getHours() : date.getHours();

  if (hour >= 20) return "2000";
  if (hour >= 15) return "1500";
  if (hour >= 12) return "1200";
  if (hour >= 9) return "0900";
  return "0000";
}

function matchesPrice(deal: Deal, price: PriceFilter) {
  if (price === "all") return true;
  if (price === "1k") return deal.salePrice <= 1000;
  if (price === "9k") return deal.salePrice > 1000 && deal.salePrice <= 9000;
  return deal.salePrice > 9000 && deal.salePrice <= 29000;
}

export function filterDealsByPrice(deals: Deal[], price: PriceFilter) {
  return deals.filter((deal) => matchesPrice(deal, price));
}

export function countDealsByPrice(deals: Deal[]) {
  return priceOptions.reduce<Record<PriceFilter, number>>((accumulator, price) => {
    accumulator[price] = deals.filter((deal) => matchesPrice(deal, price)).length;
    return accumulator;
  }, {} as Record<PriceFilter, number>);
}
