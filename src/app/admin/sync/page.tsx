import styles from "@/app/admin/admin.module.css";
import { getAdminDashboardData } from "@/lib/admin/dashboard";
import { SyncControls } from "./sync-controls";

function formatDateTime(value: string | null) {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Saigon",
  }).format(new Date(value));
}

export default async function SyncPage() {
  const data = await getAdminDashboardData();
  const customLinkStats = data.partner.syncStatus?.affiliate?.customLink;

  return (
    <main className={styles.page}>
      {/* ═══ Hero Banner ═══ */}
      <div className={styles.heroBanner}>
        <p className={styles.eyebrow}>Sync & Affiliate</p>
        <h1 className={styles.heroTitle}>Quản lý đồng bộ</h1>
        <p className={styles.heroSub}>
          Sync Shopee cache, partner API, và kiểm soát affiliate custom-link.
        </p>
      </div>

      {/* Controls */}
      <SyncControls initialData={data} />

      {/* Affiliate Status */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Affiliate</p>
            <h2>Custom-link & Sub ID</h2>
          </div>
        </div>
        <div className={styles.tableCard}>
          <div className={styles.metaList}>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Affiliate ID</span>
              <code>{data.partner.affiliateConfig.affiliateId || "missing"}</code>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Custom-link API</span>
              <code>{data.partner.affiliateConfig.customLinkApiUrl || "not configured"}</code>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Sub ID config</span>
              <code>
                {[
                  data.partner.affiliateConfig.subIds.sub_id1 &&
                    `sub_id1=${data.partner.affiliateConfig.subIds.sub_id1}`,
                  data.partner.affiliateConfig.subIds.sub_id2 &&
                    `sub_id2=${data.partner.affiliateConfig.subIds.sub_id2}`,
                  data.partner.affiliateConfig.subIds.sub_id3 &&
                    `sub_id3=${data.partner.affiliateConfig.subIds.sub_id3}`,
                  data.partner.affiliateConfig.subIds.sub_id4 &&
                    `sub_id4=${data.partner.affiliateConfig.subIds.sub_id4}`,
                  data.partner.affiliateConfig.subIds.sub_id5 &&
                    `sub_id5=${data.partner.affiliateConfig.subIds.sub_id5}`,
                ]
                  .filter(Boolean)
                  .join(", ") || "none"}
              </code>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Last mode</span>
              <code>{data.partner.syncStatus?.affiliate.mode ?? "n/a"}</code>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Session</span>
              <span>
                {customLinkStats?.sessionStatus ?? "n/a"}
                {customLinkStats?.error ? `: ${customLinkStats.error}` : ""}
              </span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Convert rate</span>
              <span>
                {customLinkStats && customLinkStats.requested > 0
                  ? `${Math.round((customLinkStats.converted / customLinkStats.requested) * 100)}%`
                  : "n/a"}
                {customLinkStats
                  ? ` (${customLinkStats.converted}/${customLinkStats.requested})`
                  : ""}
              </span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>MMP fallback</span>
              <span>{customLinkStats?.mmpFallback ?? 0}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sync Log */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Sync Log</p>
            <h2>Trạng thái đồng bộ</h2>
          </div>
        </div>
        <div className={styles.tableCard}>
          {data.partner.syncStatus ? (
            <>
              <div className={styles.metaList}>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Last sync</span>
                  <span>{formatDateTime(data.partner.syncStatus.generatedAt)}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Updated slots</span>
                  <code>{data.partner.syncStatus.updatedSlots.join(", ") || "none"}</code>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Errors</span>
                  <span>{data.partner.syncStatus.errors.length}</span>
                </div>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Slot</th>
                    <th>Status</th>
                    <th>Deals</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {data.partner.syncStatus.slotResults.map((entry) => (
                    <tr key={entry.slot}>
                      <td>{entry.slot}</td>
                      <td>
                        <span className={entry.ok ? styles.chipOk : styles.chipFail}>
                          {entry.ok ? "✓ OK" : "✗ Fail"}
                        </span>
                      </td>
                      <td>{entry.dealCount}</td>
                      <td>{entry.error ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}></div>
              <p>Chưa có log sync. Bấm <strong>Sync Partner</strong> để tạo.</p>
            </div>
          )}
        </div>
      </section>

      {/* Partner Snapshots */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Snapshots</p>
            <h2>Slots đã lưu từ Partner API</h2>
          </div>
        </div>
        <div className={styles.tableCard}>
          {data.partner.dealSnapshots.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}></div>
              <p>Chưa có partner deals theo slot.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Slot</th>
                  <th>Deals</th>
                  <th>Generated at</th>
                  <th>Cache key</th>
                </tr>
              </thead>
              <tbody>
                {data.partner.dealSnapshots.map((snapshot) => (
                  <tr key={snapshot.cacheKey}>
                    <td>{snapshot.slot}</td>
                    <td>{snapshot.count}</td>
                    <td>{formatDateTime(snapshot.generatedAt)}</td>
                    <td><code>{snapshot.cacheKey}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
