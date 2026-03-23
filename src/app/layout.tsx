import type { Metadata } from "next";
import { Nunito, Be_Vietnam_Pro, Inter } from "next/font/google";
import "./globals.css";
import { SiteHeaderWrapper } from "@/components/site-header-wrapper";

const bodyFont = Nunito({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
});

const navFont = Inter({
  variable: "--font-nav",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
});

const displayFont = Nunito({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["700", "800", "900"],
});

const adminFont = Be_Vietnam_Pro({
  variable: "--font-admin",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Húp Hết — Săn sale không bỏ sót",
  description:
    "Deal 1K, flash sale, xu live — tất cả trong một. Cập nhật 24/7, hoàn toàn miễn phí.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${displayFont.variable} ${adminFont.variable} ${navFont.variable}`}>
        <SiteHeaderWrapper />
        {children}
      </body>
    </html>
  );
}
