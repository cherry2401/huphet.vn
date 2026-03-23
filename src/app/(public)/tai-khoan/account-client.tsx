"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./account.module.css";

type UserInfo = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  createdAt: string;
  provider: string;
};

export default function AccountClient({ user }: { user: UserInfo }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.displayName);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const initial = (user.displayName || user.email || "U").charAt(0).toUpperCase();

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

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

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

  const isEmailUser = user.provider !== "google";

  return (
    <div className={styles.container}>
      {/* Profile Card */}
      <div className={styles.profileCard}>
        {message && (
          <div className={messageType === "error" ? styles.errorMsg : styles.message}>
            {message}
          </div>
        )}

        <div className={styles.avatarSection}>
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName}
              className={styles.avatar}
              width={80}
              height={80}
              referrerPolicy="no-referrer"
              unoptimized
            />
          ) : (
            <div className={styles.avatarPlaceholder}>{initial}</div>
          )}
          <span className={styles.userName}>
            {user.displayName || "Chưa đặt tên"}
          </span>
          <span className={styles.userEmail}>{user.email}</span>
          <span className={styles.badge}>
            {user.provider === "google" ? "🔗 Google" : "📧 Email"}
          </span>
        </div>

        {/* Info Section */}
        <div className={styles.sectionHeader}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Thông tin cá nhân
        </div>

        <div className={styles.infoList}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Tên hiển thị</span>
            {editing ? (
              <div className={styles.editForm}>
                <input
                  className={styles.editInput}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                <button className={styles.editBtn} onClick={handleSaveName} disabled={loading}>
                  Lưu
                </button>
                <button className={styles.cancelBtn} onClick={() => { setEditing(false); setName(user.displayName); }}>
                  Huỷ
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={styles.infoValue}>{user.displayName || "—"}</span>
                <button className={styles.infoEditTrigger} onClick={() => setEditing(true)}>Sửa</button>
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
            <span className={styles.infoLabel}>Phương thức</span>
            <span className={styles.infoValue}>
              {user.provider === "google" ? "Google" : "Email & Mật khẩu"}
            </span>
          </div>
        </div>
      </div>

      {/* Security Card — only for email users */}
      {isEmailUser && (
        <div className={styles.profileCard}>
          <div className={styles.sectionHeader}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Bảo mật
          </div>

          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Mật khẩu</span>
              {!showPasswordForm ? (
                <button
                  className={styles.infoEditTrigger}
                  onClick={() => setShowPasswordForm(true)}
                >
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
                  minLength={6}
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
                  minLength={6}
                />
              </div>

              <div className={styles.passwordActions}>
                <button
                  className={styles.editBtn}
                  onClick={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? "Đang lưu..." : "Cập nhật mật khẩu"}
                </button>
                <button
                  className={styles.cancelBtn}
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
        </div>
      )}

      {/* Logout */}
      <button className={styles.logoutBtn} onClick={handleLogout}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Đăng xuất
      </button>
    </div>
  );
}
