/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  fetchConversions,
  mapATStatus,
  calcCashback,
} from "@/lib/accesstrade";

const CASHBACK_USER_RATE = 0.7; // User nhận 70% commission (đơn tự động)

// Tạo Supabase admin client (bypass RLS)
function getAdminSupabase() {
  return createClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Extract user ID từ sub_id format "cb_XXXXXXXX"
function extractUserId(subId: string): string | null {
  if (!subId || !subId.startsWith("cb_")) return null;
  return subId.slice(3); // Trả về 8 ký tự đầu của user UUID
}

// Match conversion → user → update DB
async function processConversions(conversions: any[]) {
  const supabase = getAdminSupabase();
  let processed = 0;
  let skipped = 0;
  let matched = 0;
  let manualMatched = 0;

  for (const conv of conversions) {
    const conversionId = String(conv.transaction_id ?? conv.id ?? "");
    if (!conversionId) {
      skipped++;
      continue;
    }

    const atStatus = Number(conv.status ?? 0);
    const commission = Number(conv.commission ?? 0);
    const orderAmount = Number(conv.transaction_value ?? 0);
    const dbStatus = mapATStatus(atStatus);

    // ===== BƯỚC 1: Check conversion_id đã xử lý chưa =====
    const { data: existingByConversion } = await supabase
      .from("cashback_orders")
      .select("id, status, user_id, source")
      .eq("conversion_id", conversionId)
      .maybeSingle();

    if (existingByConversion) {
      // Đã có → chỉ update status nếu thay đổi
      if (
        existingByConversion.status !== dbStatus &&
        existingByConversion.status !== "paid"
      ) {
        const wasNotApproved = existingByConversion.status !== "approved";
        const rate =
          existingByConversion.source === "manual"
            ? 0.5
            : CASHBACK_USER_RATE;
        const cashbackAmount = calcCashback(commission, rate);

        await supabase
          .from("cashback_orders")
          .update({
            status: dbStatus,
            commission,
            order_amount: orderAmount,
            cashback_amount: cashbackAmount,
            conversion_time: conv.transaction_time ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingByConversion.id);

        // Nếu mới approved → cộng xu
        if (dbStatus === "approved" && wasNotApproved) {
          await creditWallet(
            supabase,
            existingByConversion.user_id,
            cashbackAmount
          );
        }
        processed++;
      } else {
        skipped++;
      }
      continue;
    }

    // ===== BƯỚC 2: Match đơn nhập tay (order_code) =====
    // Tìm đơn manual có order_code trùng transaction_id từ AT
    const { data: manualOrder } = await supabase
      .from("cashback_orders")
      .select("id, user_id, status")
      .eq("order_code", conversionId)
      .eq("source", "manual")
      .in("status", ["pending", "approved"])
      .maybeSingle();

    if (manualOrder) {
      const wasNotApproved = manualOrder.status !== "approved";
      const cashbackAmount = calcCashback(commission, 0.5); // 50% cho đơn nhập tay

      await supabase
        .from("cashback_orders")
        .update({
          conversion_id: conversionId,
          status: dbStatus,
          commission,
          order_amount: orderAmount,
          cashback_amount: cashbackAmount,
          merchant: conv.merchant ?? "shopee",
          conversion_time: conv.transaction_time ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", manualOrder.id);

      // Nếu approved → cộng xu
      if (dbStatus === "approved" && wasNotApproved) {
        await creditWallet(supabase, manualOrder.user_id, cashbackAmount);
      }

      manualMatched++;
      processed++;
      continue;
    }

    // ===== BƯỚC 3: Match bằng sub_id (đơn qua link hoàn tiền) =====
    const subId = conv.utm_source ?? conv._utm_source ?? "";
    const userIdPrefix = extractUserId(subId);

    if (!userIdPrefix) {
      skipped++;
      continue;
    }

    // Tìm order "clicked" match user prefix
    const { data: matchedOrders } = await supabase
      .from("cashback_orders")
      .select("id, user_id, status")
      .like("user_id", `${userIdPrefix}%`)
      .eq("status", "clicked")
      .order("created_at", { ascending: false })
      .limit(1);

    if (matchedOrders && matchedOrders.length > 0) {
      const order = matchedOrders[0];
      const cashbackAmount = calcCashback(commission, CASHBACK_USER_RATE);

      await supabase
        .from("cashback_orders")
        .update({
          conversion_id: conversionId,
          status: dbStatus,
          commission,
          order_amount: orderAmount,
          cashback_amount: cashbackAmount,
          click_time: conv.click_time ?? null,
          conversion_time: conv.transaction_time ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (dbStatus === "approved") {
        await creditWallet(supabase, order.user_id, cashbackAmount);
      }

      matched++;
      processed++;
    } else {
      // Không tìm thấy order match → tạo record mới nếu có user
      const { data: users } = await supabase
        .from("cashback_wallets")
        .select("user_id")
        .like("user_id", `${userIdPrefix}%`)
        .limit(1);

      if (users && users.length > 0) {
        const cashbackAmount = calcCashback(commission, CASHBACK_USER_RATE);

        await supabase.from("cashback_orders").insert({
          user_id: users[0].user_id,
          product_url: conv.landing_page ?? "unknown",
          affiliate_url: conv.at_product_link ?? "unknown",
          merchant: conv.merchant ?? "unknown",
          conversion_id: conversionId,
          status: dbStatus,
          commission,
          order_amount: orderAmount,
          cashback_amount: cashbackAmount,
          cashback_rate: CASHBACK_USER_RATE * 100,
          click_time: conv.click_time ?? null,
          conversion_time: conv.transaction_time ?? null,
        });

        if (dbStatus === "approved") {
          await creditWallet(supabase, users[0].user_id, cashbackAmount);
        }

        matched++;
        processed++;
      } else {
        skipped++;
      }
    }
  }

  return {
    processed,
    skipped,
    matched,
    manualMatched,
    total: conversions.length,
  };
}

// Cộng xu vào ví — atomic via SQL RPC (prevents lost updates)
async function creditWallet(
  supabase: any,
  userId: string,
  amount: number
) {
  if (!userId || amount <= 0) return;

  const { error } = await supabase.rpc("credit_wallet", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    console.error("creditWallet RPC error:", error);
  }
}

// ===== API Handler =====
export async function GET(request: Request) {
  try {
    // Auth check — Vercel Cron hoặc admin manual call
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const { searchParams } = new URL(request.url);
    const isAdminCall = searchParams.get("source") === "admin";

    if (isAdminCall) {
      // Admin call → check admin auth
      const { requireAdmin } = await import("@/lib/admin/auth");
      try {
        await requireAdmin();
      } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }

    // Lấy 7 ngày gần nhất
    const until = new Date();
    const since = new Date(until.getTime() - 7 * 24 * 60 * 60 * 1000);

    const sinceStr = since.toISOString().split("T")[0]; // YYYY-MM-DD
    const untilStr = until.toISOString().split("T")[0];



    // Fetch all pages
    let allConversions: any[] = [];
    let page = 1;
    while (true) {
      const batch = await fetchConversions(sinceStr, untilStr, page, 100);
      if (!Array.isArray(batch) || batch.length === 0) break;
      allConversions = allConversions.concat(batch);
      if (batch.length < 100) break; // Last page
      page++;
    }

    if (allConversions.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No conversions found",
        period: { since: sinceStr, until: untilStr },
      });
    }



    const result = await processConversions(allConversions);



    return NextResponse.json({
      ok: true,
      ...result,
      period: { since: sinceStr, until: untilStr },
      // Trả raw conversions cho admin UI hiển thị bảng báo cáo
      ...(isAdminCall
        ? {
            conversions: allConversions.map((c: any) => ({
              transaction_id: String(c.transaction_id ?? c.id ?? ""),
              merchant: c.merchant ?? "unknown",
              status: Number(c.status ?? 0),
              transaction_value: Number(c.transaction_value ?? 0),
              commission: Number(c.commission ?? 0),
              transaction_time: c.transaction_time ?? null,
              product_name: c.product_name ?? null,
              utm_source: c.utm_source ?? c._utm_source ?? "",
              utm_campaign: c.utm_campaign ?? c._utm_campaign ?? "",
              utm_content: c.utm_content ?? c._utm_content ?? "",
            })),
          }
        : {}),
    });
  } catch (err: any) {
    console.error("[Cashback Sync] Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
