"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export function GuestOnly({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") setIsLoggedIn(true);
      else if (event === "SIGNED_OUT") setIsLoggedIn(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Show during SSR/loading (optimistic for SEO), hide when confirmed logged in
  if (isLoggedIn === true) return null;

  return <>{children}</>;
}
