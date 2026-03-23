/* eslint-disable react-hooks/immutability */
"use client";

import { useState, useEffect } from "react";
import styles from "./submit-order.module.css";

type Order = {
  id: string;
  order_code: string;
  merchant: string;
  order_amount: number | null;
  cashback_amount: number | null;
  status: "pending" | "approved" | "paid" | "rejected";
  created_at: string;
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: "Chờ xác minh", cls: styles.statusPending },
  approved: { label: "Đã duyệt", cls: styles.statusApproved },
  paid: { label: "Đã cộng xu", cls: styles.statusPaid },
  rejected: { label: "Từ chối", cls: styles.statusRejected },
};

export default function SubmitOrderClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderCode, setOrderCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const res = await fetch("/api/cashback/submit-order");
      const data = await res.json();
      if (data.ok) setOrders(data.orders);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleSubmit() {
    setError("");
    setSuccess("");

    const code = orderCode.trim().toUpperCase();
    if (!code) {
      setError("Vui lòng nhập mã đơn hàng.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/cashback/submit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode: code }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Có lỗi xảy ra.");
      } else {
        setSuccess(data.message);
        setOrderCode("");
        loadOrders();
      }
    } catch {
      setError("Lỗi kết nối, vui lòng thử lại.");
    }
    setSubmitting(false);
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatMoney = (n: number | null) =>
    n ? n.toLocaleString("vi-VN") + "đ" : "—";

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.hero}>
          <div className={styles.heroInner}>
            <h1 className={styles.heroTitle}>Đang tải...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroHighlight}>Nhập đơn</span> hoàn tiền
          </h1>
          <p className={styles.heroSubtitle}>
            Nhập mã đơn Shopee mua qua link MXH để nhận xu thưởng
          </p>
        </div>
      </div>

      <div className={styles.main}>
        {/* Steps */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
            Cách thức hoạt động
          </h3>
          <ul className={styles.stepsList}>
            <li className={styles.stepItem}>
              <span className={styles.stepNumber}>1</span>
              <span>Mua hàng qua link Húp Hết từ MXH (Facebook, Zalo, TikTok...)</span>
            </li>
            <li className={styles.stepItem}>
              <span className={styles.stepNumber}>2</span>
              <span>Copy mã đơn hàng từ Shopee và nhập vào bên dưới</span>
            </li>
            <li className={styles.stepItem}>
              <span className={styles.stepNumber}>3</span>
              <span>Hệ thống xác minh trong 24-48h → xu tự động cộng vào ví</span>
            </li>
          </ul>
        </div>

        {/* Order Code Form */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M7 7h.01"/>
              <path d="M17 7h.01"/>
              <path d="M7 17h.01"/>
              <path d="M17 17h.01"/>
            </svg>
            Mã đơn hàng Shopee
          </h3>

          {error && <div className={styles.errorMsg}>{error}</div>}
          {success && <div className={styles.successMsg}>{success}</div>}

          <div className={styles.formRow}>
            <input
              type="text"
              className={styles.orderInput}
              placeholder="VD: 251227EUUV3CC4"
              value={orderCode}
              onChange={(e) => { setOrderCode(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              maxLength={30}
            />
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={submitting || !orderCode.trim()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {submitting ? "Đang gửi..." : "Nhập"}
            </button>
          </div>
        </div>

        {/* Order History */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Lịch sử đơn ({orders.length})
          </h3>

          {orders.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
              <div className={styles.emptyText}>Chưa có đơn nào</div>
            </div>
          ) : (
            <div className={styles.historyList}>
              {orders.map((o) => {
                const st = STATUS_MAP[o.status] ?? STATUS_MAP.pending;
                const iconBg =
                  o.status === "paid" ? "rgba(16,185,129,0.1)" :
                  o.status === "rejected" ? "rgba(220,38,38,0.1)" :
                  o.status === "approved" ? "rgba(37,99,235,0.1)" :
                  "rgba(217,119,6,0.1)";
                const iconColor =
                  o.status === "paid" ? "#10b981" :
                  o.status === "rejected" ? "#dc2626" :
                  o.status === "approved" ? "#2563eb" :
                  "#d97706";

                return (
                  <div key={o.id} className={styles.historyRow}>
                    <div className={styles.historyIcon} style={{ background: iconBg, color: iconColor }}>
                      {o.status === "paid" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : o.status === "rejected" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      )}
                    </div>
                    <div className={styles.historyInfo}>
                      <div className={styles.historyOrderCode}>{o.order_code}</div>
                      <div className={styles.historyAmount}>
                        {o.cashback_amount ? `+${formatMoney(o.cashback_amount)}` : "Đang xác minh"}
                      </div>
                    </div>
                    <div>
                      <span className={`${styles.historyStatus} ${st.cls}`}>{st.label}</span>
                      <div className={styles.historyDate}>{formatDate(o.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className={styles.note}>
          Đơn từ MXH sẽ ít điểm thưởng hơn so với đơn qua app/tự tạo link.<br/>
          Hệ thống xác minh tự động trong 24-48h.
        </p>
      </div>
    </div>
  );
}
