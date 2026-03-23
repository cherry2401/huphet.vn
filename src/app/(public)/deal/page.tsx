import Link from "next/link";
import { DealGridClient } from "@/app/(public)/deal/deal-grid-client";
import { SlotTabsClient } from "@/app/(public)/deal/slot-tabs-client";
import { SortSelectClient, SearchDealClient } from "@/app/(public)/deal/filter-controls-client";
import { getDealFeed } from "@/lib/adapters/deal-adapter";
import {
  filterDealsByPrice,
  normalizePriceFilter,
  type PriceFilter,
} from "@/lib/deal-filters";
import styles from "@/app/(public)/deal/page.module.css";

const priceFilters: Array<{ value: PriceFilter; label: string }> = [
  { value: "1k", label: "1K" },
  { value: "9k", label: "9K" },
  { value: "29k", label: "29K" },
  { value: "all", label: "Tất cả" },
];



function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildDealFilterHref(filters: { slot: string; price: PriceFilter }) {
  const params = new URLSearchParams();
  params.set("slot", filters.slot);
  if (filters.price !== "all") params.set("price", filters.price);
  return `/deal?${params.toString()}`;
}

function getSlotText(slot: string, tabs: Array<{ slot: string; label: string }>) {
  return tabs.find((item) => item.slot === slot)?.label ?? slot;
}

export default async function DealPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedSlot = getSingleParam(resolvedSearchParams.slot);
  const feed = await getDealFeed(requestedSlot);
  const activePrice = normalizePriceFilter(getSingleParam(resolvedSearchParams.price));
  const filteredDeals = filterDealsByPrice(feed.deals, activePrice);

  const searchQuery = getSingleParam(resolvedSearchParams.q)?.toLowerCase().trim();
  const sortParam = getSingleParam(resolvedSearchParams.sort) || "default";

  let finalDeals = [...filteredDeals];
  if (searchQuery) {
    finalDeals = finalDeals.filter(deal => deal.title.toLowerCase().includes(searchQuery));
  }

  if (sortParam === "price_asc") {
    finalDeals.sort((a, b) => a.salePrice - b.salePrice);
  } else if (sortParam === "price_desc") {
    finalDeals.sort((a, b) => b.salePrice - a.salePrice);
  } else if (sortParam === "discount_desc") {
    finalDeals.sort((a, b) => b.discountPercent - a.discountPercent);
  }


  return (
    <main className={styles.page}>

      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Cập nhật theo khung giờ</p>
        <h1 className={styles.heroTitle}>
          F<span className={styles.heroFlash}>
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.8 2.40002H11.6L8 16.8H14L11.6 28.8L25.2 12H17.6L18.8 2.40002Z" fill="#ffc107"/>
            </svg>
          </span>ASH SALE <span className={styles.heroShopee}>SHOPEE</span>
        </h1>
        <p className={styles.heroSub}>Deal đồng giá 1K, 9K, 29K từ Shopee</p>

        <SlotTabsClient
          slotTabs={feed.slotTabs}
          activeSlot={feed.activeSlot}
          activePrice={activePrice}
          availableSlots={feed.availableSlots}
        />
      </section>

      <section className={styles.filterBar} aria-label="Bộ lọc deal">
        <div className={styles.toolbarRow}>
          <div className={styles.priceFilters}>
            {priceFilters.map((filter) => {
              const isActive = filter.value === activePrice;
              return (
                <Link
                  key={filter.value}
                  href={buildDealFilterHref({ slot: feed.activeSlot, price: filter.value })}
                  className={isActive ? styles.pricePillActive : styles.pricePill}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span>{filter.label}</span>
                </Link>
              );
            })}
          </div>
          <SortSelectClient />
        </div>
        <SearchDealClient />
      </section>



      <section id="deal-list" className={styles.dealSection}>
        {finalDeals.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <strong>Không tìm thấy deal phù hợp</strong>
            <p>
              Thử tìm kiếm với từ khóa khác hoặc bỏ các bộ lọc để xem deal trong khung{" "}
              {getSlotText(feed.activeSlot, feed.slotTabs)}.
            </p>
          </div>
        ) : (
          <DealGridClient deals={finalDeals} activeSlotLabel={getSlotText(feed.activeSlot, feed.slotTabs)} />
        )}
      </section>
    </main>
  );
}
