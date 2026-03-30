import styles from "@/app/admin/admin.module.css";
import SettingsForm, { SettingsData } from "./settings-form";

export const metadata = {
  title: "Cấu hình hệ thống | Admin Panel",
};

export default function SettingsPage() {
  const initialData: SettingsData = {
    AFFILIATE_ID: process.env.AFFILIATE_ID ?? "",
    AFFILIATE_SUB_ID1: process.env.AFFILIATE_SUB_ID1 ?? "",
    AFFILIATE_CUSTOM_LINK_API_URL: process.env.AFFILIATE_CUSTOM_LINK_API_URL ?? "",
    TIENVE_FLASH_DEALS_API_URL: process.env.TIENVE_FLASH_DEALS_API_URL ?? "",
    TIENVE_CACHE_PAGE_URL: process.env.TIENVE_CACHE_PAGE_URL ?? "",
    SUPABASE_URL: process.env.SUPABASE_URL ?? "",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    SUPABASE_CACHE_TABLE: process.env.SUPABASE_CACHE_TABLE ?? "shopee_cache",
    ACCESSTRADE_TOKEN: process.env.ACCESSTRADE_TOKEN ?? "",
  };

  return (
    <main className={styles.page}>
      {/* ═══ Hero Banner ═══ */}
      <div className={styles.heroBanner}>
        <p className={styles.eyebrow}>Cài đặt</p>
        <h1 className={styles.heroTitle}>Cấu hình hệ thống</h1>
        <p className={styles.heroSub}>
          Xem cấu hình environment, cache backend, và API endpoints. Các thay đổi tại đây sẽ cập nhật trực tiếp file .env.local và restart server.
        </p>
      </div>

      <SettingsForm initialData={initialData} />

      {/* Guide */}
      <section className={styles.section} style={{ marginTop: "32px" }}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Thông tin System</h2>
          </div>
        </div>
        <div className={styles.tableCard}>
          <div className={styles.metaList}>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Node.js</span>
              <span><code>{process.version}</code></span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Environment</span>
              <span><code>{process.env.NODE_ENV ?? "development"}</code></span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Sửa config</span>
              <span>Hệ thống tự động ghi đè file <code>.env.local</code> và gửi lệnh <code>pm2 restart</code> sau khi lưu thành công.</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
