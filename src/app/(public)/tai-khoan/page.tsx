import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./dashboard-client";

export const metadata = {
  title: "Tài khoản – Húp Hết",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <DashboardClient
      user={{
        id: user.id,
        email: user.email ?? "",
        displayName: profile?.display_name || user.user_metadata?.full_name || "",
        avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || "",
        createdAt: user.created_at,
        provider: user.app_metadata?.provider ?? "email",
      }}
    />
  );
}
