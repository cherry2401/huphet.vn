"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/(auth)/auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/tai-khoan`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Đã gửi link đặt lại mật khẩu! Kiểm tra hộp thư email của bạn.");
    }
    setLoading(false);
  }

  return (
    <div className={styles.card}>
      <div className={styles.logoBlock}>
        <span className={styles.logoIcon}>🔥</span>
        <span className={styles.logoText}>Húp Hết</span>
      </div>

      <h1 className={styles.title}>Quên mật khẩu</h1>
      <p className={styles.subtitle}>Nhập email để nhận link đặt lại mật khẩu</p>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form className={styles.form} onSubmit={handleReset}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="email">Email</label>
          <input
            id="email"
            className={styles.input}
            type="email"
            placeholder="name@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <button className={styles.submitBtn} type="submit" disabled={loading}>
          {loading ? "Đang gửi..." : "Gửi link đặt lại"}
        </button>
      </form>

      <p className={styles.footer}>
        Nhớ mật khẩu rồi? <Link href="/login">Đăng nhập</Link>
      </p>
    </div>
  );
}
