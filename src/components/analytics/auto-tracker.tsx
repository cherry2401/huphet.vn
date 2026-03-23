"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * AutoTracker — tự động ghi nhận page_view khi pathname thay đổi.
 * Đặt trong layout để track TẤT CẢ trang public.
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

export function AutoTracker() {
  const pathname = usePathname();
  const lastTracked = useRef("");

  useEffect(() => {
    // Don't track bots
    if (/bot|crawl|spider|slurp/i.test(navigator.userAgent)) return;
    // Don't double-track same pathname
    if (pathname === lastTracked.current) return;
    lastTracked.current = pathname;

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "page_view",
        page: pathname,
        session_id: getSessionId(),
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
