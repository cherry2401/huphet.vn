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

// GET: Danh sách yêu cầu rút tiền (cho admin)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "all";

  try {
    await requireAdmin();
    const supabase = getAdminSupabase();

    let query = supabase
      .from("cashback_withdrawals")
      .select("*")
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with user info
    const userIds = [...new Set((data ?? []).map((w: any) => w.user_id))];
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, display_name, phone")
      .in("id", userIds);

    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map(
      (authData?.users ?? []).map((u: any) => [u.id, u.email])
    );
    const profileMap = new Map(
      (profiles ?? []).map((p: any) => [p.id, p])
    );

    const enriched = (data ?? []).map((w: any) => ({
      ...w,
      user_email: emailMap.get(w.user_id) ?? "",
      user_name: (profileMap.get(w.user_id) as any)?.display_name ?? "",
      user_phone: (profileMap.get(w.user_id) as any)?.phone ?? "",
    }));

    // Stats
    const all = data ?? [];
    const stats = {
      total: all.length,
      pending: all.filter((w: any) => w.status === "pending").length,
      approved: all.filter((w: any) => w.status === "approved" || w.status === "paid").length,
      rejected: all.filter((w: any) => w.status === "rejected").length,
      totalAmount: all.reduce((s: number, w: any) => s + (w.amount ?? 0), 0),
      pendingAmount: all
        .filter((w: any) => w.status === "pending")
        .reduce((s: number, w: any) => s + (w.amount ?? 0), 0),
    };

    return NextResponse.json({ withdrawals: enriched, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Duyệt / Từ chối yêu cầu rút tiền
export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { withdrawalId, action, adminNote } = body;

    if (!withdrawalId || !action) {
      return NextResponse.json(
        { error: "withdrawalId và action là bắt buộc" },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    // Get withdrawal
    const { data: withdrawal, error: fetchError } = await supabase
      .from("cashback_withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      return NextResponse.json({ error: "Không tìm thấy yêu cầu" }, { status: 404 });
    }

    if (withdrawal.status !== "pending") {
      return NextResponse.json(
        { error: "Yêu cầu đã được xử lý trước đó" },
        { status: 400 }
      );
    }

    if (action === "approve" || action === "paid") {
      // Atomic approve via RPC
      const { data: result, error: rpcError } = await supabase.rpc(
        "admin_approve_withdrawal",
        {
          p_withdrawal_id: withdrawalId,
          p_action: action === "paid" ? "paid" : "approved",
          p_admin_note: adminNote ?? null,
        }
      );

      if (rpcError) {
        return NextResponse.json({ error: rpcError.message }, { status: 500 });
      }

      if (!result?.ok) {
        return NextResponse.json({ error: result?.error ?? "Lỗi xử lý" }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        message: `Đã ${action === "paid" ? "thanh toán" : "duyệt"} yêu cầu rút ${result.amount?.toLocaleString("vi-VN")}đ`,
      });
    }

    if (action === "reject") {
      // Atomic reject + refund via RPC
      const { data: result, error: rpcError } = await supabase.rpc(
        "admin_reject_withdrawal",
        {
          p_withdrawal_id: withdrawalId,
          p_admin_note: adminNote ?? null,
        }
      );

      if (rpcError) {
        return NextResponse.json({ error: rpcError.message }, { status: 500 });
      }

      if (!result?.ok) {
        return NextResponse.json({ error: result?.error ?? "Lỗi xử lý" }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        message: `Đã từ chối yêu cầu rút. Hoàn ${result.refunded?.toLocaleString("vi-VN")}đ về ví user.`,
      });
    }

    return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
