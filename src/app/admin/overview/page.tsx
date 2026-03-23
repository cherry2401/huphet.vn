/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/immutability */
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import css from "./overview.module.css";

// ── Types ──
type DashboardData = {
  totalUsers: number;
  totalOrders: number;
  totalCommission: number;
  totalCashbackPaid: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  pendingOrders: number;
  approvedOrders: number;
  clickedOrders: number;
  rejectedOrders: number;
  recentOrders: any[];
  recentWithdrawals: any[];
  ordersLast7Days: { date: string; count: number }[];
  topMerchants: { merchant: string; count: number; commission: number }[];
};

type FeatureStats = {
  deals: { label: string; count: number; cacheDate: string | null };
  flashSales: { label: string; count: number };
  vouchers: { label: string; count: number };
  collections: { label: string; count: number };
};

type AnalyticsData = {
  today: { views: number; visitors: number; clicks: number };
  total: { pageViews: number; uniqueVisitors: number; featureClicks: number };
  viewsByDay: { date: string; views: number; visitors: number }[];
  topPages: { page: string; views: number }[];
  topFeatures: { feature: string; clicks: number }[];
};

// ── Helpers ──
function formatVND(value: number) {
  return value.toLocaleString("vi-VN") + " đ";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

// ═══════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════
export default function OverviewPage() {
  const supabase = createClient();
  const [data, setData] = useState<DashboardData | null>(null);
  const [features, setFeatures] = useState<FeatureStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    const [usersRes, ordersRes, walletsRes, withdrawalsRes, featuresRes, analyticsRes] = await Promise.all([
      supabase.from("user_profiles").select("id", { count: "exact", head: true }),
      supabase.from("cashback_orders").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("cashback_wallets").select("*"),
      supabase.from("cashback_withdrawals").select("*").order("created_at", { ascending: false }).limit(50),
      fetch("/api/admin/stats").then((r) => r.json()).catch(() => null),
      fetch("/api/admin/analytics-data?days=7").then((r) => r.json()).catch(() => null),
    ]);

    if (featuresRes?.ok) setFeatures(featuresRes.features);
    if (analyticsRes?.ok) setAnalytics(analyticsRes);

    const users = usersRes.count ?? 0;
    const allOrders = (ordersRes.data ?? []) as any[];
    const wallets = (walletsRes.data ?? []) as any[];
    const withdrawals = (withdrawalsRes.data ?? []) as any[];

    let totalCommission = 0, totalCashbackPaid = 0;
    let pendingOrders = 0, approvedOrders = 0, clickedOrders = 0, rejectedOrders = 0;
    const merchantMap = new Map<string, { count: number; commission: number }>();

    for (const o of allOrders) {
      totalCommission += o.commission ?? 0;
      totalCashbackPaid += o.cashback_amount ?? 0;
      if (o.status === "pending") pendingOrders++;
      else if (o.status === "approved" || o.status === "paid") approvedOrders++;
      else if (o.status === "clicked") clickedOrders++;
      else if (o.status === "rejected") rejectedOrders++;
      const m = o.merchant ?? "unknown";
      const prev = merchantMap.get(m) ?? { count: 0, commission: 0 };
      merchantMap.set(m, { count: prev.count + 1, commission: prev.commission + (o.commission ?? 0) });
    }

    const ordersLast7Days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      ordersLast7Days.push({ date: dateStr, count: allOrders.filter((o) => o.created_at?.startsWith(dateStr)).length });
    }

    const topMerchants = Array.from(merchantMap.entries())
      .map(([merchant, v]) => ({ merchant, ...v }))
      .sort((a, b) => b.count - a.count).slice(0, 5);

    const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending").length;
    const totalWithdrawn = wallets.reduce((s, w) => s + (w.total_withdrawn ?? 0), 0);

    setData({
      totalUsers: users, totalOrders: allOrders.length, totalCommission, totalCashbackPaid,
      totalWithdrawals: totalWithdrawn, pendingWithdrawals, pendingOrders, approvedOrders,
      clickedOrders, rejectedOrders, recentOrders: allOrders.slice(0, 5),
      recentWithdrawals: withdrawals.slice(0, 5), ordersLast7Days, topMerchants,
    });
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }

  if (loading || !data) {
    return (
      <main className={css.page}>
        <div className={css.loadingState}>
          <div className={css.spinner} />
          <p>Đang tải dashboard...</p>
        </div>
      </main>
    );
  }

  const profit = data.totalCommission - data.totalCashbackPaid;

  const statusMap: Record<string, { cls: string; label: string }> = {
    clicked: { cls: css.chipDefault, label: "Đã click" },
    pending: { cls: css.chipWarning, label: "Chờ duyệt" },
    approved: { cls: css.chipSuccess, label: "Đã duyệt" },
    paid: { cls: css.chipInfo, label: "Đã trả" },
    rejected: { cls: css.chipDanger, label: "Từ chối" },
  };

  return (
    <main className={css.page}>
      {/* ═══ Hero Banner ═══ */}
      <div className={css.heroBanner}>
        <div className={css.heroContent}>
          <h1 className={css.heroTitle}>{getGreeting()}, Admin!</h1>
          <p className={css.heroSub}>Tổng quan website, đơn hàng cashback, và doanh thu affiliate.</p>
        </div>
        <button className={css.refreshBtn} onClick={handleRefresh} disabled={refreshing} title="Refresh">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? css.spinning : ""}>
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      {/* ═══ KPI Strip ═══ */}
      <div className={css.kpiStrip}>
        <div className={css.kpiCard}>
          <div className={`${css.kpiIcon} ${css.kpiBlue}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div>
          <div className={css.kpiBody}>
            <span className={css.kpiLabel}>Views hôm nay</span>
            <span className={css.kpiValue}>{analytics?.today.views ?? 0}</span>
          </div>
        </div>
        <div className={css.kpiCard}>
          <div className={`${css.kpiIcon} ${css.kpiGreen}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <div className={css.kpiBody}>
            <span className={css.kpiLabel}>Visitors</span>
            <span className={css.kpiValue}>{analytics?.today.visitors ?? 0}</span>
          </div>
        </div>
        <div className={css.kpiCard}>
          <div className={`${css.kpiIcon} ${css.kpiOrange}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/></svg></div>
          <div className={css.kpiBody}>
            <span className={css.kpiLabel}>Clicks</span>
            <span className={css.kpiValue}>{analytics?.today.clicks ?? 0}</span>
          </div>
        </div>
        <div className={css.kpiCard}>
          <div className={`${css.kpiIcon} ${css.kpiPurple}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg></div>
          <div className={css.kpiBody}>
            <span className={css.kpiLabel}>Views 7 ngày</span>
            <span className={css.kpiValue}>{analytics?.total.pageViews ?? 0}</span>
          </div>
        </div>
        <div className={css.kpiCard}>
          <div className={`${css.kpiIcon} ${css.kpiRed}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
          <div className={css.kpiBody}>
            <span className={css.kpiLabel}>Người dùng</span>
            <span className={css.kpiValue}>{data.totalUsers}</span>
          </div>
        </div>
      </div>

      {/* ═══ Analytics Row ═══ */}
      {analytics && analytics.viewsByDay.length > 0 && (
        <div className={css.analyticsRow}>
          {/* Traffic Chart */}
          <div className={css.card}>
            <h3 className={css.cardTitle}>Traffic 7 ngày</h3>
            <div className={css.barChart}>
              {analytics.viewsByDay.map((d, i) => {
                const max = Math.max(...analytics.viewsByDay.map((x) => x.views), 1);
                return (
                  <div key={i} className={css.barCol}>
                    <span className={css.barLabel}>{d.views || ""}</span>
                    <div className={css.barTrack}>
                      <div className={css.barFill} style={{ height: `${Math.max((d.views / max) * 100, 4)}%` }} />
                    </div>
                    <span className={css.barDate}>{d.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Pages */}
          <div className={css.card}>
            <h3 className={css.cardTitle}>Top trang truy cập</h3>
            <div className={css.rankList}>
              {analytics.topPages.slice(0, 5).map((p, i) => (
                <div key={i} className={css.rankItem}>
                  <span className={css.rankDot} style={{ background: ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#64748b"][i] }} />
                  <span className={css.rankName}>{p.page === "/" ? "Trang chủ" : p.page}</span>
                  <span className={css.rankVal}>{p.views}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Features */}
          <div className={css.card}>
            <h3 className={css.cardTitle}>Top click tính năng</h3>
            <div className={css.rankList}>
              {analytics.topFeatures.slice(0, 5).map((f, i) => (
                <div key={i} className={css.rankItem}>
                  <span className={css.rankDot} style={{ background: ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#64748b"][i] }} />
                  <span className={css.rankName}>{f.feature}</span>
                  <span className={css.rankVal}>{f.clicks}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Content Stats ═══ */}
      <div className={css.sectionTitle}>Nội dung Website</div>
      <div className={css.contentGrid}>
        {[
          { label: "Deal 1K", value: features?.deals.count ?? "—", color: "#fee2e2", stroke: "#dc2626",
            svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> },
          { label: "Flash Sale", value: features?.flashSales.count ?? "—", color: "#fef3c7", stroke: "#d97706",
            svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
          { label: "Voucher", value: features?.vouchers.count ?? "—", color: "#d1fae5", stroke: "#059669",
            svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
          { label: "Bộ sưu tập", value: features?.collections.count ?? "—", color: "#dbeafe", stroke: "#3b82f6",
            svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
        ].map((item) => (
          <div key={item.label} className={css.contentCard}>
            <div className={css.contentIcon} style={{ background: item.color }}>{item.svg}</div>
            <div>
              <div className={css.contentLabel}>{item.label}</div>
              <div className={css.contentValue}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Finance KPI ═══ */}
      <div className={css.sectionTitle}>Tài chính</div>
      <div className={css.financeRow}>
        <div className={`${css.finCard} ${css.finBlue}`}>
          <div className={css.finLabel}>Tổng Đơn</div>
          <div className={css.finValue}>{data.totalOrders}</div>
          <div className={css.finMeta}>{data.approvedOrders} duyệt · {data.pendingOrders} chờ · {data.clickedOrders} click</div>
        </div>
        <div className={`${css.finCard} ${css.finGreen}`}>
          <div className={css.finLabel}>Commission</div>
          <div className={css.finValue}>{formatVND(data.totalCommission)}</div>
          <div className={css.finMeta}>Từ AccessTrade</div>
        </div>
        <div className={`${css.finCard} ${css.finOrange}`}>
          <div className={css.finLabel}>Đã Trả User</div>
          <div className={css.finValue}>{formatVND(data.totalCashbackPaid)}</div>
          <div className={css.finMeta}>Lãi ròng: <strong>{formatVND(profit)}</strong></div>
        </div>
      </div>

      {/* ═══ Charts + Bottom ═══ */}
      <div className={css.chartsRow}>
        {/* Bar Chart */}
        <div className={css.card}>
          <h3 className={css.cardTitle}>Đơn Cashback 7 ngày</h3>
          <div className={css.barChart}>
            {data.ordersLast7Days.map((d, i) => {
              const max = Math.max(...data.ordersLast7Days.map((x) => x.count), 1);
              return (
                <div key={i} className={css.barCol}>
                  <span className={css.barLabel}>{d.count || ""}</span>
                  <div className={css.barTrack}>
                    <div className={css.barFill} style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }} />
                  </div>
                  <span className={css.barDate}>{d.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Donut */}
        <div className={css.card}>
          <h3 className={css.cardTitle}>🎯 Trạng thái đơn</h3>
          <DonutChart segments={[
            { label: "Đã click", value: data.clickedOrders, color: "#94a3b8" },
            { label: "Chờ duyệt", value: data.pendingOrders, color: "#f59e0b" },
            { label: "Đã duyệt", value: data.approvedOrders, color: "#22c55e" },
            { label: "Từ chối", value: data.rejectedOrders, color: "#ef4444" },
          ]} />
        </div>
      </div>

      {/* ═══ Bottom Row ═══ */}
      <div className={css.bottomRow}>
        {/* Top Merchants */}
        <div className={css.card}>
          <h3 className={css.cardTitle}>Top Merchants</h3>
          {data.topMerchants.length === 0 ? <p className={css.emptyText}>Chưa có dữ liệu</p> : (
            <div className={css.merchantList}>
              {data.topMerchants.map((m, i) => (
                <div key={i} className={css.merchantItem}>
                  <div className={css.merchantAvatar} style={{ background: ["#f97316", "#ef4444", "#22c55e", "#3b82f6", "#8b5cf6"][i] }}>
                    {m.merchant.charAt(0).toUpperCase()}
                  </div>
                  <div className={css.merchantInfo}>
                    <div className={css.merchantName}>{m.merchant}</div>
                    <div className={css.merchantSub}>{m.count} đơn · {formatVND(m.commission)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Withdrawals */}
        <div className={css.card}>
          <h3 className={css.cardTitle}>Rút tiền</h3>
          <div className={css.withdrawHeader}>
            <span className={css.withdrawCount} style={{ color: data.pendingWithdrawals > 0 ? "#f59e0b" : "#22c55e" }}>
              {data.pendingWithdrawals}
            </span>
            <span className={css.withdrawText}>
              {data.pendingWithdrawals > 0 ? "đang chờ duyệt" : "Không có yêu cầu chờ"}
            </span>
          </div>
          <div className={css.withdrawTotal}>Tổng đã rút: <strong>{formatVND(data.totalWithdrawals)}</strong></div>
        </div>

        {/* Recent Orders */}
        <div className={css.card}>
          <h3 className={css.cardTitle}>🕑 Đơn gần nhất</h3>
          {data.recentOrders.length === 0 ? <p className={css.emptyText}>Chưa có đơn nào</p> : (
            <div className={css.orderList}>
              {data.recentOrders.map((o: any, i: number) => (
                <div key={i} className={css.orderItem}>
                  <div>
                    <div className={css.orderMerchant}>{o.merchant}</div>
                    <div className={css.orderDate}>{formatDate(o.created_at)}</div>
                  </div>
                  <span className={statusMap[o.status]?.cls ?? css.chipDefault}>
                    {statusMap[o.status]?.label ?? o.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ═══ Donut (same logic, cleaner) ═══
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <p className={css.emptyText}>Chưa có dữ liệu</p>;
  const r = 50, C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className={css.donutWrap}>
      <svg width="130" height="130" viewBox="0 0 130 130">
        {segments.map((seg, i) => {
          const pct = seg.value / total, dash = pct * C, offset = -(acc * C) + C * 0.25;
          acc += pct;
          return <circle key={i} cx="65" cy="65" r={r} fill="none" stroke={seg.color} strokeWidth="16"
            strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={offset} className={css.donutArc} />;
        })}
        <text x="65" y="62" textAnchor="middle" fontSize="20" fontWeight="800" fill="#1a1d23">{total}</text>
        <text x="65" y="78" textAnchor="middle" fontSize="9" fill="#8b95a5">tổng đơn</text>
      </svg>
      <div className={css.donutLegend}>
        {segments.map((seg, i) => (
          <div key={i} className={css.legendItem}>
            <span className={css.legendDot} style={{ background: seg.color }} />
            <span>{seg.label}</span>
            <span className={css.legendVal}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
