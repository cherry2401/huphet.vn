/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./dashboard.module.css";
import wStyles from "../rut-tien/withdraw.module.css";

type UserInfo = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  createdAt: string;
  provider: string;
};

type Tab = "overview" | "cashback" | "profile" | "security" | "withdrawal";

const SIDEBAR_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "overview",
    label: "Tổng quan",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1"/>
        <rect x="14" y="3" width="7" height="5" rx="1"/>
        <rect x="14" y="12" width="7" height="9" rx="1"/>
        <rect x="3" y="16" width="7" height="5" rx="1"/>
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Thông tin cá nhân",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    id: "cashback",
    label: "Hoàn tiền",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73z"/>
      </svg>
    ),
  },
  {
    id: "withdrawal" as Tab,
    label: "Rút tiền",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M2 10h20"/>
      </svg>
    ),
  },
  {
    id: "security",
    label: "Bảo mật",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
];

export default function DashboardClient({ user }: { user: UserInfo }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "overview";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);

  // Sync tab with URL searchParams changes (one-way: URL → state)
  useEffect(() => {
    const tabFromUrl = (searchParams.get("tab") as Tab) || "overview";
    setActiveTab(tabFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.displayName);

  // Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const initial = (user.displayName || user.email || "U").charAt(0).toUpperCase();
  const isEmailUser = user.provider !== "google";

  function showMsg(text: string, type: "success" | "error" = "success") {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  }

  async function handleSaveName() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("user_profiles")
      .update({ display_name: name, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) {
      showMsg("Lỗi: " + error.message, "error");
    } else {
      showMsg("Đã cập nhật tên thành công!");
      setEditing(false);
    }
    setLoading(false);
    router.refresh();
  }

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      showMsg("Mật khẩu mới phải có ít nhất 6 ký tự", "error");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showMsg("Mật khẩu xác nhận không khớp", "error");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      showMsg("Lỗi: " + error.message, "error");
    } else {
      showMsg("Đã đổi mật khẩu thành công!");
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmNewPassword("");
    }
    setLoading(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={styles.dashboard}>
      {/* ===== SIDEBAR ===== */}
      <aside className={styles.sidebar}>
        <nav className={styles.sidebarNav}>
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`${styles.sidebarItem} ${activeTab === item.id ? styles.sidebarItemActive : ""}`}
              onClick={() => {
                setActiveTab(item.id);
                router.push(item.id === "overview" ? "/tai-khoan" : `/tai-khoan?tab=${item.id}`, { scroll: false });
              }}
            >
              <span className={styles.sidebarIcon}>{item.icon}</span>
              <span className={styles.sidebarLabel}>{item.label}</span>
            </button>
          ))}

          <div className={styles.sidebarDivider} />

          <button className={styles.sidebarItem} onClick={handleLogout} style={{ color: "#dc2626" }}>
            <span className={styles.sidebarIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            <span className={styles.sidebarLabel}>Đăng xuất</span>
          </button>
        </nav>
      </aside>

      {/* ===== CONTENT ===== */}
      <main className={styles.content}>
        {message && (
          <div className={messageType === "error" ? styles.msgError : styles.msgSuccess}>
            {message}
          </div>
        )}

        {activeTab === "overview" && (
          <OverviewTab user={user} joinDate={joinDate} />
        )}

        {activeTab === "profile" && (
          <ProfileTab
            user={user}
            initial={initial}
            editing={editing}
            setEditing={setEditing}
            name={name}
            setName={setName}
            handleSaveName={handleSaveName}
            loading={loading}
            joinDate={joinDate}
          />
        )}

        {activeTab === "cashback" && (
          <CashbackTab userId={user.id} />
        )}

        {activeTab === "security" && (
          <SecurityTab
            isEmailUser={isEmailUser}
            showPasswordForm={showPasswordForm}
            setShowPasswordForm={setShowPasswordForm}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmNewPassword={confirmNewPassword}
            setConfirmNewPassword={setConfirmNewPassword}
            handleChangePassword={handleChangePassword}
            loading={loading}
            provider={user.provider}
          />
        )}

        {activeTab === "withdrawal" && (
          <WithdrawalTab />
        )}
      </main>
    </div>
  );
}

/* ===== TAB: OVERVIEW ===== */
type RecentOrder = {
  id: string;
  merchant: string;
  product_url: string;
  cashback_rate: number;
  status: string;
  created_at: string;
};

function OverviewTab({ user, joinDate }: { user: UserInfo; joinDate: string }) {
  const [stats, setStats] = useState<{
    orderCount: number;
    balance: number;
    totalEarned: number;
    totalWithdrawn: number;
  } | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [walletRes, ordersRes, recentRes] = await Promise.all([
        supabase.from("cashback_wallets").select("balance, total_earned, total_withdrawn").eq("user_id", user.id).single(),
        supabase.from("cashback_orders").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("cashback_orders").select("id, merchant, product_url, cashback_rate, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({
        balance: walletRes.data?.balance ?? 0,
        totalEarned: walletRes.data?.total_earned ?? 0,
        totalWithdrawn: walletRes.data?.total_withdrawn ?? 0,
        orderCount: ordersRes.count ?? 0,
      });
      if (recentRes.data) setRecentOrders(recentRes.data);
    }
    load();
  }, [user.id]);

  // Tính số ngày tham gia
  const daysSinceJoin = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  const statusLabels: Record<string, { text: string; color: string; bg: string }> = {
    clicked: { text: "Đã bấm", color: "#6b7280", bg: "rgba(107,114,128,0.08)" },
    pending: { text: "Chờ duyệt", color: "#d97706", bg: "rgba(217,119,6,0.08)" },
    approved: { text: "Đã duyệt", color: "#16a34a", bg: "rgba(22,163,74,0.08)" },
    paid: { text: "Đã trả", color: "#2563eb", bg: "rgba(37,99,235,0.08)" },
    rejected: { text: "Từ chối", color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Tổng quan</h1>
        <p className={styles.pageSubtitle}>Chào mừng trở lại, {user.displayName || "bạn"}!</p>
      </div>

      <div className={styles.statsGrid}>
        {/* Card 1: Số ngày tham gia */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div className={styles.statValue}>{daysSinceJoin} ngày</div>
          <div className={styles.statLabel}>Đã tham gia</div>
        </div>

        {/* Card 2: Số đơn hoàn tiền */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div className={styles.statValue}>{stats?.orderCount ?? "—"}</div>
          <div className={styles.statLabel}>Đơn hoàn tiền</div>
        </div>

        {/* Card 3: Tổng đã nhận */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
          <div className={styles.statValue}>{stats ? `${stats.totalEarned.toLocaleString("vi-VN")} xu` : "—"}</div>
          <div className={styles.statLabel}>Tổng đã nhận</div>
        </div>

        {/* Card 4: Số dư */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className={styles.statValue}>{stats ? `${stats.balance.toLocaleString("vi-VN")} xu` : "—"}</div>
          <div className={styles.statLabel}>Số dư hiện tại</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        {[
          {
            label: "Lịch sử",
            desc: "Xem giao dịch",
            href: "/tai-khoan?tab=cashback",
            color: "#6366f1",
            bg: "rgba(99,102,241,0.08)",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            ),
          },
          {
            label: "Hoàn tiền",
            desc: "Nhận cashback",
            href: "/hoan-tien",
            color: "#f97316",
            bg: "rgba(249,115,22,0.08)",
            icon: (
              <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73z"/>
              </svg>
            ),
          },
          {
            label: "Nhập đơn",
            desc: "Hoàn tiền",
            href: "/nhap-don",
            color: "#10b981",
            bg: "rgba(16,185,129,0.08)",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            ),
          },
          {
            label: "Rút tiền",
            desc: "Về tài khoản",
            href: "/tai-khoan?tab=withdrawal",
            color: "#0ea5e9",
            bg: "rgba(14,165,233,0.08)",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <path d="M2 10h20"/>
              </svg>
            ),
          },
          {
            label: "Tạo link",
            desc: "Kiếm hoa hồng",
            href: "/tao-link",
            color: "#a855f7",
            bg: "rgba(168,85,247,0.08)",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            ),
          },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={styles.actionCard}
          >
            <div className={styles.actionIconWrap} style={{ background: item.bg, color: item.color }}>
              {item.icon}
            </div>
            <span className={styles.actionLabel}>{item.label}</span>
            <span className={styles.actionDesc}>{item.desc}</span>
          </Link>
        ))}
      </div>

      {/* ===== Bottom Grid: Recent Orders + Account Info ===== */}
      <div className={styles.overviewBottomGrid}>
        {/* Đơn gần đây */}
        <div className={styles.card} style={{ marginBottom: 0 }}>
          <h3 className={styles.cardTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Đơn gần đây
          </h3>
          {recentOrders.length > 0 ? (
            <div className={styles.recentList}>
              {recentOrders.map((order) => {
                const s = statusLabels[order.status] || { text: order.status, color: "#6b7280", bg: "rgba(107,114,128,0.08)" };
                const date = new Date(order.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
                return (
                  <div key={order.id} className={styles.recentItem}>
                    <div className={styles.recentInfo}>
                      <span className={styles.recentMerchant}>{order.merchant || "Shopee"}</span>
                      <span className={styles.recentDate}>{date}</span>
                    </div>
                    <span className={styles.recentBadge} style={{ color: s.color, background: s.bg }}>
                      {s.text}
                    </span>
                  </div>
                );
              })}
              <Link href="/tai-khoan?tab=cashback" className={styles.recentViewAll}>
                Xem tất cả
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p>Chưa có đơn nào</p>
              <Link href="/hoan-tien" className={styles.emptyLink}>Tạo đơn hoàn tiền</Link>
            </div>
          )}
        </div>

        {/* Thông tin tài khoản */}
        <div className={styles.card} style={{ marginBottom: 0 }}>
          <h3 className={styles.cardTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Thông tin tài khoản
          </h3>
          <div className={styles.accountInfoList}>
            <div className={styles.accountInfoRow}>
              <span className={styles.accountInfoLabel}>Tên hiển thị</span>
              <span className={styles.accountInfoValue}>{user.displayName || "—"}</span>
            </div>
            <div className={styles.accountInfoRow}>
              <span className={styles.accountInfoLabel}>Email</span>
              <span className={styles.accountInfoValue}>{user.email}</span>
            </div>
            <div className={styles.accountInfoRow}>
              <span className={styles.accountInfoLabel}>Đăng nhập</span>
              <span className={styles.accountInfoValue}>{user.provider === "google" ? "Google" : "Email"}</span>
            </div>
            <div className={styles.accountInfoRow}>
              <span className={styles.accountInfoLabel}>Ngày tham gia</span>
              <span className={styles.accountInfoValue}>{joinDate}</span>
            </div>
            {stats && (
              <div className={styles.accountInfoRow}>
                <span className={styles.accountInfoLabel}>Đã rút</span>
                <span className={styles.accountInfoValue}>{stats.totalWithdrawn.toLocaleString("vi-VN")} xu</span>
              </div>
            )}
          </div>
          <Link href="/tai-khoan?tab=profile" className={styles.recentViewAll} style={{ marginTop: 12 }}>
            Chỉnh sửa thông tin
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        </div>
      </div>
    </>
  );
}

/* ===== TAB: PROFILE ===== */
function ProfileTab({
  user, initial, editing, setEditing, name, setName, handleSaveName, loading, joinDate,
}: {
  user: UserInfo; initial: string; editing: boolean; setEditing: (v: boolean) => void;
  name: string; setName: (v: string) => void; handleSaveName: () => void; loading: boolean; joinDate: string;
}) {
  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Thông tin cá nhân</h1>
        <p className={styles.pageSubtitle}>Quản lý thông tin hiển thị của bạn</p>
      </div>

      <div className={styles.profileGrid}>
      <div className={styles.card}>
        <div className={styles.avatarRow}>
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.displayName} className={styles.avatarLarge} width={80} height={80} referrerPolicy="no-referrer" unoptimized />
          ) : (
            <div className={styles.avatarPlaceholder}>{initial}</div>
          )}
          <div className={styles.avatarInfo}>
            <span className={styles.avatarName}>{user.displayName || "Chưa đặt tên"}</span>
            <span className={styles.avatarEmail}>{user.email}</span>
          </div>
        </div>

        <div className={styles.infoList}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Tên hiển thị</span>
            {editing ? (
              <div className={styles.editForm}>
                <input className={styles.editInput} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                <button className={styles.btnPrimary} onClick={handleSaveName} disabled={loading}>Lưu</button>
                <button className={styles.btnSecondary} onClick={() => { setEditing(false); setName(user.displayName); }}>Huỷ</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={styles.infoValue}>{user.displayName || "—"}</span>
                <button className={styles.editTrigger} onClick={() => setEditing(true)}>Sửa</button>
              </div>
            )}
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.infoValue}>{user.email}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Ngày tham gia</span>
            <span className={styles.infoValue}>{joinDate}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Phương thức đăng nhập</span>
            <span className={styles.infoValue}>
              {user.provider === "google" ? "Google" : "Email & Mật khẩu"}
            </span>
          </div>
        </div>
      </div>

      {/* Card: Tài khoản ngân hàng */}
      <BankAccountCard userId={user.id} />
      </div>
    </>
  );
}

/* ===== BANK ACCOUNT CARD ===== */
type BankAccount = {
  id: string;
  bank_name: string;
  bank_short_name: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
};

const BANK_LIST = [
  // === Ví điện tử ===
  { short: "MOMO", name: "MoMo", logo: "https://cdn.vietqr.io/img/momo.png" },
  { short: "VIETTELMONEY", name: "ViettelMoney", logo: "https://cdn.vietqr.io/img/VIETTELMONEY.png" },
  { short: "VNPTMONEY", name: "VNPTMoney", logo: "https://cdn.vietqr.io/img/VNPTMONEY.png" },
  // === Ngân hàng phổ biến ===
  { short: "VCB", name: "Vietcombank", logo: "https://cdn.vietqr.io/img/VCB.png" },
  { short: "TCB", name: "Techcombank", logo: "https://cdn.vietqr.io/img/TCB.png" },
  { short: "MB", name: "MB Bank", logo: "https://cdn.vietqr.io/img/MB.png" },
  { short: "ACB", name: "ACB", logo: "https://cdn.vietqr.io/img/ACB.png" },
  { short: "VPB", name: "VPBank", logo: "https://cdn.vietqr.io/img/VPB.png" },
  { short: "TPB", name: "TPBank", logo: "https://cdn.vietqr.io/img/TPB.png" },
  { short: "BIDV", name: "BIDV", logo: "https://cdn.vietqr.io/img/BIDV.png" },
  { short: "ICB", name: "VietinBank", logo: "https://cdn.vietqr.io/img/ICB.png" },
  { short: "VBA", name: "Agribank", logo: "https://cdn.vietqr.io/img/VBA.png" },
  { short: "SHB", name: "SHB", logo: "https://cdn.vietqr.io/img/SHB.png" },
  { short: "MSB", name: "MSB", logo: "https://cdn.vietqr.io/img/MSB.png" },
  { short: "STB", name: "Sacombank", logo: "https://cdn.vietqr.io/img/STB.png" },
  { short: "HDB", name: "HDBank", logo: "https://cdn.vietqr.io/img/HDB.png" },
  { short: "OCB", name: "OCB", logo: "https://cdn.vietqr.io/img/OCB.png" },
  { short: "LPB", name: "LPBank", logo: "https://cdn.vietqr.io/img/LPB.png" },
  { short: "EIB", name: "Eximbank", logo: "https://cdn.vietqr.io/img/EIB.png" },
  { short: "VIB", name: "VIB", logo: "https://cdn.vietqr.io/img/VIB.png" },
  { short: "SCB", name: "SCB", logo: "https://cdn.vietqr.io/img/SCB.png" },
  // === Ngân hàng khác ===
  { short: "ABB", name: "ABBank", logo: "https://cdn.vietqr.io/img/ABB.png" },
  { short: "BAB", name: "BacABank", logo: "https://cdn.vietqr.io/img/BAB.png" },
  { short: "BVB", name: "BaoVietBank", logo: "https://cdn.vietqr.io/img/BVB.png" },
  { short: "CAKE", name: "CAKE", logo: "https://cdn.vietqr.io/img/CAKE.png" },
  { short: "CBB", name: "CBBank", logo: "https://cdn.vietqr.io/img/CBB.png" },
  { short: "CIMB", name: "CIMB Bank", logo: "https://cdn.vietqr.io/img/CIMB.png" },
  { short: "COOPBANK", name: "Co-opBank", logo: "https://cdn.vietqr.io/img/COOPBANK.png" },
  { short: "GPB", name: "GPBank", logo: "https://cdn.vietqr.io/img/GPB.png" },
  { short: "IVB", name: "IndovinaBank", logo: "https://cdn.vietqr.io/img/IVB.png" },
  { short: "KLB", name: "KienLongBank", logo: "https://cdn.vietqr.io/img/KLB.png" },
  { short: "KBank", name: "KBank", logo: "https://cdn.vietqr.io/img/KBANK.png" },
  { short: "NAB", name: "NamABank", logo: "https://cdn.vietqr.io/img/NAB.png" },
  { short: "NCB", name: "NCB", logo: "https://cdn.vietqr.io/img/NCB.png" },
  { short: "PVCB", name: "PVcomBank", logo: "https://cdn.vietqr.io/img/PVCB.png" },
  { short: "PGB", name: "PGBank", logo: "https://cdn.vietqr.io/img/PGB.png" },
  { short: "Ubank", name: "Ubank", logo: "https://cdn.vietqr.io/img/UBANK.png" },
  { short: "SCVN", name: "Standard Chartered", logo: "https://cdn.vietqr.io/img/SCVN.png" },
  { short: "SEAB", name: "SeABank", logo: "https://cdn.vietqr.io/img/SEAB.png" },
  { short: "SGICB", name: "SaigonBank", logo: "https://cdn.vietqr.io/img/SGICB.png" },
  { short: "SHBVN", name: "Shinhan Bank", logo: "https://cdn.vietqr.io/img/SHBVN.png" },
  { short: "VCCB", name: "VietCapitalBank", logo: "https://cdn.vietqr.io/img/VCCB.png" },
  { short: "VAB", name: "VietABank", logo: "https://cdn.vietqr.io/img/VAB.png" },
  { short: "VIETBANK", name: "VietBank", logo: "https://cdn.vietqr.io/img/VIETBANK.png" },
  { short: "VRB", name: "VRB", logo: "https://cdn.vietqr.io/img/VRB.png" },
  { short: "WVN", name: "Woori Bank", logo: "https://cdn.vietqr.io/img/WVN.png" },
  { short: "TIMO", name: "Timo", logo: "https://vietqr.net/portal-service/resources/icons/TIMO.png" },
];

function BankAccountCard({ userId }: { userId: string }) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [bankShort, setBankShort] = useState("VCB");
  const [accNumber, setAccNumber] = useState("");
  const [accName, setAccName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [searchBank, setSearchBank] = useState("");
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(e.target as Node)) {
        setShowBankDropdown(false);
      }
    }
    if (showBankDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showBankDropdown]);

  const filteredBanks = searchBank.trim()
    ? BANK_LIST.filter(b => b.name.toLowerCase().includes(searchBank.toLowerCase()) || b.short.toLowerCase().includes(searchBank.toLowerCase()))
    : BANK_LIST;

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("user_bank_accounts")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false });
    setAccounts(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  function resetForm() {
    setShowForm(false);
    setEditId(null);
    setBankShort("VCB");
    setAccNumber("");
    setAccName("");
    setMsg("");
  }

  function startEdit(acc: BankAccount) {
    setEditId(acc.id);
    setBankShort(acc.bank_short_name);
    setAccNumber(acc.account_number);
    setAccName(acc.account_name);
    setShowForm(true);
  }

  async function handleSave() {
    if (!accNumber.trim() || !accName.trim()) {
      setMsg("Vui lòng điền đủ thông tin");
      return;
    }

    setSaving(true);
    setMsg("");
    const supabase = createClient();
    const bankInfo = BANK_LIST.find((b) => b.short === bankShort);

    if (editId) {
      // Update
      const { error } = await supabase
        .from("user_bank_accounts")
        .update({
          bank_name: bankInfo?.name ?? bankShort,
          bank_short_name: bankShort,
          account_number: accNumber.trim(),
          account_name: accName.trim().toUpperCase(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", editId);
      if (error) setMsg("Lỗi: " + error.message);
      else { resetForm(); loadAccounts(); }
    } else {
      // Insert — nếu là tài khoản đầu tiên → set default
      const isFirst = accounts.length === 0;
      const { error } = await supabase
        .from("user_bank_accounts")
        .insert({
          user_id: userId,
          bank_name: bankInfo?.name ?? bankShort,
          bank_short_name: bankShort,
          account_number: accNumber.trim(),
          account_name: accName.trim().toUpperCase(),
          is_default: isFirst,
        });
      if (error) setMsg("Lỗi: " + error.message);
      else { resetForm(); loadAccounts(); }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn chắc chắn muốn xóa tài khoản này?")) return;
    const supabase = createClient();
    await supabase.from("user_bank_accounts").delete().eq("id", id);
    loadAccounts();
  }

  async function handleSetDefault(id: string) {
    const supabase = createClient();
    // Bỏ default cũ
    await supabase
      .from("user_bank_accounts")
      .update({ is_default: false })
      .eq("user_id", userId);
    // Set default mới
    await supabase
      .from("user_bank_accounts")
      .update({ is_default: true })
      .eq("id", id);
    loadAccounts();
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <path d="M2 10h20"/>
        </svg>
        Tài khoản ngân hàng
      </h3>

      {loading ? (
        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: 0 }}>Đang tải...</p>
      ) : (
        <>
          {/* Danh sách tài khoản */}
          {accounts.length > 0 && (
            <div className={styles.infoList}>
              {accounts.map((acc) => (
                <div key={acc.id} className={styles.infoRow} style={{ flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 0, alignItems: "center" }}>
                    {(() => {
                      const bankInfo = BANK_LIST.find(b => b.short === acc.bank_short_name);
                      return bankInfo ? (
                        <Image src={bankInfo.logo} alt={bankInfo.name} width={28} height={28} style={{ objectFit: "contain", borderRadius: 4, flexShrink: 0 }} unoptimized />
                      ) : null;
                    })()}
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <span className={styles.infoValue} style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}>
                        <strong>{acc.bank_name}</strong>
                        {acc.is_default && (
                          <span className={styles.badge} style={{ fontSize: "0.65rem", padding: "1px 6px" }}>Mặc định</span>
                        )}
                      </span>
                    <span style={{ fontSize: "0.82rem", color: "var(--text)", fontFamily: "monospace", letterSpacing: "0.05em" }}>
                      {acc.account_number}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      {acc.account_name}
                    </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    {!acc.is_default && (
                      <button className={styles.editTrigger} onClick={() => handleSetDefault(acc.id)} style={{ fontSize: "0.72rem" }}>
                        Đặt mặc định
                      </button>
                    )}
                    <button className={styles.editTrigger} onClick={() => startEdit(acc)}>Sửa</button>
                    <button className={styles.editTrigger} onClick={() => handleDelete(acc.id)} style={{ color: "#dc2626" }}>Xóa</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form thêm/sửa */}
          {showForm ? (
            <div className={styles.passwordForm} style={{ marginTop: accounts.length > 0 ? 16 : 0 }}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Ngân hàng</label>
                <div ref={bankDropdownRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    className={styles.editInput}
                    onClick={() => { setShowBankDropdown(!showBankDropdown); setSearchBank(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left", background: "var(--surface)" }}
                  >
                    {(() => {
                      const sel = BANK_LIST.find(b => b.short === bankShort);
                      return sel ? (
                        <>
                          <Image src={sel.logo} alt={sel.name} width={24} height={24} style={{ objectFit: "contain", borderRadius: 4, flexShrink: 0 }} unoptimized />
                          <span style={{ flex: 1 }}>{sel.name}</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </>
                      ) : "Chọn ngân hàng";
                    })()}
                  </button>

                  {showBankDropdown && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                      background: "var(--surface)", border: "1.5px solid var(--line)",
                      borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                      zIndex: 50, maxHeight: 280, display: "flex", flexDirection: "column"
                    }}>
                      <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>
                        <input
                          className={styles.editInput}
                          placeholder="Tìm ngân hàng..."
                          value={searchBank}
                          onChange={e => setSearchBank(e.target.value)}
                          autoFocus
                          style={{ width: "100%", fontSize: "0.82rem", padding: "7px 10px" }}
                        />
                      </div>
                      <div style={{ overflowY: "auto", flex: 1 }}>
                        {filteredBanks.map(b => (
                          <button
                            key={b.short}
                            type="button"
                            onClick={() => { setBankShort(b.short); setShowBankDropdown(false); }}
                            style={{
                              display: "flex", alignItems: "center", gap: 10, width: "100%",
                              padding: "9px 12px", border: "none", background: bankShort === b.short ? "var(--brand-soft, rgba(238,77,45,0.06))" : "transparent",
                              cursor: "pointer", textAlign: "left", fontSize: "0.85rem",
                              color: bankShort === b.short ? "var(--brand)" : "var(--text)",
                              fontWeight: bankShort === b.short ? 700 : 500,
                              transition: "background 120ms ease",
                            }}
                            onMouseEnter={e => { if (bankShort !== b.short) (e.target as HTMLElement).style.background = "rgba(0,0,0,0.03)"; }}
                            onMouseLeave={e => { if (bankShort !== b.short) (e.target as HTMLElement).style.background = "transparent"; }}
                          >
                            <Image src={b.logo} alt={b.name} width={24} height={24} style={{ objectFit: "contain", borderRadius: 4, flexShrink: 0 }} unoptimized />
                            <span>{b.name}</span>
                          </button>
                        ))}
                        {filteredBanks.length === 0 && (
                          <p style={{ padding: "12px", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.82rem" }}>Không tìm thấy</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Số tài khoản</label>
                <input
                  className={styles.editInput}
                  type="text"
                  placeholder="VD: 0123456789"
                  value={accNumber}
                  onChange={(e) => setAccNumber(e.target.value)}
                />
              </div>
              <div className={`${styles.fieldGroup} ${styles.span2}`}>
                <label className={styles.fieldLabel}>Tên chủ tài khoản</label>
                <input
                  className={styles.editInput}
                  type="text"
                  placeholder="VD: NGUYEN VAN A"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  style={{ textTransform: "uppercase" }}
                />
              </div>

              {msg && (
                <p className={styles.span2} style={{ color: "#dc2626", fontSize: "0.82rem", margin: 0 }}>{msg}</p>
              )}

              <div className={`${styles.formActions} ${styles.span2}`}>
                <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                  {saving ? "Đang lưu..." : editId ? "Cập nhật" : "Thêm tài khoản"}
                </button>
                <button className={styles.btnSecondary} onClick={resetForm}>Huỷ</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "20px 0" }}>
              <button
                className={styles.btnPrimary}
                onClick={() => { resetForm(); setShowForm(true); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Thêm tài khoản ngân hàng
              </button>
              {accounts.length === 0 && (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", margin: 0, textAlign: "center" }}>
                  Thêm tài khoản ngân hàng để rút tiền cashback nhanh hơn
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ===== TAB: SECURITY ===== */
function SecurityTab({
  isEmailUser, showPasswordForm, setShowPasswordForm,
  newPassword, setNewPassword, confirmNewPassword, setConfirmNewPassword,
  handleChangePassword, loading, provider,
}: {
  isEmailUser: boolean;
  showPasswordForm: boolean; setShowPasswordForm: (v: boolean) => void;
  newPassword: string; setNewPassword: (v: string) => void;
  confirmNewPassword: string; setConfirmNewPassword: (v: string) => void;
  handleChangePassword: () => void; loading: boolean; provider: string;
}) {
  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Bảo mật</h1>
        <p className={styles.pageSubtitle}>Quản lý mật khẩu và bảo mật tài khoản</p>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Mật khẩu
        </h3>

        {isEmailUser ? (
          <>
            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Mật khẩu hiện tại</span>
                {!showPasswordForm ? (
                  <button className={styles.editTrigger} onClick={() => setShowPasswordForm(true)}>
                    Đổi mật khẩu
                  </button>
                ) : (
                  <span className={styles.infoValue}>Đang thay đổi...</span>
                )}
              </div>
            </div>

            {showPasswordForm && (
              <div className={styles.passwordForm}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Mật khẩu mới</label>
                  <input
                    className={styles.editInput}
                    type="password"
                    placeholder="Ít nhất 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Xác nhận mật khẩu mới</label>
                  <input
                    className={styles.editInput}
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </div>

                <div className={`${styles.formActions} ${styles.span2}`}>
                  <button className={styles.btnPrimary} onClick={handleChangePassword} disabled={loading}>
                    {loading ? "Đang lưu..." : "Cập nhật mật khẩu"}
                  </button>
                  <button
                    className={styles.btnSecondary}
                    onClick={() => {
                      setShowPasswordForm(false);
                      setNewPassword("");
                      setConfirmNewPassword("");
                    }}
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: 0 }}>
            Bạn đăng nhập bằng <strong>Google</strong>. Mật khẩu được quản lý bởi Google.
          </p>
        )}
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m8.66-13.5l-5.2 3m-6.92 4l-5.2 3M1.34 4.5l5.2 3m6.92 4l5.2 3"/>
          </svg>
          Phiên đăng nhập
        </h3>

        <div className={styles.infoList}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Phương thức</span>
            <span className={styles.infoValue}>
              {provider === "google" ? "Google OAuth" : "Email & Mật khẩu"}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Trạng thái</span>
            <span className={styles.badge}>🟢 Đang hoạt động</span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ===== TAB: CASHBACK ===== */
type CashbackOrder = {
  id: string;
  merchant: string;
  product_url: string;
  affiliate_url: string;
  cashback_rate: number;
  status: string;
  created_at: string;
};

function CashbackTab({ userId }: { userId: string }) {
  const [wallet, setWallet] = useState<{ balance: number; total_earned: number; total_withdrawn: number } | null>(null);
  const [orders, setOrders] = useState<CashbackOrder[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [walletRes, ordersRes] = await Promise.all([
        supabase.from("cashback_wallets").select("*").eq("user_id", userId).single(),
        supabase.from("cashback_orders").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      ]);
      if (walletRes.data) setWallet(walletRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      setLoadingData(false);
    }
    load();
  }, [userId]);

  const statusLabels: Record<string, { text: string; color: string }> = {
    clicked: { text: "Đã bấm", color: "#6b7280" },
    pending: { text: "Chờ duyệt", color: "#d97706" },
    approved: { text: "Đã duyệt", color: "#16a34a" },
    paid: { text: "Đã trả", color: "#2563eb" },
    rejected: { text: "Từ chối", color: "#dc2626" },
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Hoàn tiền</h1>
        <p className={styles.pageSubtitle}>Theo dõi số dư và lịch sử hoàn tiền mua sắm</p>
      </div>

      {loadingData ? (
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Đang tải...</p>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div className={styles.statValue}>{wallet?.balance ?? 0} đ</div>
              <div className={styles.statLabel}>Số dư hiện tại</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
              <div className={styles.statValue}>{wallet?.total_earned ?? 0} đ</div>
              <div className={styles.statLabel}>Tổng đã nhận</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <div className={styles.statValue}>{orders.length}</div>
              <div className={styles.statLabel}>Tổng đơn hàng</div>
            </div>
          </div>

          <div className={styles.card} style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 12px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Dán link sản phẩm để nhận hoàn tiền</p>
            <Link
              href="/hoan-tien"
              style={{
                display: "inline-block", padding: "10px 24px", borderRadius: 10,
                background: "var(--brand)", color: "#fff", fontWeight: 700,
                textDecoration: "none", fontSize: "0.9rem",
              }}
            >
              Đi tới trang Hoàn tiền →
            </Link>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Lịch sử đơn hàng
            </h3>

            {orders.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: 0 }}>
                Chưa có đơn hàng nào. Hãy <Link href="/hoan-tien" style={{ color: "var(--brand)", fontWeight: 700 }}>dán link sản phẩm</Link> để bắt đầu!
              </p>
            ) : (
              <div className={styles.infoList}>
                {orders.map((o) => {
                  const s = statusLabels[o.status] || statusLabels.clicked;
                  const date = new Date(o.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
                  return (
                    <div key={o.id} className={styles.infoRow}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span className={styles.infoValue} style={{ fontSize: "0.82rem" }}>
                          {o.merchant.charAt(0).toUpperCase() + o.merchant.slice(1)} — {date}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          Link: <a href={o.affiliate_url || o.product_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)", textDecoration: "none" }}>{(() => { const url = o.affiliate_url || o.product_url; if (!url) return "Không rõ"; try { const u = new URL(url); return u.hostname + (u.pathname.length > 25 ? u.pathname.slice(0, 25) + "…" : u.pathname); } catch { return url.slice(0, 40) + "…"; } })()}</a>
                        </span>
                      </div>
                      <span className={styles.badge} style={{ background: s.color + "15", color: s.color }}>
                        {s.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

/* ===== TAB: WITHDRAWAL ===== */
type WithdrawalBankAccount = {
  id: string;
  bank_name: string;
  bank_short_name: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
};

type WithdrawalRecord = {
  id: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  account_name: string;
  status: "pending" | "approved" | "paid" | "rejected";
  admin_note?: string;
  created_at: string;
};

type WalletData = {
  balance: number;
  total_earned: number;
  total_withdrawn: number;
};

const QUICK_AMOUNTS = [20000, 50000, 100000, 200000, 500000];

const W_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: "Chờ duyệt", cls: wStyles.statusPending },
  approved: { label: "Đã duyệt", cls: wStyles.statusApproved },
  paid: { label: "Đã thanh toán", cls: wStyles.statusPaid },
  rejected: { label: "Từ chối", cls: wStyles.statusRejected },
};

function WithdrawalTab() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [bankAccounts, setBankAccounts] = useState<WithdrawalBankAccount[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [amount, setAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState<WithdrawalBankAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch("/api/cashback/withdraw");
      const data = await res.json();
      setWallet(data.wallet);
      setWithdrawals(data.withdrawals ?? []);

      const { data: accounts } = await supabase
        .from("user_bank_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      setBankAccounts(accounts ?? []);
      const def = (accounts ?? []).find((a: WithdrawalBankAccount) => a.is_default);
      if (def) setSelectedBank(def);
    } catch (e) {
      console.error(e);
    }
    setLoadingData(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const formatMoney = (n: number) => n.toLocaleString("vi-VN") + "đ";
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  if (loadingData) {
    return (
      <>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Đang tải...</h1>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Hero title */}
      <div className={wStyles.hero} style={{ padding: "24px 0 20px" }}>
        <div className={wStyles.heroInner}>
          <h1 className={wStyles.heroTitle}>
            <span className={wStyles.heroHighlight}>Rút tiền</span> về tài khoản
          </h1>
          <p className={wStyles.heroSubtitle}>
            Rút cashback về ngân hàng hoặc ví điện tử — xử lý trong 24h
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Wallet Summary */}
        <div className={wStyles.walletGrid}>
          <div className={wStyles.walletCard}>
            <div>
              <div className={`${wStyles.walletValue} ${wStyles.walletHighlight}`}>
                {formatMoney(wallet?.balance ?? 0)}
              </div>
              <div className={wStyles.walletLabel}>Số dư khả dụng</div>
            </div>
          </div>
          <div className={wStyles.walletCard}>
            <div>
              <div className={wStyles.walletValue}>
                {formatMoney(wallet?.total_earned ?? 0)}
              </div>
              <div className={wStyles.walletLabel}>Tổng đã nhận</div>
            </div>
          </div>
          <div className={wStyles.walletCard}>
            <div>
              <div className={wStyles.walletValue}>
                {formatMoney(wallet?.total_withdrawn ?? 0)}
              </div>
              <div className={wStyles.walletLabel}>Tổng đã rút</div>
            </div>
          </div>
        </div>

        {/* Withdraw Form */}
        <div className={wStyles.card}>
          <h3 className={wStyles.cardTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <path d="M2 10h20"/>
            </svg>
            Tạo yêu cầu rút tiền
          </h3>

          {error && <div className={wStyles.errorMsg}>{error}</div>}
          {success && <div className={wStyles.successMsg}>{success}</div>}

          {/* Amount */}
          <div className={wStyles.fieldGroup}>
            <label className={wStyles.fieldLabel}>Số tiền muốn rút (tối thiểu 10.000đ)</label>
            <input
              type="number"
              className={`${wStyles.fieldInput} ${wStyles.amountInput}`}
              placeholder="0"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              min={10000}
            />
            <div className={wStyles.quickAmounts}>
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  className={`${wStyles.quickAmountBtn} ${Number(amount) === q ? wStyles.quickAmountBtnActive : ""}`}
                  onClick={() => setAmount(String(q))}
                  type="button"
                >
                  {q >= 1000 ? `${q / 1000}K` : q}
                </button>
              ))}
              {wallet && wallet.balance >= 10000 && (
                <button
                  className={`${wStyles.quickAmountBtn} ${Number(amount) === wallet.balance ? wStyles.quickAmountBtnActive : ""}`}
                  onClick={() => setAmount(String(wallet.balance))}
                  type="button"
                >
                  Tất cả
                </button>
              )}
            </div>
          </div>

          {/* Bank Account */}
          <div className={wStyles.fieldGroup}>
            <label className={wStyles.fieldLabel}>Tài khoản nhận tiền</label>
            {bankAccounts.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {bankAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    className={wStyles.bankSelector}
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
                            fontSize: "0.6rem", padding: "1px 5px", borderRadius: 4,
                            background: "rgba(14,165,233,0.1)", color: "#0ea5e9",
                            marginLeft: 6, fontWeight: 700,
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
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "10px 14px", border: "1.5px dashed rgba(0,0,0,0.12)",
                    borderRadius: 10, background: "transparent", color: "var(--text-secondary)",
                    fontSize: "0.82rem", fontWeight: 500, textDecoration: "none",
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
                <Link href="/tai-khoan?tab=profile" style={{ color: "#0ea5e9", fontWeight: 600 }}>Thêm ngay →</Link>
              </div>
            )}
          </div>

          <button
            className={wStyles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting || !amount || !selectedBank}
          >
            {submitting ? "Đang gửi..." : "Gửi yêu cầu rút tiền"}
          </button>
        </div>

        {/* Withdrawal History */}
        <div className={wStyles.card}>
          <h3 className={wStyles.cardTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Lịch sử rút tiền
          </h3>

          {withdrawals.length === 0 ? (
            <div className={wStyles.emptyState}>
              <div className={wStyles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <path d="M2 10h20"/>
                </svg>
              </div>
              <div className={wStyles.emptyText}>Chưa có yêu cầu rút tiền nào</div>
            </div>
          ) : (
            <div className={wStyles.historyList}>
              {withdrawals.map((w) => {
                const st = W_STATUS_MAP[w.status] ?? W_STATUS_MAP.pending;
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
                  <div key={w.id} className={wStyles.historyRow}>
                    <div className={wStyles.historyIcon} style={{ background: iconBg, color: iconColor }}>
                      {w.status === "paid" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : w.status === "rejected" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      )}
                    </div>
                    <div className={wStyles.historyInfo}>
                      <div className={wStyles.historyAmount}>-{formatMoney(w.amount)}</div>
                      <div className={wStyles.historyBank}>{w.bank_name} • {w.account_name}</div>
                    </div>
                    <div>
                      <span className={`${wStyles.historyStatus} ${st.cls}`}>{st.label}</span>
                      <div className={wStyles.historyDate}>{formatDate(w.created_at)}</div>
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
    </>
  );
}
