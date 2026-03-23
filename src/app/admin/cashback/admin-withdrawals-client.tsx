"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../admin.module.css";

type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  account_name: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
  user_email: string;
  user_name: string;
  user_phone: string;
};

type Stats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalAmount: number;
  pendingAmount: number;
};

function formatVND(n: number) {
  return n.toLocaleString("vi-VN") + " đ";
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getStatusChip(status: string) {
  const m: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: "#fff3cd", color: "#856404", label: "Chờ duyệt" },
    approved: { bg: "#d4edda", color: "#155724", label: "Đã duyệt" },
    paid: { bg: "#cce5ff", color: "#004085", label: "Đã thanh toán" },
    rejected: { bg: "#f8d7da", color: "#721c24", label: "Từ chối" },
  };
  const s = m[status] ?? { bg: "#e8edf1", color: "#495057", label: status };
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 4, fontSize: "0.72rem", fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

export function AdminWithdrawalsClient() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0, pendingAmount: 0 });
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [noteModal, setNoteModal] = useState<{ id: string; action: string } | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals?status=${filter}`);
      const data = await res.json();
      if (!data.error) {
        setWithdrawals(data.withdrawals ?? []);
        setStats(data.stats ?? { total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0, pendingAmount: 0 });
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const res = await fetch(`/api/admin/withdrawals?status=${filter}`);
        const data = await res.json();
        if (cancelled) return;
        if (!data.error) {
          setWithdrawals(data.withdrawals ?? []);
          setStats(data.stats ?? { total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0, pendingAmount: 0 });
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [filter]);

  const handleAction = async (withdrawalId: string, action: string, note?: string) => {
    setActionMsg("");
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, action, adminNote: note }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionMsg(`✅ ${data.message}`);
        setNoteModal(null);
        setAdminNote("");
        fetchData();
      } else {
        setActionMsg(`❌ ${data.error}`);
      }
    } catch {
      setActionMsg("❌ Lỗi kết nối");
    }
  };

  return (
    <>
      {/* Stats */}
      <div className={styles.grid}>
        <div className={`${styles.statCard} ${styles.statCardInfo}`}>
          <p className={styles.statLabel}>Tổng yêu cầu</p>
          <p className={styles.statValue}>{stats.total}</p>
          <p className={styles.statMeta}>{formatVND(stats.totalAmount)}</p>
        </div>
        <div className={`${styles.statCard} ${styles.statCardWarning}`}>
          <p className={styles.statLabel}>Chờ duyệt</p>
          <p className={styles.statValue}>{stats.pending}</p>
          <p className={styles.statMeta}>{formatVND(stats.pendingAmount)}</p>
        </div>
        <div className={`${styles.statCard} ${styles.statCardSuccess}`}>
          <p className={styles.statLabel}>Đã duyệt</p>
          <p className={styles.statValue}>{stats.approved}</p>
          <p className={styles.statMeta}>Đã chuyển khoản</p>
        </div>
        <div className={`${styles.statCard} ${styles.statCardDanger}`}>
          <p className={styles.statLabel}>Từ chối</p>
          <p className={styles.statValue}>{stats.rejected}</p>
          <p className={styles.statMeta}>Đã hoàn ví</p>
        </div>
      </div>

      {/* Filter */}
      <div className={styles.controlsPanel} style={{ marginTop: 12 }}>
        <div className={styles.btnRow}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "7px 14px", borderRadius: 4, border: "1px solid var(--line)",
              fontSize: "0.8rem", fontWeight: 600, background: "var(--surface)",
              color: "var(--text)", cursor: "pointer",
            }}
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="paid">Đã thanh toán</option>
            <option value="rejected">Từ chối</option>
          </select>
          <button className={styles.btnPrimary} onClick={() => fetchData()}>
            Refresh
          </button>
        </div>
      </div>

      {actionMsg && (
        <div style={{
          padding: "10px 16px", margin: "12px 0", borderRadius: 8,
          background: actionMsg.startsWith("✅") ? "rgba(69, 203, 133, 0.1)" : "rgba(247, 108, 108, 0.1)",
          color: actionMsg.startsWith("✅") ? "#0ab39c" : "#f06548",
          fontSize: "0.85rem", fontWeight: 500,
        }}>
          {actionMsg}
        </div>
      )}

      {/* Table */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Yêu cầu rút tiền ({withdrawals.length})</h2>
        </div>
        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.emptyState}><p>Đang tải...</p></div>
          ) : withdrawals.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>—</span>
              <p>Chưa có yêu cầu rút tiền nào</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>User</th>
                  <th>Số tiền</th>
                  <th>Ngân hàng</th>
                  <th>STK</th>
                  <th>Tên TK</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td style={{ fontSize: "0.78rem" }}>{formatDate(w.created_at)}</td>
                    <td>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                        {w.user_name || w.user_email}
                      </div>
                      {w.user_name && (
                        <div style={{ fontSize: "0.72rem", color: "#878a99" }}>
                          {w.user_email}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--brand)", whiteSpace: "nowrap" }}>
                      {formatVND(w.amount)}
                    </td>
                    <td style={{ fontSize: "0.82rem" }}>{w.bank_name}</td>
                    <td><code style={{ fontSize: "0.78rem" }}>{w.bank_account}</code></td>
                    <td style={{ fontSize: "0.82rem", fontWeight: 600 }}>{w.account_name}</td>
                    <td>{getStatusChip(w.status)}</td>
                    <td>
                      {w.status === "pending" ? (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          <button
                            onClick={() => setNoteModal({ id: w.id, action: "approve" })}
                            style={{
                              padding: "4px 10px", background: "#d4edda", color: "#155724",
                              border: "none", borderRadius: 4, fontSize: "0.72rem",
                              fontWeight: 600, cursor: "pointer",
                            }}
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => setNoteModal({ id: w.id, action: "reject" })}
                            style={{
                              padding: "4px 10px", background: "#f8d7da", color: "#721c24",
                              border: "none", borderRadius: 4, fontSize: "0.72rem",
                              fontWeight: 600, cursor: "pointer",
                            }}
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#878a99" }}>
                          {w.admin_note ? w.admin_note : formatDate(w.processed_at)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Note Modal */}
      {noteModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
          onClick={() => setNoteModal(null)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 12, padding: 24, width: 400,
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 4px", fontSize: "1rem" }}>
              {noteModal.action === "approve" ? "Duyệt yêu cầu rút tiền" : "Từ chối yêu cầu rút tiền"}
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#878a99", margin: "0 0 16px" }}>
              {noteModal.action === "reject"
                ? "Số tiền sẽ được hoàn lại vào ví user."
                : "Xác nhận đã chuyển khoản cho user."}
            </p>
            <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>
              Ghi chú (không bắt buộc)
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={noteModal.action === "reject" ? "Lý do từ chối..." : "Ghi chú..."}
                style={{
                  display: "block", width: "100%", marginTop: 4, padding: "8px 12px",
                  border: "1px solid #e0e3eb", borderRadius: 6, fontSize: "0.85rem",
                  minHeight: 60, resize: "vertical",
                }}
              />
            </label>
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setNoteModal(null); setAdminNote(""); }}
                style={{
                  padding: "8px 18px", background: "#f3f6f9", color: "#495057",
                  border: "none", borderRadius: 6, fontSize: "0.82rem", cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => handleAction(noteModal.id, noteModal.action, adminNote)}
                style={{
                  padding: "8px 18px",
                  background: noteModal.action === "approve" ? "#0ab39c" : "#f06548",
                  color: "#fff", border: "none", borderRadius: 6,
                  fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                }}
              >
                {noteModal.action === "approve" ? "Duyệt" : "Từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
