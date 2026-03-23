/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin/auth";

function getAdminSupabase() {
  return createClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET: Danh sách users với profiles + wallets
export async function GET() {
  try {
    await requireAdmin();
    const supabase = getAdminSupabase();

    // Lấy danh sách users từ auth.users qua admin API
    const { data: authData, error: authError } =
      await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const users = authData?.users ?? [];

    // Lấy profiles
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, display_name, avatar_url, phone");

    // Lấy wallets
    const { data: wallets } = await supabase
      .from("cashback_wallets")
      .select("user_id, balance, total_earned, total_withdrawn");

    // Merge data
    const profileMap = new Map(
      (profiles ?? []).map((p: any) => [p.id, p])
    );
    const walletMap = new Map(
      (wallets ?? []).map((w: any) => [w.user_id, w])
    );

    const merged = users.map((u: any) => {
      const profile = profileMap.get(u.id) as any;
      const wallet = walletMap.get(u.id) as any;
      return {
        id: u.id,
        email: u.email ?? "",
        display_name: profile?.display_name ?? u.user_metadata?.full_name ?? "",
        avatar_url: profile?.avatar_url ?? u.user_metadata?.avatar_url ?? "",
        phone: profile?.phone ?? u.phone ?? "",
        role: u.role ?? "authenticated",
        provider: u.app_metadata?.provider ?? "email",
        email_confirmed: !!u.email_confirmed_at,
        banned: !!u.banned_until && new Date(u.banned_until) > new Date(),
        banned_until: u.banned_until,
        last_sign_in: u.last_sign_in_at,
        created_at: u.created_at,
        wallet_balance: wallet?.balance ?? 0,
        wallet_earned: wallet?.total_earned ?? 0,
        wallet_withdrawn: wallet?.total_withdrawn ?? 0,
      };
    });

    return NextResponse.json({ users: merged, total: merged.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

// PATCH: Cập nhật user (ban/unban, update profile)
export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { userId, action, data } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    switch (action) {
      case "ban": {
        // Ban user — set banned_until to far future
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          ban_duration: "876000h", // ~100 years
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, message: "User đã bị ban" });
      }

      case "unban": {
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          ban_duration: "none",
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, message: "User đã được unban" });
      }

      case "update_profile": {
        const updates: any = {};
        if (data?.display_name !== undefined) updates.display_name = data.display_name;
        if (data?.phone !== undefined) updates.phone = data.phone;
        if (data?.avatar_url !== undefined) updates.avatar_url = data.avatar_url;

        const { error } = await supabase
          .from("user_profiles")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", userId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, message: "Profile đã cập nhật" });
      }

      case "update_wallet": {
        const { balance } = data ?? {};
        if (balance === undefined) {
          return NextResponse.json({ error: "balance is required" }, { status: 400 });
        }

        const { error } = await supabase
          .from("cashback_wallets")
          .update({ balance: Number(balance), updated_at: new Date().toISOString() })
          .eq("user_id", userId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, message: "Wallet đã cập nhật" });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE: Xóa user
export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    // Xóa profile + wallet trước
    await supabase.from("user_profiles").delete().eq("id", userId);
    await supabase.from("cashback_wallets").delete().eq("user_id", userId);
    await supabase.from("cashback_orders").delete().eq("user_id", userId);

    // Xóa auth user
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, message: "User đã xóa" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
