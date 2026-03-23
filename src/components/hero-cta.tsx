"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface HeroCTAProps {
  primaryClass: string;
  secondaryClass: string;
}

export function HeroCTA({ primaryClass, secondaryClass }: HeroCTAProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Check initial state
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setIsLoggedIn(true);
      } else if (event === "SIGNED_OUT") {
        setIsLoggedIn(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show default (logged-in) CTAs during SSR/loading to avoid layout shift
  if (isLoggedIn === null || isLoggedIn) {
    return (
      <>
        <Link href="/deal" className={primaryClass}>
          Xem Deal 1K
        </Link>
        <Link href="/live" className={secondaryClass}>
          Cào Xu Live
        </Link>
      </>
    );
  }

  // Not logged in
  return (
    <>
      <Link href="/register" className={primaryClass}>
        Đăng ký ngay
      </Link>
      <Link href="/deal" className={secondaryClass}>
        Deal 1K
      </Link>
    </>
  );
}
