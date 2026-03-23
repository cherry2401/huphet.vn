import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { verifyOrder, mapATStatus, calcCashback } from "@/lib/accesstrade";
import { createRateLimiter, getClientIP } from "@/lib/rate-limit";
import { submitOrderSchema, parseBody } from "@/lib/validations";

// 10 order submissions per minute per IP
const submitLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

const CASHBACK_RATE = 0.5; // User nhận 50% commission cho đơn nhập tay

function getAdminSupabase() {
  return createAdminClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    // Rate limit
    const ip = getClientIP(request);
    if (!submitLimiter.check(ip)) {
      return NextResponse.json({ error: "Quá nhiều yêu cầu, thử lại sau" }, { status: 429 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Vui lòng đăng nhập để nhập đơn." },
        { status: 401 }
      );
    }

    const rawBody = await request.json();
    const parsed = parseBody(submitOrderSchema, rawBody);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    const orderCode = parsed.data.orderCode.toUpperCase();

    // Check if order code already submitted
    const { data: existing } = await supabase
      .from("cashback_orders")
      .select("id, user_id")
      .eq("order_code", orderCode)
      .maybeSingle();

    if (existing) {
      if (existing.user_id === user.id) {
        return NextResponse.json(
          { ok: false, error: "Bạn đã nhập đơn này rồi." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, error: "Mã đơn hàng này đã được nhập bởi người khác." },
        { status: 409 }
      );
    }

    // === GỌI ACCESSTRADE API VERIFY ĐƠN ===
    const atResult = await verifyOrder(orderCode);

    let insertData: Record<string, unknown> = {
      user_id: user.id,
      order_code: orderCode,
      product_url: "",
      affiliate_url: "",
      merchant: "shopee",
      source: "manual",
      cashback_rate: CASHBACK_RATE * 100, // 50
    };

    let verifyMessage = "";

    if (atResult) {
      // AT tìm thấy đơn → cập nhật thông tin thật
      const atStatus = mapATStatus(atResult.status);
      const commission = Number(atResult.commission ?? 0);
      const orderAmount = Number(atResult.transaction_value ?? 0);
      const cashbackAmount = calcCashback(commission, CASHBACK_RATE);

      insertData = {
        ...insertData,
        merchant: atResult.merchant ?? "shopee",
        conversion_id: String(atResult.transaction_id),
        status: atStatus,
        commission,
        order_amount: orderAmount,
        cashback_amount: cashbackAmount,
        conversion_time: atResult.transaction_time ?? null,
      };

      if (atStatus === "approved") {
        verifyMessage = `✅ Đơn hàng đã được xác minh thành công! Hoàn tiền ${cashbackAmount.toLocaleString("vi-VN")}đ đã cộng vào ví.`;
      } else if (atStatus === "rejected") {
        verifyMessage = `❌ Đơn hàng đã bị từ chối. Lý do: ${atResult.reason_reject ?? "Không rõ"}.`;
      } else {
        verifyMessage = `⏳ Đơn hàng đang chờ duyệt (giá trị ${orderAmount.toLocaleString("vi-VN")}đ). Hệ thống sẽ tự cộng xu khi được duyệt.`;
      }
    } else {
      // AT không tìm thấy → lưu pending, chờ cronjob sync sau
      insertData.status = "pending";
      verifyMessage =
        "📋 Đơn hàng đã được ghi nhận. Hệ thống sẽ xác minh tự động trong 24-48h.";
    }

    // Insert vào DB
    const { error: insertError, data: insertedOrder } = await supabase
      .from("cashback_orders")
      .insert(insertData)
      .select("id")
      .single();

    if (insertError) {
      console.error("Submit order error:", insertError);
      return NextResponse.json(
        { ok: false, error: "Có lỗi xảy ra, vui lòng thử lại." },
        { status: 500 }
      );
    }

    // Nếu AT approved → cộng xu vào ví ngay
    if (atResult && mapATStatus(atResult.status) === "approved") {
      const cashbackAmount = calcCashback(
        Number(atResult.commission ?? 0),
        CASHBACK_RATE
      );
      if (cashbackAmount > 0 && insertedOrder?.id) {
        await creditWallet(user.id, cashbackAmount);
      }
    }

    return NextResponse.json({
      ok: true,
      message: verifyMessage,
      verified: !!atResult,
      status: atResult ? mapATStatus(atResult.status) : "pending",
    });
  } catch (err) {
    console.error("Submit order error:", err);
    return NextResponse.json(
      { ok: false, error: "Đã có lỗi xảy ra, vui lòng thử lại." },
      { status: 500 }
    );
  }
}

// Cộng xu vào ví user — atomic via SQL RPC (prevents lost updates)
async function creditWallet(userId: string, amount: number) {
  if (!userId || amount <= 0) return;

  const admin = getAdminSupabase();
  const { error } = await admin.rpc("credit_wallet", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    console.error("creditWallet RPC error:", error);
  }
}

// GET: Fetch user's submitted orders
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Chưa đăng nhập." },
        { status: 401 }
      );
    }

    const { data: orders } = await supabase
      .from("cashback_orders")
      .select(
        "id, order_code, merchant, order_amount, cashback_amount, status, source, created_at"
      )
      .eq("user_id", user.id)
      .eq("source", "manual")
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ ok: true, orders: orders ?? [] });
  } catch (err) {
    console.error("Get submitted orders error:", err);
    return NextResponse.json(
      { ok: false, error: "Lỗi tải dữ liệu." },
      { status: 500 }
    );
  }
}
