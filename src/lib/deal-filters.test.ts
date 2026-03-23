import { describe, expect, test } from "vitest";
import type { Deal } from "@/lib/types";
import {
  filterDealsByPrice,
  countDealsByPrice,
  getSlotForTimestamp,
  normalizePriceFilter,
  normalizeSlotFilter,
} from "@/lib/deal-filters";

const deals: Deal[] = [
  {
    id: "d1",
    slug: "deal-1",
    title: "Deal 1K buổi sáng",
    category: "beauty",
    salePrice: 1000,
    originalPrice: 10000,
    discountPercent: 90,
    badge: "1K",
    affiliateUrl: "https://example.com/1",
    source: "mock-feed",
  },
  {
    id: "d2",
    slug: "deal-2",
    title: "Deal 9K buổi trưa",
    category: "home",
    salePrice: 9000,
    originalPrice: 29000,
    discountPercent: 68,
    badge: "9K",
    affiliateUrl: "https://example.com/2",
    source: "mock-feed",
  },
  {
    id: "d3",
    slug: "deal-3",
    title: "Deal 29K chiều",
    category: "tech",
    salePrice: 29000,
    originalPrice: 59000,
    discountPercent: 51,
    badge: "29K",
    affiliateUrl: "https://example.com/3",
    source: "mock-feed",
  },
  {
    id: "d4",
    slug: "deal-4",
    title: "Deal ngoài nhóm giá",
    category: "fashion",
    salePrice: 49000,
    originalPrice: 99000,
    discountPercent: 50,
    badge: "Flash",
    affiliateUrl: "https://example.com/4",
    source: "mock-feed",
  },
];

describe("normalize filters", () => {
  test("normalizes invalid slot and price values to defaults", () => {
    expect(normalizeSlotFilter("abc")).toBe("0900");
    expect(normalizePriceFilter("abc")).toBe("all");
  });

  test("normalizes valid slot and price values", () => {
    expect(normalizeSlotFilter("1200")).toBe("1200");
    expect(normalizePriceFilter("1k")).toBe("1k");
  });
});

describe("getSlotForTimestamp", () => {
  test("returns correct slot based on hour", () => {
    expect(getSlotForTimestamp(new Date("2026-01-01T03:00:00"))).toBe("0000");
    expect(getSlotForTimestamp(new Date("2026-01-01T09:30:00"))).toBe("0900");
    expect(getSlotForTimestamp(new Date("2026-01-01T13:00:00"))).toBe("1200");
    expect(getSlotForTimestamp(new Date("2026-01-01T16:00:00"))).toBe("1500");
    expect(getSlotForTimestamp(new Date("2026-01-01T21:00:00"))).toBe("2000");
  });

  test("handles null/undefined by using current time", () => {
    const result = getSlotForTimestamp(null);
    expect(["0000", "0900", "1200", "1500", "2000"]).toContain(result);
  });
});

describe("filterDealsByPrice", () => {
  test("filters 1k deals (salePrice <= 1000)", () => {
    const result = filterDealsByPrice(deals, "1k");
    expect(result.map((d) => d.id)).toEqual(["d1"]);
  });

  test("filters 9k deals (1000 < salePrice <= 9000)", () => {
    const result = filterDealsByPrice(deals, "9k");
    expect(result.map((d) => d.id)).toEqual(["d2"]);
  });

  test("filters 29k deals (9000 < salePrice <= 29000)", () => {
    const result = filterDealsByPrice(deals, "29k");
    expect(result.map((d) => d.id)).toEqual(["d3"]);
  });

  test("returns all with 'all' filter", () => {
    const result = filterDealsByPrice(deals, "all");
    expect(result).toHaveLength(4);
  });
});

describe("countDealsByPrice", () => {
  test("counts deals by price band", () => {
    const counts = countDealsByPrice(deals);
    expect(counts).toEqual({
      "1k": 1,
      "9k": 1,
      "29k": 1,
      all: 4,
    });
  });
});
