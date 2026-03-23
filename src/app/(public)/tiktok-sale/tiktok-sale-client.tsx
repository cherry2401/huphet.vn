"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import type { TikTokProduct } from "@/lib/adapters/tiktok-sale-adapter";
import styles from "./tiktok-sale.module.css";
import { trackFeatureClick } from "@/components/analytics/track";

type Props = {
  initialProducts: TikTokProduct[];
  initialNextPageToken: string | null;
  initialError: string | null;
  initialSort: string;
  initialQuery: string;
};

function formatPrice(n: number) {
  if (!n) return "0đ";
  return n.toLocaleString("vi-VN") + "đ";
}

function formatSold(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "K";
  return String(n);
}

const SORT_OPTIONS = [
  { value: "RECOMMENDED", label: "Đề xuất" },
  { value: "price_asc", label: "Giá thấp nhất" },
  { value: "price_desc", label: "Giá cao nhất" },
];

export function TikTokSaleClient({
  initialProducts,
  initialNextPageToken,
  initialError,
  initialSort,
  initialQuery,
}: Props) {
  // router/searchParams removed — client-side filtering only
  const [products, setProducts] = useState(initialProducts);
  const [nextPageToken, setNextPageToken] = useState(initialNextPageToken);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState(initialSort);
  const [query, setQuery] = useState(initialQuery);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Update URL params on sort/search change


  function sortProducts(list: TikTokProduct[], sortValue: string) {
    if (sortValue === "price_asc") {
      return [...list].sort((a, b) => a.salePriceMin - b.salePriceMin);
    }
    if (sortValue === "price_desc") {
      return [...list].sort((a, b) => b.salePriceMin - a.salePriceMin);
    }
    return list;
  }

  function applyFilters(list: TikTokProduct[], sortValue: string, searchQuery: string) {
    let filtered = list;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = list.filter((p) => p.title.toLowerCase().includes(q) || p.shopName.toLowerCase().includes(q));
    }
    return sortProducts(filtered, sortValue);
  }

  function handleSortChange(value: string) {
    setSort(value);
    setProducts(applyFilters(initialProducts, value, query));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setProducts(applyFilters(initialProducts, sort, query));
  }

  // Load more
  async function loadMore() {
    if (loadingMore || !nextPageToken) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.set("sort", sort);
      params.set("page_token", nextPageToken);
      if (query) params.set("q", query);

      const res = await fetch(`/api/tiktok-sale?${params.toString()}`);
      const data = await res.json();
      if (data.products?.length) {
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p: TikTokProduct) => p.id));
          const newProducts = data.products.filter((p: TikTokProduct) => !existingIds.has(p.id));
          return [...prev, ...newProducts];
        });
        setNextPageToken(data.nextPageToken ?? null);
      } else {
        setNextPageToken(null);
      }
    } catch {
      /* ignore */
    }
    setLoadingMore(false);
  }

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !nextPageToken) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextPageToken, sort, query]);

  // Sync with SSR data
  useEffect(() => {
    setProducts(initialProducts);
    setNextPageToken(initialNextPageToken);
  }, [initialProducts, initialNextPageToken]);

  return (
    <>
      {/* Filter bar */}
      <section className={styles.filterBar}>
        <div className={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.sortPill} ${sort === opt.value ? styles.sortPillActive : ""}`}
              onClick={() => handleSortChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm sản phẩm TikTok Shop..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className={styles.searchBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </button>
        </form>
      </section>

      {/* Product grid */}
      <section className={styles.gridSection}>
        {initialError && products.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <strong>Không tải được sản phẩm</strong>
            <p>Vui lòng thử lại sau hoặc kiểm tra kết nối.</p>
          </div>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <strong>Không tìm thấy sản phẩm</strong>
            <p>Thử từ khóa khác hoặc bỏ bộ lọc.</p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {products.map((product, idx) => (
                <article key={`${product.id}-${idx}`} className={styles.card}>
                  <div className={styles.cardImageWrap}>
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        className={styles.cardImage}
                        width={200}
                        height={200}
                        unoptimized
                      />
                    ) : (
                      <div className={styles.cardFallback}>🛒</div>
                    )}
                    {product.commissionRate > 0 && (
                      <div className={styles.commissionBadge}>
                        Up to {product.commissionRate.toFixed(product.commissionRate % 1 === 0 ? 0 : 1)}%
                      </div>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{product.title}</h3>
                    <div className={styles.cardPrice}>
                      <span className={styles.salePrice}>
                        {formatPrice(product.salePriceMin)}
                      </span>
                      {product.originalPriceMin > product.salePriceMin && (
                        <span className={styles.originalPrice}>
                          {formatPrice(product.originalPriceMin)}
                        </span>
                      )}
                    </div>
                    <div className={styles.cardMeta}>
                      <span className={styles.shopName}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                        {product.shopName}
                      </span>
                      <span className={styles.soldCount}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                        {formatSold(product.unitsSold)} Đã bán
                      </span>
                    </div>
                    <a
                      className={styles.ctaButton}
                      href={product.affiliateUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => trackFeatureClick("/tiktok-sale", "tiktok_product_click")}
                    >
                      Mua ngay
                    </a>
                  </div>
                </article>
              ))}
            </div>

            <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />
            <p className={styles.loadStatus}>
              {loadingMore
                ? "Đang tải thêm..."
                : nextPageToken
                ? `Đã hiển thị ${products.length} sản phẩm`
                : `Tổng ${products.length} sản phẩm`}
            </p>
          </>
        )}
      </section>
    </>
  );
}
