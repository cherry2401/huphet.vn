import styles from "@/app/admin/admin.module.css";

export default function SettingsPage() {
  const envInfo = [
    { label: "Node.js", value: process.version },
    { label: "Environment", value: process.env.NODE_ENV ?? "development" },
    { label: "Affiliate ID", value: process.env.AFFILIATE_ID ?? "—" },
    { label: "Custom Link API", value: process.env.AFFILIATE_CUSTOM_LINK_API_URL ?? "—" },
    { label: "Sub ID 1", value: process.env.AFFILIATE_SUB_ID1 ?? "—" },
    { label: "Partner API", value: process.env.TIENVE_FLASH_DEALS_API_URL ?? "Default endpoint" },
    { label: "Partner Page URL", value: process.env.TIENVE_CACHE_PAGE_URL ?? "tienve-partner" },
    { label: "Supabase URL", value: process.env.SUPABASE_URL ? "✓ Configured" : "✗ Not set" },
    { label: "Supabase Key", value: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Configured" : "✗ Not set" },
  ];

  const cacheInfo = [
    { label: "Cache Backend", value: process.env.SUPABASE_URL ? "Supabase + File" : "File only" },
    { label: "Supabase Table", value: process.env.SUPABASE_CACHE_TABLE ?? "shopee_cache" },
    { label: "Cache Page URL", value: "shopee-sieu-re" },
  ];

  return (
    <main className={styles.page}>
      {/* ═══ Hero Banner ═══ */}
      <div className={styles.heroBanner}>
        <p className={styles.eyebrow}>Cài đặt</p>
        <h1 className={styles.heroTitle}>Cấu hình hệ thống</h1>
        <p className={styles.heroSub}>
          Xem cấu hình environment, cache backend, và API endpoints. Thay đổi qua file .env.local.
        </p>
      </div>

      {/* Environment */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Biến môi trường</h2>
          </div>
        </div>
        <div className={styles.tableCard}>
          <div className={styles.metaList}>
            {envInfo.map((item) => (
              <div key={item.label} className={styles.metaRow}>
                <span className={styles.metaLabel}>{item.label}</span>
                <code>{item.value}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cache Config */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Cấu hình Cache</h2>
          </div>
        </div>
        <div className={styles.tableCard}>
          <div className={styles.metaList}>
            {cacheInfo.map((item) => (
              <div key={item.label} className={styles.metaRow}>
                <span className={styles.metaLabel}>{item.label}</span>
                <code>{item.value}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guide */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Hướng dẫn</h2>
          </div>
        </div>
        <div className={styles.tableCard}>
          <div className={styles.metaList}>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Sửa config</span>
              <span>Chỉnh file <code>.env.local</code> và restart server</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Kết nối Supabase</span>
              <span>Thêm <code>SUPABASE_URL</code> và <code>SUPABASE_SERVICE_ROLE_KEY</code></span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Custom Link</span>
              <span>Cần <code>AFFILIATE_CUSTOM_LINK_API_URL</code> và browser session</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
