/* eslint-disable react-hooks/immutability */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./withdraw.module.css";

type BankAccount = {
  id: string;
  bank_name: string;
  bank_short_name: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
};

type Withdrawal = {
  id: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  account_name: string;
  status: "pending" | "approved" | "paid" | "rejected";
  admin_note?: string;
  created_at: string;
};

type Wallet = {
  balance: number;
  total_earned: number;
  total_withdrawn: number;
};

const QUICK_AMOUNTS = [20000, 50000, 100000, 200000, 500000];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: "Chờ duyệt", cls: styles.statusPending },
  approved: { label: "Đã duyệt", cls: styles.statusApproved },
  paid: { label: "Đã thanh toán", cls: styles.statusPaid },
  rejected: { label: "Từ chối", cls: styles.statusRejected },
};

export default function WithdrawClient() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [amount, setAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load wallet + withdrawals
      const res = await fetch("/api/cashback/withdraw");
      const data = await res.json();
      setWallet(data.wallet);
      setWithdrawals(data.withdrawals ?? []);

      // Load bank accounts
      const { data: accounts } = await supabase
        .from("user_bank_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      setBankAccounts(accounts ?? []);
      // Auto-select default bank
      const def = (accounts ?? []).find((a: BankAccount) => a.is_default);
      if (def) setSelectedBank(def);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleSubmit() {
    setError("");
    setSuccess("");

    if (!amount || Number(amount) < 10000) {
      setError("Số tiền rút tối thiểu là 10.000đ");
      return;
    }

    if (!selectedBank) {
      setError("Vui lòng chọn tài khoản ngân hàng nhận tiền");
      return;
    }

    if (wallet && Number(amount) > wallet.balance) {
      setError("Số dư không đủ để rút");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/cashback/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          bankName: selectedBank.bank_name,
          bankAccount: selectedBank.account_number,
          accountName: selectedBank.account_name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
      } else {
        setSuccess("Yêu cầu rút tiền đã được gửi! Vui lòng chờ admin duyệt.");
        setAmount("");
        loadData();
      }
    } catch {
      setError("Lỗi kết nối, vui lòng thử lại");
    }
    setSubmitting(false);
  }

  const formatMoney = (n: number) =>
    n.toLocaleString("vi-VN") + "đ";

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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
          <h1 className={styles.heroTitle}>
            <span className={styles.heroHighlight}>Rút tiền</span> về tài khoản
          </h1>
          <p className={styles.heroSubtitle}>
            Rút cashback về ngân hàng hoặc ví điện tử — xử lý trong 24h
          </p>
        </div>
      </div>

      <div className={styles.main}>
        {/* Wallet Summary */}
        <div className={styles.walletGrid}>
          <div className={styles.walletCard}>
            <div>
              <div className={`${styles.walletValue} ${styles.walletHighlight}`}>
                {formatMoney(wallet?.balance ?? 0)}
              </div>
              <div className={styles.walletLabel}>Số dư khả dụng</div>
            </div>
          </div>
          <div className={styles.walletCard}>
            <div>
              <div className={styles.walletValue}>
                {formatMoney(wallet?.total_earned ?? 0)}
              </div>
              <div className={styles.walletLabel}>Tổng đã nhận</div>
            </div>
          </div>
          <div className={styles.walletCard}>
            <div>
              <div className={styles.walletValue}>
                {formatMoney(wallet?.total_withdrawn ?? 0)}
              </div>
              <div className={styles.walletLabel}>Tổng đã rút</div>
            </div>
          </div>
        </div>

        {/* Withdraw Form */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <path d="M2 10h20"/>
            </svg>
            Tạo yêu cầu rút tiền
          </h3>

          {error && <div className={styles.errorMsg}>{error}</div>}
          {success && <div className={styles.successMsg}>{success}</div>}

          {/* Amount */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Số tiền muốn rút (tối thiểu 10.000đ)</label>
            <input
              type="number"
              className={`${styles.fieldInput} ${styles.amountInput}`}
              placeholder="0"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              min={10000}
            />
            <div className={styles.quickAmounts}>
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  className={`${styles.quickAmountBtn} ${Number(amount) === q ? styles.quickAmountBtnActive : ""}`}
                  onClick={() => setAmount(String(q))}
                  type="button"
                >
                  {q >= 1000 ? `${q / 1000}K` : q}
                </button>
              ))}
              {wallet && wallet.balance >= 10000 && (
                <button
                  className={`${styles.quickAmountBtn} ${Number(amount) === wallet.balance ? styles.quickAmountBtnActive : ""}`}
                  onClick={() => setAmount(String(wallet.balance))}
                  type="button"
                >
                  Tất cả
                </button>
              )}
            </div>
          </div>

          {/* Bank Account */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Tài khoản nhận tiền</label>
            {bankAccounts.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {bankAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    className={styles.bankSelector}
                    onClick={() => setSelectedBank(acc)}
                    style={{
                      borderColor: selectedBank?.id === acc.id ? "#0ea5e9" : undefined,
                      background: selectedBank?.id === acc.id ? "rgba(14,165,233,0.04)" : undefined,
                    }}
                  >
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>
                        {acc.bank_name}
                        {acc.is_default && (
                          <span style={{
                            fontSize: "0.6rem",
                            padding: "1px 5px",
                            borderRadius: 4,
                            background: "rgba(14,165,233,0.1)",
                            color: "#0ea5e9",
                            marginLeft: 6,
                            fontWeight: 700,
                          }}>Mặc định</span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                        {acc.account_number} • {acc.account_name}
                      </div>
                    </div>
                    {selectedBank?.id === acc.id && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
                <Link
                  href="/tai-khoan?tab=profile"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "10px 14px",
                    border: "1.5px dashed rgba(0,0,0,0.12)",
                    borderRadius: 10,
                    background: "transparent",
                    color: "var(--text-secondary)",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "all 150ms",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#0ea5e9";
                    (e.currentTarget as HTMLElement).style.color = "#0ea5e9";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.12)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Thêm tài khoản mới
                </Link>
              </div>
            ) : (
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", padding: "12px 0" }}>
                Bạn chưa có tài khoản ngân hàng nào.{" "}
                <Link href="/tai-khoan?tab=profile" style={{ color: "#0ea5e9", fontWeight: 600 }}>
                  Thêm ngay →
                </Link>
              </div>
            )}
          </div>

          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting || !amount || !selectedBank}
          >
            {submitting ? "Đang gửi..." : "Gửi yêu cầu rút tiền"}
          </button>
        </div>

        {/* Withdrawal History */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Lịch sử rút tiền
          </h3>

          {withdrawals.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <path d="M2 10h20"/>
                </svg>
              </div>
              <div className={styles.emptyText}>Chưa có yêu cầu rút tiền nào</div>
            </div>
          ) : (
            <div className={styles.historyList}>
              {withdrawals.map((w) => {
                const st = STATUS_MAP[w.status] ?? STATUS_MAP.pending;
                const iconBg =
                  w.status === "paid" ? "rgba(16,185,129,0.1)" :
                  w.status === "rejected" ? "rgba(220,38,38,0.1)" :
                  w.status === "approved" ? "rgba(37,99,235,0.1)" :
                  "rgba(217,119,6,0.1)";
                const iconColor =
                  w.status === "paid" ? "#10b981" :
                  w.status === "rejected" ? "#dc2626" :
                  w.status === "approved" ? "#2563eb" :
                  "#d97706";

                return (
                  <div key={w.id} className={styles.historyRow}>
                    <div className={styles.historyIcon} style={{ background: iconBg, color: iconColor }}>
                      {w.status === "paid" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : w.status === "rejected" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      )}
                    </div>
                    <div className={styles.historyInfo}>
                      <div className={styles.historyAmount}>-{formatMoney(w.amount)}</div>
                      <div className={styles.historyBank}>{w.bank_name} • {w.account_name}</div>
                    </div>
                    <div>
                      <span className={`${styles.historyStatus} ${st.cls}`}>{st.label}</span>
                      <div className={styles.historyDate}>{formatDate(w.created_at)}</div>
                      {w.admin_note && (
                        <div style={{ fontSize: "0.68rem", color: "#dc2626", marginTop: 2 }}>
                          {w.admin_note}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
