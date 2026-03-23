import { redirect } from "next/navigation";
import { Be_Vietnam_Pro } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "./sidebar";
import styles from "./admin-layout.module.css";

const adminFont = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
});

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side admin guard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin-login");
  }

  const email = (user.email ?? "").toLowerCase().trim();

  // Fail-safe: nếu ADMIN_EMAILS trống hoặc không set → block tất cả
  if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(email)) {
    redirect("/admin-login?error=no_permission");
  }

  return (
    <div className={styles.wrapper} style={{ fontFamily: adminFont.style.fontFamily }}>
      <Sidebar />
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}

