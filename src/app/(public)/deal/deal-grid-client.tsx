"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format";
import type { Deal } from "@/lib/types";
import styles from "@/app/(public)/deal/page.module.css";
import { trackFeatureClick } from "@/components/analytics/track";

type Props = {
  deals: Deal[];
  activeSlotLabel: string;
};

const CHUNK_SIZE = 20;

function getStockPercent(stock: number) {
  if (!Number.isFinite(stock) || stock <= 0) return 0;
  return Math.max(4, Math.min(100, Math.round(stock)));
}

export function DealGridClient({ deals, activeSlotLabel }: Props) {
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset visible count when deals change — use deals identity as dependency
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setVisibleCount(CHUNK_SIZE); }, [deals]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setVisibleCount((current) => Math.min(current + CHUNK_SIZE, deals.length));
      },
      { rootMargin: "300px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [deals.length]);

  const visibleDeals = deals.slice(0, visibleCount);
  const hasMore = visibleCount < deals.length;

  return (
    <>
      <div className={styles.grid}>
        {visibleDeals.map((deal) => (
          <article key={deal.id} className={styles.card}>
            <div className={styles.cardImageWrap}>
              {deal.imageUrl ? (
                <Image
                  src={deal.imageUrl}
                  alt={deal.title}
                  className={styles.cardImage}
                  fill
                  sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
                />
              ) : (
                <div className={styles.cardFallback}>
                  <span>{deal.badge}</span>
                </div>
              )}

              <div className={styles.badgeOverlay}>
                <span className={styles.discountBadge}>-{deal.discountPercent}%</span>
              </div>

              {deal.ratingStar ? (
                <div className={styles.ratingOverlay}>
                  <div className={styles.cardRating}>
                    <span className={styles.star}>⭐</span>
                    <span>{deal.ratingStar.toFixed(1)}</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{deal.title}</h3>

              <div className={styles.cardPrice}>
                <span className={styles.salePrice}>{formatCurrency(deal.salePrice)}</span>
                <span className={styles.originalPrice}>{formatCurrency(deal.originalPrice)}</span>
              </div>

              {typeof deal.stock === "number" ? (
                <div className={styles.stockMeta}>
                  <p className={styles.stockLabel}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={styles.fireIcon}
                    >
                      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                    </svg>
                    <span>Còn {deal.stock}</span>
                  </p>
                  <div className={styles.stockTrack} aria-hidden>
                    <div className={styles.stockFill} style={{ width: `${getStockPercent(deal.stock)}%` }} />
                  </div>
                </div>
              ) : (
                <p className={styles.cardMeta}>
                  {deal.collectionName ?? deal.badge} · Slot {activeSlotLabel}
                </p>
              )}

              <a className={styles.ctaButton} href={deal.affiliateUrl} target="_blank" rel="noreferrer" onClick={() => trackFeatureClick("/deal", "deal_click")}>
                Săn Deal
              </a>
            </div>
          </article>
        ))}
      </div>

      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />
      <p style={{ marginTop: 16, opacity: 0.8 }}>
        {hasMore
          ? `Đang tải thêm... (${visibleDeals.length}/${deals.length})`
          : `Đã hiển thị tất cả ${deals.length} sản phẩm`}
      </p>
    </>
  );
}
