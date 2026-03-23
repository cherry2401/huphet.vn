"use client";

import { useEffect, useRef } from "react";

/**
 * TrackPageView – ghi nhận page_view khi trang được mount.
 * Dùng: <TrackPageView page="/deal" />
 *
 * TrackFeatureClick – gọi khi user click tính năng.
 * Dùng: trackFeatureClick("/deal", "deal_item_click")
 */

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("_hh_sid");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("_hh_sid", sid);
  }
  return sid;
}

export function TrackPageView({ page }: { page: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    // Don't track bots
    const ua = navigator.userAgent;
    if (/bot|crawl|spider|slurp/i.test(ua)) return;

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "page_view",
        page,
        session_id: getSessionId(),
      }),
    }).catch(() => {});
  }, [page]);

  return null;
}

export function trackFeatureClick(page: string, feature: string) {
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: "feature_click",
      page,
      feature,
      session_id: getSessionId(),
    }),
  }).catch(() => {});
}
