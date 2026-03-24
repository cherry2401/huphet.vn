"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./live.module.css";
import Image from "next/image";
import type { LiveSession } from "@/lib/types";
import { trackFeatureClick } from "@/components/analytics/track";

type FilterKey = "all" | "1k" | "2k" | "5k";
type SortKey = "xu" | "newest";

const FILTERS: { key: FilterKey; label: string; min: number }[] = [
  { key: "all", label: "Tất cả", min: 0 },
  { key: "1k", label: "1K+", min: 1000 },
  { key: "2k", label: "2K+", min: 2000 },
  { key: "5k", label: "5K+", min: 5000 },
];

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatCoin(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return k % 1 === 0 ? `${k.toFixed(0)}K` : `${k.toFixed(1)}K`;
  }
  return value.toLocaleString("vi-VN");
}

export function LiveXuClient({ initialSessions }: { initialSessions: LiveSession[] }) {
  const [sessions, setSessions] = useState(initialSessions);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("xu");
  const [search, setSearch] = useState("");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/live-xu");
      if (res.ok) {
        const data: LiveSession[] = await res.json();
        setSessions(data);
      }
    } catch {
      // keep existing data
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const minXu = FILTERS.find((f) => f.key === filter)?.min ?? 0;
  let filtered = sessions.filter((s) => {
    const matchXu = (s.maxcoin ?? 0) >= minXu;
    const matchSearch = search.trim() === "" || (s.hostName ?? s.title ?? "").toLowerCase().includes(search.trim().toLowerCase());
    return matchXu && matchSearch;
  });

  if (sort === "xu") {
    filtered = [...filtered].sort((a, b) => (b.maxcoin ?? 0) - (a.maxcoin ?? 0));
  } else {
    filtered = [...filtered].sort(
      (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
    );
  }

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1>
            CÀO XU LIVE <span className={styles.heroBadge}>FREE</span>
          </h1>
          <p className={styles.heroSub}>
            Cào xu livestream Shopee dễ dàng mỗi ngày
          </p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{sessions.length}</div>
            <div className={styles.statLabel}>Phiên live</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>
              {sessions.filter((s) => (s.maxcoin ?? 0) >= 2000).length}
            </div>
            <div className={styles.statLabel}>Xu nhiều</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>
              {formatCoin(sessions.reduce((sum, s) => sum + (s.maxcoin ?? 0), 0))}
            </div>
            <div className={styles.statLabel}>Tổng xu</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <div className={styles.howItWorks}>
        <span className={styles.howLabel}>Cách cào xu</span>
        <span>
          <span className={styles.stepNumber}>1</span> Chọn shop xu nhiều
        </span>
        <span>
          <span className={styles.stepNumber}>2</span> Nhấn Vào Live
        </span>
        <span>
          <span className={styles.stepNumber}>3</span> Cào xu miễn phí
        </span>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`${styles.filterBtn} ${filter === f.key ? styles.filterBtnActive : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className={styles.sortBtns}>
          <button
            className={`${styles.sortBtn} ${sort === "xu" ? styles.sortBtnActive : ""}`}
            onClick={() => setSort("xu")}
          >
            Xu nhiều
          </button>
          <button
            className={`${styles.sortBtn} ${sort === "newest" ? styles.sortBtnActive : ""}`}
            onClick={() => setSort("newest")}
          >
            Mới nhất
          </button>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Tìm shop..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className={styles.searchClear} onClick={() => setSearch("")} aria-label="Xóa tìm kiếm">×</button>
        )}
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {filtered.length === 0 && (
          <div className={styles.empty}>Không có live nào phù hợp bộ lọc</div>
        )}
        {filtered.map((session, index) => {
          const coin = session.maxcoin ?? 0;
          const isMega = coin >= 5000;
          const isHigh = coin >= 2000;

          return (
            <article
              key={`${session.id}-${index}`}
              className={`${styles.card} ${sort === "xu" ? (index === 0 ? styles.cardTop : index === 1 ? styles.cardTop2 : index === 2 ? styles.cardTop3 : "") : ""}`}
            >
              {/* Rank badge top 3 */}
              {index < 3 && sort === "xu" && (
                <span
                  className={`${styles.rank} ${
                    index === 0 ? styles.rankGold : index === 1 ? styles.rankSilver : styles.rankBronze
                  }`}
                >
                  {index + 1}
                </span>
              )}

              {/* Xu tier badge */}
              {isHigh && (
                <span className={`${styles.xuBadge} ${isMega ? styles.xuMega : styles.xuHigh}`}>
                  {isMega ? "KHỦNG" : "NHIỀU"}
                </span>
              )}

              <div className={styles.coinIcon}>
                <Image src="/icons/piggy-xu.svg" alt="xu" width={22} height={22} style={{ opacity: index === 0 && sort === "xu" ? 0.85 : 0.45, filter: index === 0 && sort === "xu" ? "sepia(1) hue-rotate(-10deg) saturate(3) brightness(0.85)" : "none" }} />
              </div>
              <div className={styles.coinAmount} style={index === 0 && sort === "xu" ? { color: "#b8860b" } : undefined}>
                {coin.toLocaleString("vi-VN")}
              </div>
              <div className={styles.xuLabel} style={index === 0 && sort === "xu" ? { color: "#c49a1a" } : undefined}>XU</div>

              <div className={styles.shopName} title={session.hostName}>
                <svg className={styles.shopIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                {session.hostName}
              </div>

              <div className={styles.startTime}>
                <svg className={styles.timeIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {formatTime(session.startsAt)}
              </div>

              <a
                className={styles.liveBtn}
                href={session.affiliateUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackFeatureClick("/live", "xu_click")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.09 6.26L20 9.27l-4.91 3.82L16.18 20 12 16.77 7.82 20l1.09-6.91L4 9.27l5.91-1.01z"/></svg>
                Vào Live
              </a>
            </article>
          );
        })}
      </div>
    </>
  );
}
