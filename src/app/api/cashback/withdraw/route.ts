/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRateLimiter, getClientIP } from "@/lib/rate-limit";
import { withdrawSchema, parseBody } from "@/lib/validations";

// 5 withdrawal requests per minute per IP (strict)
const withdrawLimiter = createRateLimiter({ windowMs: 60_000, max: 5 });

// GET: Lấy lịch sử rút tiền + thông tin ví
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    // Lấy ví
    const { data: wallet } = await supabase
      .from("cashback_wallets")
      .select("balance, total_earned, total_withdrawn")
      .eq("user_id", user.id)
      .single();

    // Lấy lịch sử rút tiền
    const { data: withdrawals } = await supabase
      .from("cashback_withdrawals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Lấy lịch sử đơn cashback
    const { data: orders } = await supabase
      .from("cashback_orders")
      .select("id, merchant, order_amount, cashback_amount, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      wallet: wallet ?? { balance: 0, total_earned: 0, total_withdrawn: 0 },
      withdrawals: withdrawals ?? [],
      orders: orders ?? [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Tạo yêu cầu rút tiền
export async function POST(request: Request) {
  try {
    // Rate limit
    const ip = getClientIP(request);
    if (!withdrawLimiter.check(ip)) {
      return NextResponse.json({ error: "Quá nhiều yêu cầu, thử lại sau" }, { status: 429 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const rawBody = await request.json();
    const parsed = parseBody(withdrawSchema, rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { amount: withdrawAmount, bankName, bankAccount, accountName } = parsed.data;

    // Atomic withdrawal via RPC (prevents race conditions)
    const { data: result, error: rpcError } = await supabase.rpc(
      "process_withdrawal",
      {
        p_user_id: user.id,
        p_amount: withdrawAmount,
        p_bank_name: bankName.trim(),
        p_bank_account: bankAccount.trim(),
        p_account_name: accountName.trim().toUpperCase(),
      }
    );

    if (rpcError) {
      console.error("Withdrawal RPC error:", rpcError);
      return NextResponse.json(
        { error: "Lỗi xử lý rút tiền: " + rpcError.message },
        { status: 500 }
      );
    }

    // RPC returns JSON: { ok, error?, withdrawal_id?, new_balance? }
    if (!result?.ok) {
      return NextResponse.json(
        { error: result?.error ?? "Lỗi không xác định" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Yêu cầu rút tiền đã được gửi, vui lòng chờ admin duyệt.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
