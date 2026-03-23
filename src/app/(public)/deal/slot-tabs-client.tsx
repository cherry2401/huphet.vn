"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PriceFilter } from "@/lib/deal-filters";
import type { DealSlotSnapshot, DealSlotTab } from "@/lib/types";
import styles from "@/app/(public)/deal/page.module.css";

type Props = {
  slotTabs: DealSlotTab[];
  activeSlot: string;
  activePrice: PriceFilter;
  availableSlots: Record<string, DealSlotSnapshot | null>;
};

type SlotState = "ongoing" | "upcoming" | "ended" | "unknown";

function buildDealFilterHref(slot: string, price: PriceFilter) {
  const params = new URLSearchParams();
  params.set("slot", slot);
  if (price !== "all") params.set("price", price);
  return `/deal?${params.toString()}`;
}

function formatDuration(seconds: number) {
  const clamped = Math.max(0, Math.floor(seconds));
  const hours = String(Math.floor(clamped / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((clamped % 3600) / 60)).padStart(2, "0");
  const secs = String(clamped % 60).padStart(2, "0");
  return `${hours}:${minutes}:${secs}`;
}

function getSlotState(slot: DealSlotTab, nowSec: number): SlotState {
  if (!slot.startTimeSec || !slot.endTimeSec) return "unknown";
  if (nowSec >= slot.startTimeSec && nowSec < slot.endTimeSec) return "ongoing";
  if (nowSec < slot.startTimeSec) return "upcoming";
  return "ended";
}

export function SlotTabsClient({ slotTabs, activeSlot, activePrice, availableSlots }: Props) {
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeline = useMemo(() => {
    const activeTab = slotTabs.find((slot) => slot.slot === activeSlot);
    if (!activeTab) return null;

    const state = getSlotState(activeTab, nowSec);
    if (state === "ongoing" && activeTab.endTimeSec) {
      return {
        text: "Kết thúc sau:",
        time: formatDuration(activeTab.endTimeSec - nowSec),
      };
    }

    if (state === "upcoming" && activeTab.startTimeSec) {
      return {
        text: "Bắt đầu sau:",
        time: formatDuration(activeTab.startTimeSec - nowSec),
      };
    }

    return null;
  }, [nowSec, slotTabs, activeSlot]);

  return (
    <div className={styles.slotContainer}>
      <nav className={styles.slotRow} aria-label="Lọc theo khung giờ">
        {slotTabs.map((slot) => {
          const snapshot = availableSlots[slot.slot];
          const isActive = slot.slot === activeSlot;
          const state = getSlotState(slot, nowSec);

          return (
            <Link
              key={slot.slot}
              href={buildDealFilterHref(slot.slot, activePrice)}
              className={isActive ? styles.slotPillActive : styles.slotPill}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={styles.slotTime}>{slot.label}</span>
              <span className={styles.slotSub}>
                {state === "ongoing" ? (
                  <>
                    <span className={styles.liveDot} />
                    Đang diễn ra
                  </>
                ) : state === "upcoming" ? (
                  "Sắp tới"
                ) : state === "ended" ? (
                  "Đã kết thúc"
                ) : snapshot ? (
                  `${snapshot.count} deal`
                ) : (
                  "—"
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      {timeline ? (
        <div className={styles.countdownBar}>
          <span className={styles.countdownIcon}>⏱</span>
          <span className={styles.countdownLabel}>{timeline.text}</span>
          <span className={styles.countdownTime} suppressHydrationWarning>{timeline.time}</span>
        </div>
      ) : null}
    </div>
  );
}
