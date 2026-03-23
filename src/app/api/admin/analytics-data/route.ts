/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/analytics
 * Trả về metrics analytics cho dashboard
 * Query params: days=7 (default)
 */
export async function GET(req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "7");
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  try {
    await requireAdmin();
    // All events in period
    const { data: events } = await supabase
      .from("analytics_events")
      .select("event_type, page, feature, ip_hash, created_at")
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: false })
      .limit(5000);

    const allEvents = events ?? [];

    // Total page views
    const pageViews = allEvents.filter((e) => e.event_type === "page_view");
    const featureClicks = allEvents.filter((e) => e.event_type === "feature_click");

    // Unique visitors (by ip_hash)
    const uniqueVisitors = new Set(pageViews.map((e) => e.ip_hash)).size;

    // Page views by page
    const pageViewsByPage: Record<string, number> = {};
    for (const e of pageViews) {
      pageViewsByPage[e.page] = (pageViewsByPage[e.page] ?? 0) + 1;
    }

    // Feature clicks by feature
    const clicksByFeature: Record<string, number> = {};
    for (const e of featureClicks) {
      const key = e.feature ?? e.page;
      clicksByFeature[key] = (clicksByFeature[key] ?? 0) + 1;
    }

    // Page views by day
    const viewsByDay: { date: string; views: number; visitors: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayEvents = pageViews.filter(
        (e) => e.created_at && e.created_at.startsWith(dateStr)
      );
      const dayVisitors = new Set(dayEvents.map((e) => e.ip_hash)).size;
      viewsByDay.push({ date: dateStr, views: dayEvents.length, visitors: dayVisitors });
    }

    // Today stats
    const todayStr = new Date().toISOString().split("T")[0];
    const todayViews = pageViews.filter((e) => e.created_at?.startsWith(todayStr));
    const todayVisitors = new Set(todayViews.map((e) => e.ip_hash)).size;
    const todayClicks = featureClicks.filter((e) => e.created_at?.startsWith(todayStr)).length;

    // Top pages
    const topPages = Object.entries(pageViewsByPage)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Top features
    const topFeatures = Object.entries(clicksByFeature)
      .map(([feature, clicks]) => ({ feature, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    return NextResponse.json({
      ok: true,
      period: { days, since: sinceISO },
      today: {
        views: todayViews.length,
        visitors: todayVisitors,
        clicks: todayClicks,
      },
      total: {
        pageViews: pageViews.length,
        uniqueVisitors,
        featureClicks: featureClicks.length,
      },
      viewsByDay,
      topPages,
      topFeatures,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
