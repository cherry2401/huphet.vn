import styles from "@/app/admin/admin.module.css";
import { AdminWithdrawalsClient } from "../cashback/admin-withdrawals-client";

export const metadata = { title: "Rút tiền — Admin" };

export default function AdminWithdrawalsPage() {
  return (
    <main className={styles.page}>
      {/* ═══ Hero Banner ═══ */}
      <div className={styles.heroBanner}>
        <p className={styles.eyebrow}>Quản lý</p>
        <h1 className={styles.heroTitle}>Yêu cầu rút tiền</h1>
        <p className={styles.heroSub}>
          Duyệt, từ chối yêu cầu rút tiền cashback từ user.
        </p>
      </div>
      <AdminWithdrawalsClient />
    </main>
  );
}
