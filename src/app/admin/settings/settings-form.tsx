"use client";

import { useState } from "react";
import styles from "@/app/admin/admin.module.css";

export type SettingsData = {
  AFFILIATE_ID: string;
  AFFILIATE_SUB_ID1: string;
  AFFILIATE_CUSTOM_LINK_API_URL: string;
  TIENVE_FLASH_DEALS_API_URL: string;
  TIENVE_CACHE_PAGE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_CACHE_TABLE: string;
  ACCESSTRADE_TOKEN: string;
};

export default function SettingsForm({ initialData }: { initialData: SettingsData }) {
  const [formData, setFormData] = useState<SettingsData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("Đang lưu cài đặt...");
    setError("");
    
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu cài đặt");

      setMessage("Lưu thành công! Hệ thống đang tự động khởi động lại (1-2s)...");
      
      // Reload page after a short delay to get the new env values on the server
      setTimeout(() => {
        window.location.reload();
      }, 3500);
    } catch (err: any) {
      setError(err.message);
      setMessage("");
      setIsSaving(false);
    }
  };

  const renderInput = (label: string, name: keyof SettingsData, placeholder = "", type = "text") => (
    <div className={styles.metaRow} style={{ alignItems: "center" }}>
      <span className={styles.metaLabel} style={{ minWidth: "200px" }}>{label}</span>
      <input
        type={type}
        name={name}
        value={formData[name] || ""}
        onChange={handleChange}
        className={styles.testInput}
        placeholder={placeholder}
        style={{ flex: 1, padding: "10px 14px" }}
      />
    </div>
  );

  return (
    <>
      {/* Action Bar */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlsHeader} style={{ marginBottom: 0 }}>
          <span className={styles.controlsTitle}>Trạng thái hệ thống</span>
          <div className={styles.btnRow}>
            <button
              className={styles.btnPrimary}
              onClick={handleSave}
              disabled={isSaving}
              style={{ minWidth: "120px" }}
            >
              {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
            </button>
          </div>
        </div>
        {message && <div style={{ color: "#059669", fontSize: "0.85rem", marginTop: "10px" }}>✓ {message}</div>}
        {error && <div style={{ color: "#dc2626", fontSize: "0.85rem", marginTop: "10px" }}>✗ {error}</div>}
      </div>

      {/* Shopee Affiliate Config */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Cấu hình Shopee Affiliate</h2>
        </div>
        <div className={styles.tableCard}>
          <div className={styles.metaList}>
            {renderInput("Affiliate ID", "AFFILIATE_ID", "VD: 17321560336")}
            {renderInput("Sub ID Mặc Định", "AFFILIATE_SUB_ID1", "VD: huphet")}
            {renderInput("Custom Link API Khác", "AFFILIATE_CUSTOM_LINK_API_URL", "http://localhost:3000/api/internal/affiliate/custom-link")}
          </div>
        </div>
      </section>

      {/* AccessTrade & Partner API Config */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Data & Partner APIs</h2>
        </div>
        <div className={styles.tableCard}>
          <div className={styles.metaList}>
            {renderInput("AccessTrade Token", "ACCESSTRADE_TOKEN", "Nhập mã JWT Token từ AccessTrade", "password")}
            {renderInput("Partner API Endpoint", "TIENVE_FLASH_DEALS_API_URL", "URL gọi deal từ Partner. Trống = dùng URL mặc định.")}
            {renderInput("Partner Page URL", "TIENVE_CACHE_PAGE_URL", "tienve-partner")}
          </div>
        </div>
      </section>

      {/* Database Cache */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Database & Cache (Supabase)</h2>
        </div>
        <div className={styles.tableCard}>
          <div className={styles.metaList}>
            {renderInput("Supabase URL", "SUPABASE_URL", "https://xyz.supabase.co")}
            {renderInput("Supabase Service Key", "SUPABASE_SERVICE_ROLE_KEY", "ey...", "password")}
            {renderInput("Cache Table Name", "SUPABASE_CACHE_TABLE", "shopee_cache")}
          </div>
        </div>
      </section>
    </>
  );
}
