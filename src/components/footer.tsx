"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./footer.module.css";

const FOOTER_COLS = [
  {
    title: "Tính năng",
    links: [
      { label: "Deal đồng giá 1K", href: "/deal" },
      { label: "Flash Sale", href: "/deal?tab=flash-sale" },
      { label: "Mã giảm giá", href: "/voucher" },
      { label: "Cào xu Live", href: "/live" },
      { label: "Tạo link Shopee", href: "/link" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Tài khoản", href: "/account" },
      { label: "Hoàn tiền", href: "/account/cashback" },
      { label: "Liên hệ qua Zalo", href: "https://zalo.me/g/gitecp218", external: true },
      { label: "Nhắn tin Fanpage", href: "https://www.facebook.com/profile.php?id=61582651056869", external: true },
    ],
  },
  {
    title: "Về chúng tôi",
    links: [
      { label: "Giới thiệu", href: "/about" },
      { label: "Điều khoản sử dụng", href: "/terms" },
      { label: "Chính sách bảo mật", href: "/privacy" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  const [openCol, setOpenCol] = useState<number | null>(null);

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerGrid}>
          {/* Brand */}
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.logo}>
              <Image src="/images/huphet_black-red.png" alt="huphet" className={styles.logoImg} width={120} height={40} />
            </Link>
            <p className={styles.brandDesc}>
              Nền tảng tổng hợp deal giá rẻ, mã giảm giá & xu live từ Shopee. Mua sắm thông minh, tiết kiệm tối đa.
            </p>
            <div className={styles.socials}>
              <a href="https://zalo.me/g/gitecp218" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Zalo">
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.socialIcon}>
                  <path d="M12 2C6.48 2 2 6.04 2 11c0 2.58 1.14 4.92 3 6.6V22l3.6-2.05C9.92 20.3 10.94 20.5 12 20.5c5.52 0 10-4.04 10-9S17.52 2 12 2z" />
                </svg>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61582651056869" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.socialIcon}>
                  <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.69 4.55-4.69 1.32 0 2.7.24 2.7.24v2.97h-1.52c-1.5 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8v8.44C19.61 23.08 24 18.09 24 12.07z" />
                </svg>
              </a>
              <a href="https://www.facebook.com/groups/2004178647070026" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Facebook Group">
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.socialIcon}>
                  <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5C23 14.17 18.33 13 16 13z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Columns — desktop: normal, mobile: accordion */}
          {FOOTER_COLS.map((col, i) => (
            <div key={i} className={`${styles.footerCol} ${openCol === i ? styles.footerColOpen : ""}`}>
              <button
                className={styles.colTitle}
                onClick={() => setOpenCol(openCol === i ? null : i)}
                aria-expanded={openCol === i}
              >
                <span>{col.title}</span>
                <svg className={styles.colChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <ul className={styles.colLinks}>
                {col.links.map((link, j) => (
                  <li key={j}>
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
                    ) : (
                      <Link href={link.href}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.footerDivider} />

        <div className={styles.footerBottom}>
          <p>© {year} Húp Hết. Tổng hợp deal — không liên kết chính thức với Shopee.</p>
        </div>
      </div>
    </footer>
  );
}
