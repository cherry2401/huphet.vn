/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "@/components/site-header.module.css";
import type { User } from "@supabase/supabase-js";

const NAV_ITEMS = [
  { href: "/", label: "Trang Chủ" },
  { href: "/deal", label: "Deal 1K", hot: true },
  { href: "/tiktok-sale", label: "TikTok Sale" },
  { href: "/hoan-tien", label: "Hoàn Tiền" },
  { href: "/tao-link", label: "Tạo Link" },
  { href: "/voucher", label: "Voucher" },
  { href: "/live", label: "Xu Live" },
  { href: "/blog", label: "Blog" },
];

/* ── Minimal mono SVG icons ── */
const sw = "1.8"; // stroke-width
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const IconWallet = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M2 10h20"/></svg>
);
const IconLink = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
);
const IconTag = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="m20.59 13.41-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"/><circle cx="7" cy="7" r="1"/></svg>
);
const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);

const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);

const IconWithdraw = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
);

const USER_MENU: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: "/tai-khoan", label: "Tài khoản", icon: <IconUser /> },
  { href: "/hoan-tien", label: "Ví cashback", icon: <IconWallet /> },
  { href: "/rut-tien", label: "Rút tiền", icon: <IconWithdraw /> },
  { href: "/tao-link", label: "Tạo link", icon: <IconLink /> },
  { href: "/voucher", label: "Mã giảm giá", icon: <IconTag /> },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  // Close menu on route change
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      if (menuOpen) setMenuOpen(false);
      if (dropdownOpen) setDropdownOpen(false);
      if (searchOpen) { setSearchOpen(false); setSearchQuery(""); }
    }
  }, [pathname, menuOpen, dropdownOpen, searchOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Prevent body scroll when menu or search is open
  useEffect(() => {
    if (menuOpen || searchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen, searchOpen]);

  // Focus search input when overlay opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Close search on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  const handleSearchSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/deal?q=${encodeURIComponent(q)}`);
  }, [searchQuery, router]);

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "";
  const initial = (displayName || "U").charAt(0).toUpperCase();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setDropdownOpen(false);
    router.push("/");
  };

  return (
    <>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <Image src="/images/huphet_dribbble_3.png" alt="huphet" className={`${styles.logoImg} ${styles.logoDesktop}`} width={120} height={40} priority />
          <Image src="/images/huphet_dribbble_3.png" alt="huphet" className={`${styles.logoImg} ${styles.logoMobile}`} width={40} height={40} priority />
        </Link>

        {/* Desktop nav */}
        <nav className={styles.nav} aria-label="Điều hướng chính">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? styles.navActive : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                {item.hot && <span className={styles.hotBadge}>HOT</span>}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User avatar with dropdown OR Login button */}
        {user ? (
          <div className={styles.userAvatarWrap} ref={dropdownRef}>
            <button
              className={styles.userAvatar}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              type="button"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  className={styles.avatarImg}
                  width={36}
                  height={36}
                  referrerPolicy="no-referrer"
                  unoptimized
                />
              ) : (
                <span className={styles.avatarFallback}>{initial}</span>
              )}
              <svg className={styles.avatarChevron} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className={styles.dropdown}>
                {/* User info header */}
                <div className={styles.dropdownHeader}>
                  <div className={styles.dropdownName}>{displayName || "Người dùng"}</div>
                  <div className={styles.dropdownEmail}>{user.email}</div>
                </div>

                <div className={styles.dropdownDivider} />

                {/* Menu items */}
                {USER_MENU.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.dropdownItem} ${pathname === item.href ? styles.dropdownItemActive : ""}`}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <span className={styles.dropdownIcon}>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}

                <div className={styles.dropdownDivider} />

                {/* Logout */}
                <button
                  className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                  onClick={handleLogout}
                  type="button"
                >
                  <span className={styles.dropdownIcon}><IconLogout /></span>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className={styles.headerCta}>
            Đăng nhập
          </Link>
        )}

        {/* Search button */}
        <button
          className={styles.searchBtn}
          onClick={() => setSearchOpen(true)}
          aria-label="Tìm kiếm"
          type="button"
        >
          <IconSearch />
        </button>

        {/* Mobile hamburger button */}
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <div className={styles.overlay} onClick={() => setMenuOpen(false)} />
      )}
      <nav
        className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ""}`}
        aria-label="Menu mobile"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.drawerLink} ${isActive ? styles.drawerLinkActive : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.hot && <span className={styles.hotBadge}>HOT</span>}
              {item.label}
            </Link>
          );
        })}

        {/* Drawer: account links */}
        {user ? (
          <>
            <div style={{ borderTop: "1px solid var(--line)", margin: "8px 0" }} />
            <Link
              href="/tai-khoan"
              className={`${styles.drawerLink} ${pathname === "/tai-khoan" ? styles.drawerLinkActive : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              <IconUser /> Tài khoản
            </Link>
            <Link
              href="/hoan-tien"
              className={`${styles.drawerLink} ${pathname === "/hoan-tien" ? styles.drawerLinkActive : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              <IconWallet /> Ví cashback
            </Link>
            <button
              className={styles.drawerLink}
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              type="button"
              style={{ color: "#f06548", border: "none", background: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
            >
              <IconLogout /> Đăng xuất
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className={`${styles.drawerLink} ${pathname === "/login" ? styles.drawerLinkActive : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            Đăng nhập
          </Link>
        )}
      </nav>

      {/* Search overlay */}
      {searchOpen && (
        <>
          <div className={styles.searchOverlay} onClick={() => { setSearchOpen(false); setSearchQuery(""); }} />
          <div className={styles.searchPanel}>
            <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
              <div className={styles.searchInputWrap}>
                <IconSearch />
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.searchInput}
                  placeholder="Tìm deal, voucher, sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className={styles.searchClear}
                    onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}
                    aria-label="Xóa"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button type="submit" className={styles.searchSubmit} disabled={!searchQuery.trim()}>
                Tìm
              </button>
            </form>
            <div className={styles.searchHints}>
              <span>Gợi ý:</span>
              {["Deal 1K", "Cà phê", "Sữa rửa mặt", "Kem chống nắng"].map((hint) => (
                <button
                  key={hint}
                  type="button"
                  className={styles.searchHintChip}
                  onClick={() => { setSearchQuery(hint); searchInputRef.current?.focus(); }}
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
