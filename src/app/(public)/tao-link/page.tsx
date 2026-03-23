import styles from "@/app/(public)/tao-link/page.module.css";
import { TaoLinkClient } from "@/app/(public)/tao-link/tao-link-client";

export default function TaoLinkPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headerTitle}>
          <h1><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.titleIcon}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Tạo Link Shopee</h1>
        </div>

        <TaoLinkClient />
      </div>
    </main>
  );
}
