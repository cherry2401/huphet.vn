/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "../admin.module.css";

type User = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  phone: string;
  role: string;
  provider: string;
  email_confirmed: boolean;
  banned: boolean;
  banned_until: string | null;
  last_sign_in: string | null;
  created_at: string;
  wallet_balance: number;
  wallet_earned: number;
  wallet_withdrawn: number;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(n: number) {
  return n.toLocaleString("vi-VN") + " đ";
}

export function AdminUsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchUsers = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setUsers(data.users ?? []);
      }
    } catch {
      setError("Không thể tải danh sách users");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setUsers(data.users ?? []);
        }
      } catch {
        if (!cancelled) setError("Không thể tải danh sách users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAction = async (
    userId: string,
    action: string,
    data?: any
  ) => {
    setActionMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, data }),
      });
      const result = await res.json();
      if (result.ok) {
        setActionMsg(`✅ ${result.message}`);
        fetchUsers();
        setShowModal(false);
        setSelectedUser(null);
      } else {
        setActionMsg(`❌ ${result.error}`);
      }
    } catch {
      setActionMsg("❌ Lỗi kết nối");
    }
  };

  const handleDelete = async (userId: string) => {
    setActionMsg("");
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.ok) {
        setActionMsg(`✅ ${result.message}`);
        setConfirmDelete(null);
        fetchUsers();
      } else {
        setActionMsg(`❌ ${result.error}`);
      }
    } catch {
      setActionMsg("❌ Lỗi kết nối");
    }
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search)
  );

  const totalActive = users.filter((u) => !u.banned).length;
  const totalBanned = users.filter((u) => u.banned).length;
  const totalBalance = users.reduce((s, u) => s + u.wallet_balance, 0);

  return (
    <>
      {/* ═══ Hero Banner ═══ */}
      <div className={styles.heroBanner}>
        <p className={styles.eyebrow}>Quản lý</p>
        <h1 className={styles.heroTitle}>Người dùng</h1>
        <p className={styles.heroSub}>
          Quản lý tài khoản, ban/unban, xem ví cashback, sửa thông tin.
        </p>
      </div>

      {/* Stats */}
      <section className={styles.grid}>
        <article className={`${styles.statCard} ${styles.statCardInfo}`}>
          <p className={styles.statLabel}>Tổng Users</p>
          <p className={styles.statValue}>{users.length}</p>
          <p className={styles.statMeta}>Tài khoản đã đăng ký</p>
        </article>
        <article className={`${styles.statCard} ${styles.statCardSuccess}`}>
          <p className={styles.statLabel}>Active</p>
          <p className={styles.statValue}>{totalActive}</p>
          <p className={styles.statMeta}>Đang hoạt động</p>
        </article>
        <article className={`${styles.statCard} ${styles.statCardDanger}`}>
          <p className={styles.statLabel}>Banned</p>
          <p className={styles.statValue}>{totalBanned}</p>
          <p className={styles.statMeta}>Đã bị cấm</p>
        </article>
        <article className={`${styles.statCard} ${styles.statCardWarning}`}>
          <p className={styles.statLabel}>Tổng ví</p>
          <p className={styles.statValue}>{formatMoney(totalBalance)}</p>
          <p className={styles.statMeta}>Số dư cashback tất cả users</p>
        </article>
      </section>

      {/* Action bar */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlsHeader}>
          <span className={styles.controlsTitle}>Tìm kiếm</span>
        </div>
        <div className={styles.testInputRow}>
          <input
            type="text"
            placeholder="Tìm theo email, tên, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.testInput}
            style={{ maxWidth: 360 }}
          />
          <button onClick={() => fetchUsers()} className={styles.btnPrimary}>
            Refresh
          </button>
        </div>
      </div>

      {actionMsg && (
        <div
          style={{
            padding: "10px 16px",
            margin: "12px 0",
            borderRadius: 8,
            background: actionMsg.startsWith("✅")
              ? "rgba(69, 203, 133, 0.1)"
              : "rgba(247, 108, 108, 0.1)",
            color: actionMsg.startsWith("✅") ? "#0ab39c" : "#f06548",
            fontSize: "0.85rem",
            fontWeight: 500,
          }}
        >
          {actionMsg}
        </div>
      )}

      {/* Users Table */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Danh sách ({filtered.length})</h2>
        </div>

        {loading ? (
          <p style={{ padding: 24, textAlign: "center", color: "#878a99" }}>
            Đang tải...
          </p>
        ) : error ? (
          <p
            style={{
              padding: 24,
              textAlign: "center",
              color: "#f06548",
            }}
          >
            ❌ {error}
          </p>
        ) : (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Provider</th>
                  <th>Trạng thái</th>
                  <th>Ví cashback</th>
                  <th>Đăng nhập gần nhất</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: 32, color: "#878a99" }}>
                      Không tìm thấy user nào
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {u.avatar_url ? (
                            <Image
                              src={u.avatar_url}
                              alt=""
                              width={32}
                              height={32}
                              style={{
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                              unoptimized
                            />
                          ) : (
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: "var(--info-soft)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                color: "var(--info)",
                              }}
                            >
                              {(u.display_name || u.email)[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                              {u.display_name || "—"}
                            </div>
                            {u.phone && (
                              <div style={{ fontSize: "0.72rem", color: "#878a99" }}>
                                {u.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <code style={{ fontSize: "0.78rem" }}>{u.email}</code>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            background:
                              u.provider === "google"
                                ? "rgba(66, 133, 244, 0.1)"
                                : "rgba(135, 138, 153, 0.1)",
                            color:
                              u.provider === "google" ? "#4285f4" : "#878a99",
                          }}
                        >
                          {u.provider}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            u.banned ? styles.chipFail : styles.chipOk
                          }
                        >
                          {u.banned ? "🚫 Banned" : "● Active"}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.82rem" }}>
                          <strong>{formatMoney(u.wallet_balance)}</strong>
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#878a99" }}>
                          Earned: {formatMoney(u.wallet_earned)}
                        </div>
                      </td>
                      <td style={{ fontSize: "0.8rem" }}>
                        {formatDate(u.last_sign_in)}
                      </td>
                      <td style={{ fontSize: "0.8rem" }}>
                        {formatDate(u.created_at)}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowModal(true);
                            }}
                            style={{
                              padding: "4px 10px",
                              background: "var(--info-soft)",
                              color: "var(--info)",
                              border: "none",
                              borderRadius: 4,
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Sửa
                          </button>
                          {u.banned ? (
                            <button
                              onClick={() => handleAction(u.id, "unban")}
                              style={{
                                padding: "4px 10px",
                                background: "rgba(69, 203, 133, 0.1)",
                                color: "#0ab39c",
                                border: "none",
                                borderRadius: 4,
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              ✅ Unban
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction(u.id, "ban")}
                              style={{
                                padding: "4px 10px",
                                background: "rgba(247, 168, 0, 0.1)",
                                color: "#f7a800",
                                border: "none",
                                borderRadius: 4,
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              🚫 Ban
                            </button>
                          )}
                          {confirmDelete === u.id ? (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button
                                onClick={() => handleDelete(u.id)}
                                style={{
                                  padding: "4px 10px",
                                  background: "#f06548",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: 4,
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                Xác nhận xóa
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                style={{
                                  padding: "4px 10px",
                                  background: "#eee",
                                  color: "#666",
                                  border: "none",
                                  borderRadius: 4,
                                  fontSize: "0.72rem",
                                  cursor: "pointer",
                                }}
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(u.id)}
                              style={{
                                padding: "4px 10px",
                                background: "rgba(240, 101, 72, 0.1)",
                                color: "#f06548",
                                border: "none",
                                borderRadius: 4,
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit Modal */}
      {showModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
          onSave={(action, data) =>
            handleAction(selectedUser.id, action, data)
          }
        />
      )}
    </>
  );
}

// ── Edit Modal ──
function EditUserModal({
  user,
  onClose,
  onSave,
}: {
  user: User;
  onClose: () => void;
  onSave: (action: string, data: any) => void;
}) {
  const [name, setName] = useState(user.display_name);
  const [phone, setPhone] = useState(user.phone);
  const [balance, setBalance] = useState(String(user.wallet_balance));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 28,
          width: 440,
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 4, fontSize: "1.1rem" }}>
          Chỉnh sửa User
        </h3>
        <p style={{ fontSize: "0.8rem", color: "#878a99", marginBottom: 20 }}>
          {user.email}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>
            Tên hiển thị
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #e0e3eb",
                borderRadius: 6,
                fontSize: "0.85rem",
                marginTop: 4,
              }}
            />
          </label>

          <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>
            Số điện thoại
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #e0e3eb",
                borderRadius: 6,
                fontSize: "0.85rem",
                marginTop: 4,
              }}
            />
          </label>

          <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>
            Số dư ví (đ)
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #e0e3eb",
                borderRadius: 6,
                fontSize: "0.85rem",
                marginTop: 4,
              }}
            />
          </label>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 24,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 18px",
              background: "#f3f6f9",
              color: "#495057",
              border: "none",
              borderRadius: 6,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            Hủy
          </button>
          <button
            onClick={() => {
              // Save profile
              if (name !== user.display_name || phone !== user.phone) {
                onSave("update_profile", {
                  display_name: name,
                  phone,
                });
              }
              // Save wallet
              if (Number(balance) !== user.wallet_balance) {
                onSave("update_wallet", { balance: Number(balance) });
              }
              // If nothing changed
              if (
                name === user.display_name &&
                phone === user.phone &&
                Number(balance) === user.wallet_balance
              ) {
                onClose();
              }
            }}
            style={{
              padding: "8px 18px",
              background: "var(--info)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            💾 Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
