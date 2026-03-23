"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin-layout.module.css";

/* ── SVG Icons (Lucide-style, 20px) ── */
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function IconOverview() {
  return <Icon><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Icon>;
}
function IconBlog() {
  return <Icon><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></Icon>;
}
function IconSync() {
  return <Icon><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></Icon>;
}
function IconChart() {
  return <Icon><path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 5-9" /></Icon>;
}
function IconWallet() {
  return <Icon><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M16 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></Icon>;
}
function IconWithdraw() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73z"/>
    </svg>
  );
}
function IconUsers() {
  return <Icon><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>;
}
function IconSettings() {
  return <Icon><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></Icon>;
}
function IconArrowLeft() {
  return <Icon><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></Icon>;
}
function IconMenu() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

type NavItem = { href: string; icon: React.ReactNode; label: string };
type NavSection = { title: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    title: "MAIN MENU",
    items: [
      { href: "/admin/overview", icon: <IconOverview />, label: "Tổng quan" },
      { href: "/admin/blog", icon: <IconBlog />, label: "Blog" },
      { href: "/admin/sync", icon: <IconSync />, label: "Sync & Affiliate" },
      { href: "/admin/analytics", icon: <IconChart />, label: "Analytics" },
    ],
  },
  {
    title: "QUẢN LÝ",
    items: [
      { href: "/admin/cashback", icon: <IconWallet />, label: "Cashback" },
      { href: "/admin/withdrawals", icon: <IconWithdraw />, label: "Rút tiền" },
      { href: "/admin/users", icon: <IconUsers />, label: "Người dùng" },
    ],
  },
  {
    title: "HỆ THỐNG",
    items: [
      { href: "/admin/settings", icon: <IconSettings />, label: "Cài đặt" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile Header */}
      <div className={styles.mobileHeader}>
        <button type="button" className={styles.hamburger} onClick={() => setOpen(true)} aria-label="Open menu">
          <IconMenu />
        </button>
        <span className={styles.mobileTitle}>Admin</span>
      </div>

      {/* Overlay */}
      <div
        className={`${styles.overlay} ${open ? styles.overlayVisible : ""}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        {/* Brand */}
        <Link href="/admin/overview" className={styles.sidebarBrand} onClick={() => setOpen(false)}>
          <div className={styles.brandIcon}>H</div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>Hup Het</span>
            <span className={styles.brandSub}>Admin Panel</span>
          </div>
        </Link>

        {/* Nav Sections */}
        <div className={styles.navContainer}>
          {NAV_SECTIONS.map((section) => (
            <nav key={section.title} className={styles.navSection}>
              <p className={styles.navLabel}>{section.title}</p>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(item.href) ? styles.navLinkActive : styles.navLink}
                  onClick={() => setOpen(false)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          ))}
        </div>

        {/* Bottom */}
        <div className={styles.navBottom}>
          <Link href="/" className={styles.backLink}>
            <span className={styles.navIcon}><IconArrowLeft /></span>
            <span>Về trang chủ</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
