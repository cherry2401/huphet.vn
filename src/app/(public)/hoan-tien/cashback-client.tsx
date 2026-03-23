"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./cashback.module.css";
import { trackFeatureClick } from "@/components/analytics/track";

type Props = { isLoggedIn: boolean };

type Wallet = { balance: number; total_earned: number; total_withdrawn: number };
type Withdrawal = {
  id: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  account_name: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
};
type Order = {
  id: string;
  merchant: string;
  order_amount: number | null;
  cashback_amount: number | null;
  status: string;
  created_at: string;
};

const MERCHANTS = [
  { name: "Shopee", color: "#ee4d2d", logo: "/images/logo-shopee.png", fit: "contain" as const },
  { name: "Lazada", color: "#0f146d", logo: "/images/logo-lazada.png", fit: "cover" as const },
  { name: "TikTok Shop", color: "#000000", logo: "/images/logo-tiktok.png", fit: "cover" as const },
];

const BANKS = [
  "Vietcombank", "Techcombank", "MB Bank", "BIDV", "VietinBank",
  "ACB", "Sacombank", "TPBank", "VPBank", "Agribank",
  "SHB", "HDBank", "OCB", "SeABank", "LienVietPostBank",
  "MSB", "VIB", "Eximbank", "NamABank", "BacABank",
  "Momo", "ZaloPay",
];

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

function statusStyle(s: string) {
  const m: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: "#fff3cd", color: "#856404", label: "Chờ duyệt" },
    approved: { bg: "#d4edda", color: "#155724", label: "Đã duyệt" },
    paid: { bg: "#cce5ff", color: "#004085", label: "Đã thanh toán" },
    rejected: { bg: "#f8d7da", color: "#721c24", label: "Từ chối" },
    clicked: { bg: "#e8edf1", color: "#495057", label: "Đã click" },
  };
  return m[s] ?? { bg: "#e8edf1", color: "#495057", label: s };
}

export default function CashbackClient({ isLoggedIn }: Props) {
  // Link generation
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    affiliateUrl: string; merchant: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Wallet & history
  const [wallet, setWallet] = useState<Wallet>({ balance: 0, total_earned: 0, total_withdrawn: 0 });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [historyTab, setHistoryTab] = useState<"withdraw" | "orders">("withdraw");
  const [walletLoading, setWalletLoading] = useState(false);

  // Withdraw form
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wAmount, setWAmount] = useState("");
  const [wBank, setWBank] = useState("");
  const [wAccount, setWAccount] = useState("");
  const [wName, setWName] = useState("");
  const [wLoading, setWLoading] = useState(false);
  const [wMessage, setWMessage] = useState("");
  const [wError, setWError] = useState("");

  const fetchWallet = useCallback(async () => {
    if (!isLoggedIn) return;
    setWalletLoading(true);
    try {
      const res = await fetch("/api/cashback/withdraw");
      const data = await res.json();
      if (!data.error) {
        setWallet(data.wallet);
        setWithdrawals(data.withdrawals ?? []);
        setOrders(data.orders ?? []);
      }
    } catch { /* ignore */ }
    setWalletLoading(false);
  }, [isLoggedIn]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  // ── Link generation ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setError(""); setResult(null); setLoading(true); setCopied(false);
    try {
      const res = await fetch("/api/cashback/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productUrl: url.trim() }),
      });
      const data = await res.json();
      if (!data.ok) setError(data.error || "Đã có lỗi xảy ra.");
      else {
        setResult({ affiliateUrl: data.affiliateUrl, merchant: data.merchant });
        trackFeatureClick("/hoan-tien", "cashback_link");
      }
    } catch { setError("Lỗi kết nối, vui lòng thử lại."); }
    finally { setLoading(false); }
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.affiliateUrl);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = result.affiliateUrl;
      document.body.appendChild(input); input.select();
      document.execCommand("copy"); document.body.removeChild(input);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  }

  // ── Withdraw ──
  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWError(""); setWMessage(""); setWLoading(true);
    try {
      const res = await fetch("/api/cashback/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(wAmount),
          bankName: wBank,
          bankAccount: wAccount,
          accountName: wName,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setWMessage(data.message);
        setShowWithdraw(false);
        setWAmount(""); setWBank(""); setWAccount(""); setWName("");
        fetchWallet();
      } else {
        setWError(data.error ?? "Lỗi không xác định");
      }
    } catch { setWError("Lỗi kết nối"); }
    finally { setWLoading(false); }
  }

  const hasPending = withdrawals.some((w) => w.status === "pending");

  return (
    <div className={styles.container}>
      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            Mua sắm qua <span className={styles.heroHighlight}>Cashback</span>
            <br />
            nhận <span className={styles.heroHighlight}>hoàn tiền thật</span>!
          </h1>
          <p className={styles.heroSubtitle}>
            Dán link sản phẩm từ Shopee, Lazada, TikTok Shop — mua sắm bình thường và nhận hoàn tiền về tài khoản.
          </p>

          {isLoggedIn ? (
            <form onSubmit={handleSubmit} className={styles.linkBox}>
              <input
                className={styles.linkInput}
                type="text"
                placeholder="Dán link sản phẩm Shopee, Lazada, TikTok Shop..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
              <button className={styles.linkBtn} type="submit" disabled={loading || !url.trim()}>
                {loading ? "Đang tạo..." : "Lấy hoàn tiền"}
              </button>
            </form>
          ) : (
            <div className={styles.loginCta}>
              <p>Đăng nhập để bắt đầu nhận hoàn tiền mua sắm!</p>
              <Link href="/login">Đăng nhập ngay</Link>
            </div>
          )}

          <div className={styles.merchantsRow}>
            {MERCHANTS.map((m) => (
              <div
                key={m.name}
                className={styles.merchantIcon}
                title={m.name}
              >
                <Image src={m.logo} alt={m.name} width={40} height={40} style={{ width: "100%", height: "100%", objectFit: m.fit, borderRadius: "inherit" }} />
              </div>
            ))}
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {result && (
            <div className={styles.resultCard}>
              <div className={styles.resultHeader}>
                <span className={styles.resultBadge}>✓ Đã tạo link hoàn tiền</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginLeft: "auto" }}>
                  {result.merchant.charAt(0).toUpperCase() + result.merchant.slice(1)}
                </span>
              </div>
              <div className={styles.resultLink}>
                <div className={styles.resultUrl}>{result.affiliateUrl}</div>
                <button className={styles.copyBtn} onClick={handleCopy}>
                  {copied ? "Đã copy ✓" : "Copy"}
                </button>
              </div>
              <button
                onClick={() => result && window.open(result.affiliateUrl, "_blank")}
                style={{
                  width: "100%", marginTop: 12, padding: "12px 16px", borderRadius: 10,
                  border: "1.5px solid var(--brand)", background: "transparent",
                  color: "var(--brand)", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                }}
              >
                Mở link mua hàng →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ===== WALLET (logged in only) ===== */}
      {isLoggedIn && (
        <>
          <section className={styles.walletSection}>
            <div className={styles.walletGrid}>
              <div className={styles.walletCard}>
                <p className={styles.walletLabel}>Số dư hiện tại</p>
                <p className={`${styles.walletValue} ${styles.brand}`}>
                  {walletLoading ? "..." : formatVND(wallet.balance)}
                </p>
              </div>
              <div className={styles.walletCard}>
                <p className={styles.walletLabel}>Đã tích lũy</p>
                <p className={`${styles.walletValue} ${styles.success}`}>
                  {walletLoading ? "..." : formatVND(wallet.total_earned)}
                </p>
              </div>
              <div className={styles.walletCard}>
                <p className={styles.walletLabel}>Đã rút</p>
                <p className={styles.walletValue}>
                  {walletLoading ? "..." : formatVND(wallet.total_withdrawn)}
                </p>
              </div>
            </div>

            {!showWithdraw ? (
              <div style={{ textAlign: "center" }}>
                <button
                  className={styles.withdrawBtn}
                  style={{ maxWidth: 320 }}
                  onClick={() => setShowWithdraw(true)}
                  disabled={wallet.balance < 10000 || hasPending}
                >
                  {hasPending
                    ? "⏳ Đang chờ duyệt yêu cầu trước"
                    : wallet.balance < 10000
                    ? "Chưa đủ số dư tối thiểu (10.000đ)"
                    : "💰 Rút tiền về ngân hàng"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className={styles.withdrawCard}>
                <h3 className={styles.withdrawTitle}>Rút tiền về ngân hàng</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Số tiền rút (đ)</label>
                    <input
                      className={styles.formInput}
                      type="number"
                      placeholder="Tối thiểu 10.000"
                      value={wAmount}
                      onChange={(e) => setWAmount(e.target.value)}
                      min={10000}
                      max={wallet.balance}
                      required
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Ngân hàng</label>
                    <select
                      className={styles.formInput}
                      value={wBank}
                      onChange={(e) => setWBank(e.target.value)}
                      required
                    >
                      <option value="">Chọn ngân hàng</option>
                      {BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Số tài khoản</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      placeholder="Nhập số tài khoản"
                      value={wAccount}
                      onChange={(e) => setWAccount(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Tên chủ tài khoản</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      placeholder="VD: NGUYEN VAN A"
                      value={wName}
                      onChange={(e) => setWName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setShowWithdraw(false)}
                    style={{
                      flex: 1, padding: 14, border: "1px solid var(--line)",
                      borderRadius: 10, background: "#fff", color: "var(--text)",
                      fontWeight: 600, cursor: "pointer", fontSize: "0.9rem",
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className={styles.withdrawBtn}
                    style={{ flex: 2, marginTop: 0 }}
                    disabled={wLoading}
                  >
                    {wLoading ? "Đang gửi..." : `Rút ${wAmount ? formatVND(Number(wAmount)) : "..."}`}
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Alerts */}
          {wMessage && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              ✅ {wMessage}
            </div>
          )}
          {wError && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              ❌ {wError}
            </div>
          )}

          {/* ===== HISTORY TABS ===== */}
          <div className={styles.tabNav}>
            <button
              className={`${styles.tab} ${historyTab === "withdraw" ? styles.active : ""}`}
              onClick={() => setHistoryTab("withdraw")}
            >
              Lịch sử rút tiền ({withdrawals.length})
            </button>
            <button
              className={`${styles.tab} ${historyTab === "orders" ? styles.active : ""}`}
              onClick={() => setHistoryTab("orders")}
            >
              Đơn cashback ({orders.length})
            </button>
          </div>

          <section className={styles.historySection}>
            <div className={styles.historyCard}>
              {historyTab === "withdraw" ? (
                withdrawals.length === 0 ? (
                  <div className={styles.emptyHistory}>
                    Chưa có yêu cầu rút tiền nào
                  </div>
                ) : (
                  <table className={styles.historyTable}>
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th>Số tiền</th>
                        <th>Ngân hàng</th>
                        <th>STK</th>
                        <th>Trạng thái</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((w) => {
                        const s = statusStyle(w.status);
                        return (
                          <tr key={w.id}>
                            <td>{formatDate(w.created_at)}</td>
                            <td style={{ fontWeight: 700 }}>{formatVND(w.amount)}</td>
                            <td>{w.bank_name}</td>
                            <td><code style={{ fontSize: "0.78rem" }}>{w.bank_account}</code></td>
                            <td>
                              <span className={styles.statusChip} style={{ background: s.bg, color: s.color }}>
                                {s.label}
                              </span>
                            </td>
                            <td style={{ fontSize: "0.78rem", color: "#878a99" }}>
                              {w.admin_note ?? "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              ) : orders.length === 0 ? (
                <div className={styles.emptyHistory}>
                  Chưa có đơn cashback nào
                </div>
              ) : (
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Merchant</th>
                      <th>Giá trị đơn</th>
                      <th>Cashback</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const s = statusStyle(o.status);
                      return (
                        <tr key={o.id}>
                          <td>{formatDate(o.created_at)}</td>
                          <td style={{ fontWeight: 600, textTransform: "capitalize" }}>{o.merchant}</td>
                          <td>{o.order_amount ? formatVND(o.order_amount) : "—"}</td>
                          <td style={{ fontWeight: 700, color: "#16a34a" }}>
                            {o.cashback_amount ? formatVND(o.cashback_amount) : "—"}
                          </td>
                          <td>
                            <span className={styles.statusChip} style={{ background: s.bg, color: s.color }}>
                              {s.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      )}

      {/* ===== NOTICE ===== */}
      <div className={styles.notice}>
        <div className={styles.noticeTitle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          LƯU Ý QUAN TRỌNG
        </div>
        <ul className={styles.noticeList}>
          <li>Xóa sản phẩm tương tự đã có trong giỏ hàng trước khi bấm link</li>
          <li>Không bấm link khác (live, video, quảng cáo) khi đang mua hàng</li>
          <li>Hoàn tất mua hàng trong cùng một phiên trình duyệt</li>
          <li>Hoàn tiền sẽ được ghi nhận sau 24-48h khi đơn hàng được xác nhận</li>
          <li>Rút tiền tối thiểu 10.000đ, xử lý trong 1-3 ngày làm việc</li>
        </ul>
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <section className={styles.howSection}>
        <h2 className={styles.sectionTitle}>Cách nhận hoàn tiền</h2>
        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <div className={styles.stepNum}>1</div>
            <div className={styles.stepTitle}>Dán link</div>
            <div className={styles.stepDesc}>Copy link sản phẩm từ Shopee, Lazada, TikTok Shop và dán vào ô trên</div>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNum}>2</div>
            <div className={styles.stepTitle}>Lấy link hoàn tiền</div>
            <div className={styles.stepDesc}>Bấm &quot;Lấy hoàn tiền&quot; để tạo link affiliate tracking</div>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNum}>3</div>
            <div className={styles.stepTitle}>Mua hàng</div>
            <div className={styles.stepDesc}>Bấm link → mua sắm bình thường, không cần thay đổi gì</div>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNum}>4</div>
            <div className={styles.stepTitle}>Rút tiền</div>
            <div className={styles.stepDesc}>Đơn xác nhận → cashback vào ví → rút về ngân hàng bất cứ lúc nào</div>
          </div>
        </div>
      </section>
    </div>
  );
}
