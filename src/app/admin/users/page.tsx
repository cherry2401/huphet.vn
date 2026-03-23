import styles from "@/app/admin/admin.module.css";
import { AdminUsersClient } from "./users-client";

export const metadata = { title: "Quản lý User — Admin" };

export default function UsersPage() {
  return (
    <main className={styles.page}>
      <AdminUsersClient />
    </main>
  );
}
