"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "./site-header";
import { BottomNav } from "./bottom-nav";

const ADMIN_PREFIX = "/admin";

export function SiteHeaderWrapper() {
  const pathname = usePathname();

  // Hide header on admin pages
  if (pathname.startsWith(ADMIN_PREFIX)) {
    return null;
  }

  return (
    <>
      <SiteHeader />
      <BottomNav />
    </>
  );
}
