import styles from "@/app/admin/admin.module.css";

const MOCK_STATS = {
  pageViews: { value: "12,847", change: "+14.2%", up: true },
  uniqueVisitors: { value: "3,291", change: "+8.7%", up: true },
  affiliateClicks: { value: "1,456", change: "+22.1%", up: true },
  conversionRate: { value: "4.8%", change: "+0.6%", up: true },
  estimatedRevenue: { value: "₫2,340,000", change: "+18.3%", up: true },
  avgSessionDuration: { value: "2m 34s", change: "+12s", up: true },
};

const MOCK_TOP_PAGES = [
  { path: "/deal", views: 8420, clicks: 1204 },
  { path: "/", views: 2341, clicks: 156 },
  { path: "/deal?tab=9k", views: 1287, clicks: 312 },
  { path: "/deal?tab=29k", views: 799, clicks: 198 },
];

const MOCK_TOP_PRODUCTS = [
  { name: "Áo thun basic cotton", clicks: 342, conversions: 28 },
  { name: "Tai nghe Bluetooth TWS", clicks: 289, conversions: 19 },
  { name: "Kem chống nắng SPF50", clicks: 234, conversions: 22 },
  { name: "Balo laptop chống sốc", clicks: 198, conversions: 15 },
  { name: "Túi đeo chéo mini", clicks: 167, conversions: 12 },
];

export default function AnalyticsPage() {
  return (
    <main className={styles.page}>
      {/* ═══ Hero Banner ═══ */}
      <div className={styles.heroBanner}>
        <p className={styles.eyebrow}>Analytics</p>
        <h1 className={styles.heroTitle}>Thống kê & Phân tích</h1>
        <p className={styles.heroSub}>
          Theo dõi lượt truy cập, clicks affiliate, và hiệu suất chuyển đổi.
        </p>
        <div className={styles.headerBadges} style={{ marginTop: 10 }}>
          <span className={styles.badge} style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>Tháng 3, 2026</span>
          <span className={styles.badge} style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>Mock data</span>
        </div>
      </div>

      {/* Main Stats */}
      <section className={styles.grid}>
        <article className={`${styles.statCard} ${styles.statCardSuccess}`}>
          <p className={styles.statLabel}>Lượt xem trang</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className={styles.statValue}>{MOCK_STATS.pageViews.value}</p>
            <span className={`${styles.changeBadge} ${styles.changeBadgeUp}`}>↑ {MOCK_STATS.pageViews.change}</span>
          </div>
          <p className={styles.statMeta}>vs tháng trước</p>
        </article>

        <article className={`${styles.statCard} ${styles.statCardInfo}`}>
          <p className={styles.statLabel}>Visitors</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className={styles.statValue}>{MOCK_STATS.uniqueVisitors.value}</p>
            <span className={`${styles.changeBadge} ${styles.changeBadgeUp}`}>↑ {MOCK_STATS.uniqueVisitors.change}</span>
          </div>
          <p className={styles.statMeta}>vs tháng trước</p>
        </article>

        <article className={`${styles.statCard} ${styles.statCardWarning}`}>
          <p className={styles.statLabel}>Affiliate Clicks</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className={styles.statValue}>{MOCK_STATS.affiliateClicks.value}</p>
            <span className={`${styles.changeBadge} ${styles.changeBadgeUp}`}>↑ {MOCK_STATS.affiliateClicks.change}</span>
          </div>
          <p className={styles.statMeta}>vs tháng trước</p>
        </article>

        <article className={`${styles.statCard} ${styles.statCardDanger}`}>
          <p className={styles.statLabel}>Doanh thu ước tính</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className={styles.statValue}>{MOCK_STATS.estimatedRevenue.value}</p>
            <span className={`${styles.changeBadge} ${styles.changeBadgeUp}`}>↑ {MOCK_STATS.estimatedRevenue.change}</span>
          </div>
          <p className={styles.statMeta}>vs tháng trước</p>
        </article>
      </section>

      {/* Additional Stats */}
      <section className={styles.grid} style={{ marginTop: 0, gridTemplateColumns: "repeat(2, 1fr)" }}>
        <article className={`${styles.statCard} ${styles.statCardInfo}`}>
          <p className={styles.statLabel}>Tỉ lệ chuyển đổi</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className={styles.statValue}>{MOCK_STATS.conversionRate.value}</p>
            <span className={`${styles.changeBadge} ${styles.changeBadgeUp}`}>↑ {MOCK_STATS.conversionRate.change}</span>
          </div>
          <p className={styles.statMeta}>vs tháng trước</p>
        </article>

        <article className={`${styles.statCard} ${styles.statCardSuccess}`}>
          <p className={styles.statLabel}>Thời gian trung bình</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className={styles.statValue}>{MOCK_STATS.avgSessionDuration.value}</p>
            <span className={`${styles.changeBadge} ${styles.changeBadgeUp}`}>↑ {MOCK_STATS.avgSessionDuration.change}</span>
          </div>
          <p className={styles.statMeta}>vs tháng trước</p>
        </article>
      </section>

      {/* Top Pages */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Trang có lượt xem cao nhất</h2>
          </div>
        </div>
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Trang</th>
                <th>Lượt xem</th>
                <th>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TOP_PAGES.map((page) => (
                <tr key={page.path}>
                  <td><code>{page.path}</code></td>
                  <td>{page.views.toLocaleString()}</td>
                  <td>{page.clicks.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top Products */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Top sản phẩm được click</h2>
          </div>
        </div>
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Clicks</th>
                <th>Conversions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TOP_PRODUCTS.map((product) => (
                <tr key={product.name}>
                  <td>{product.name}</td>
                  <td>{product.clicks}</td>
                  <td>
                    <span className={styles.chipOk}>{product.conversions}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
