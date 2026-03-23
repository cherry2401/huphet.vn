"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "../admin.module.css";

type ATConversion = {
  status: number;
  transaction_id: string;
  merchant: string;
  transaction_value?: number;
  commission?: number;
  transaction_time?: string;
  utm_source?: string;
  utm_campaign?: string;
};

type Order = {
  id: string;
  user_id: string;
  merchant: string;
  product_url: string;
  status: string;
  order_amount: number | null;
  commission: number | null;
  cashback_amount: number | null;
  conversion_id: string | null;
  created_at: string;
};

type Stats = {
  totalOrders: number;
  totalCommission: number;
  totalCashback: number;
  pendingCount: number;
  approvedCount: number;
  clickedCount: number;
};

function formatVND(value: number): string {
  return value.toLocaleString("vi-VN") + " đ";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusChip(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    clicked: { bg: "#e8edf1", color: "#495057", label: "Đã click" },
    pending: { bg: "#fff3cd", color: "#856404", label: "Chờ duyệt" },
    approved: { bg: "#d4edda", color: "#155724", label: "Đã duyệt" },
    paid: { bg: "#cce5ff", color: "#004085", label: "Đã trả" },
    rejected: { bg: "#f8d7da", color: "#721c24", label: "Từ chối" },
  };
  const s = map[status] ?? { bg: "#e8edf1", color: "#495057", label: status };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "4px",
        fontSize: "0.72rem",
        fontWeight: 600,
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}

export function AdminCashbackClient() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalCommission: 0,
    totalCashback: 0,
    pendingCount: 0,
    approvedCount: 0,
    clickedCount: 0,
  });
  const [filter, setFilter] = useState("all");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState("");
  const [loading, setLoading] = useState(true);
  const [atConversions, setAtConversions] = useState<ATConversion[]>([]);

  async function fetchData() {
    setLoading(true);

    // Fetch orders
    let query = supabase
      .from("cashback_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data: ordersData } = await query;
    setOrders((ordersData as Order[]) ?? []);

    // Fetch stats
    const { data: allOrders } = await supabase
      .from("cashback_orders")
      .select("status, commission, cashback_amount");

    if (allOrders) {
      const s: Stats = {
        totalOrders: allOrders.length,
        totalCommission: 0,
        totalCashback: 0,
        pendingCount: 0,
        approvedCount: 0,
        clickedCount: 0,
      };
      for (const o of allOrders) {
        s.totalCommission += o.commission ?? 0;
        s.totalCashback += o.cashback_amount ?? 0;
        if (o.status === "pending") s.pendingCount++;
        else if (o.status === "approved" || o.status === "paid") s.approvedCount++;
        else if (o.status === "clicked") s.clickedCount++;
      }
      setStats(s);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function getATStatusLabel(status: number) {
    if (status === 1) return { label: "Approved", bg: "#d4edda", color: "#155724" };
    if (status === 2) return { label: "Rejected", bg: "#f8d7da", color: "#721c24" };
    return { label: "Pending", bg: "#fff3cd", color: "#856404" };
  }

  async function triggerSync() {
    setSyncing(true);
    setSyncResult("");
    setAtConversions([]);
    try {
      const res = await fetch("/api/cron/cashback-sync?source=admin");
      const data = await res.json();
      if (data.ok) {
        setSyncResult(
          `✅ Sync xong: ${data.total ?? 0} conversion, ${data.processed ?? 0} xử lý, ${data.matched ?? 0} matched, ${data.manualMatched ?? 0} đơn nhập tay.`
        );
        if (data.conversions) {
          setAtConversions(data.conversions);
        }
        fetchData(); // Refresh data
      } else {
        setSyncResult(`❌ Lỗi: ${data.error ?? "Unknown"}`);
      }
    } catch (err: unknown) {
      setSyncResult(`❌ Lỗi kết nối: ${err instanceof Error ? err.message : "Unknown"}`);
    }
    setSyncing(false);
  }

  return (
    <div className={styles.page}>
      {/* ═══ Hero Banner ═══ */}
      <div className={styles.heroBanner}>
        <p className={styles.eyebrow}>Quản lý</p>
        <h1 className={styles.heroTitle}>Cashback Orders</h1>
        <p className={styles.heroSub}>
          Theo dõi đơn hàng hoàn tiền, sync từ AccessTrade, quản lý trạng thái.
        </p>
      </div>

      {/* Stat Cards */}
      <div className={styles.grid}>
        <div className={`${styles.statCard} ${styles.statCardInfo}`}>
          <p className={styles.statLabel}>Tổng đơn</p>
          <p className={styles.statValue}>{stats.totalOrders}</p>
          <p className={styles.statMeta}>{stats.clickedCount} đã click</p>
        </div>
        <div className={`${styles.statCard} ${styles.statCardWarning}`}>
          <p className={styles.statLabel}>Chờ duyệt</p>
          <p className={styles.statValue}>{stats.pendingCount}</p>
          <p className={styles.statMeta}>Đang chờ AccessTrade xác nhận</p>
        </div>
        <div className={`${styles.statCard} ${styles.statCardSuccess}`}>
          <p className={styles.statLabel}>Đã duyệt</p>
          <p className={styles.statValue}>{stats.approvedCount}</p>
          <p className={styles.statMeta}>Commission: {formatVND(stats.totalCommission)}</p>
        </div>
        <div className={`${styles.statCard} ${styles.statCardDanger}`}>
          <p className={styles.statLabel}>Cashback trả user</p>
          <p className={styles.statValue}>{formatVND(stats.totalCashback)}</p>
          <p className={styles.statMeta}>70% commission</p>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlsHeader}>
          <span className={styles.controlsTitle}>Hành động</span>
        </div>
        <div className={styles.btnRow}>
          <button
            className={styles.btnPrimary}
            onClick={triggerSync}
            disabled={syncing}
          >
            {syncing ? "Đang sync..." : "Sync AccessTrade"}
          </button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "7px 14px",
              borderRadius: "4px",
              border: "1px solid var(--line)",
              fontSize: "0.8rem",
              fontWeight: 600,
              background: "var(--surface)",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            <option value="all">Tất cả</option>
            <option value="clicked">Đã click</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="paid">Đã trả</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
        {syncResult && <div className={styles.statusMessage}>{syncResult}</div>}

        {/* AT Conversions Report Table */}
        {atConversions.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>
              Báo cáo AccessTrade ({atConversions.length} conversion)
            </div>
            <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid var(--line)" }}>
              <table className={styles.table} style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Merchant</th>
                    <th>Status AT</th>
                    <th>Giá trị đơn</th>
                    <th>Commission</th>
                    <th>Thời gian</th>
                    <th>UTM Source</th>
                  </tr>
                </thead>
                <tbody>
                  {atConversions.map((c, i) => {
                    const st = getATStatusLabel(c.status);
                    return (
                      <tr key={i}>
                        <td>
                          <code style={{ fontSize: "0.7rem", wordBreak: "break-all" }}>
                            {c.transaction_id.length > 40
                              ? c.transaction_id.slice(0, 40) + "..."
                              : c.transaction_id}
                          </code>
                        </td>
                        <td style={{ fontWeight: 600, textTransform: "capitalize", whiteSpace: "nowrap" }}>
                          {c.merchant}
                        </td>
                        <td>
                          <span style={{
                            display: "inline-block", padding: "3px 10px", borderRadius: 4,
                            fontSize: "0.72rem", fontWeight: 600, background: st.bg, color: st.color,
                          }}>
                            {st.label}
                          </span>
                        </td>
                        <td>{c.transaction_value ? formatVND(c.transaction_value) : "—"}</td>
                        <td style={{ fontWeight: 600 }}>
                          {c.commission ? formatVND(c.commission) : "—"}
                        </td>
                        <td style={{ whiteSpace: "nowrap", fontSize: "0.75rem" }}>
                          {c.transaction_time ? formatDate(c.transaction_time) : "—"}
                        </td>
                        <td>
                          <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                            {c.utm_source || c.utm_campaign || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Danh sách đơn hàng ({orders.length})</h2>
        </div>
        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.emptyState}>
              <p>Đang tải...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}></span>
              <p>Chưa có đơn hàng nào</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Merchant</th>
                  <th>Trạng thái</th>
                  <th>Giá trị đơn</th>
                  <th>Commission</th>
                  <th>Cashback</th>
                  <th>Conversion ID</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{formatDate(o.created_at)}</td>
                    <td style={{ textTransform: "capitalize", fontWeight: 600 }}>
                      {o.merchant}
                    </td>
                    <td>{getStatusChip(o.status)}</td>
                    <td>{o.order_amount ? formatVND(o.order_amount) : "—"}</td>
                    <td>{o.commission ? formatVND(o.commission) : "—"}</td>
                    <td style={{ fontWeight: 700, color: "var(--success)" }}>
                      {o.cashback_amount ? formatVND(o.cashback_amount) : "—"}
                    </td>
                    <td>
                      {o.conversion_id ? (
                        <code style={{ fontSize: "0.72rem" }}>{o.conversion_id}</code>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
