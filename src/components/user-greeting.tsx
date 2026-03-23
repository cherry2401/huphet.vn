"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function UserGreeting({ className }: { className?: string }) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Check initial state
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const displayName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "";
        setName(displayName);
      }
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const displayName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split("@")[0] ||
          "";
        setName(displayName);
      } else if (event === "SIGNED_OUT") {
        setName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!name) return null;

  return (
    <p className={className}>
      Xin chào, {name}! 🎉
    </p>
  );
}
