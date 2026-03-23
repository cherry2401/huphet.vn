import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { createRateLimiter, getClientIP } from "@/lib/rate-limit";
import { trackEventSchema, parseBody } from "@/lib/validations";

// 60 requests per 60s per IP (analytics is high-volume)
const limiter = createRateLimiter({ windowMs: 60_000, max: 60 });

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/analytics/track
 * Ghi nhận page_view hoặc feature_click
 * Body: { event_type, page, feature?, session_id? }
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const ip = getClientIP(req);
    if (!limiter.check(ip)) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: limiter.getHeaders(ip) }
      );
    }

    const rawBody = await req.json();
    const parsed = parseBody(trackEventSchema, rawBody);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    const { event_type, page, feature, session_id } = parsed.data;

    // Hash IP for unique visitor counting (privacy-friendly)
    const forwarded = req.headers.get("x-forwarded-for");
    const rawIp = forwarded?.split(",")[0]?.trim() ?? "unknown";
    const ipHash = crypto.createHash("sha256").update(rawIp + new Date().toISOString().split("T")[0]).digest("hex").slice(0, 16);

    const userAgent = req.headers.get("user-agent") ?? undefined;
    const referrer = req.headers.get("referer") ?? undefined;

    await getSupabase().from("analytics_events").insert({
      event_type,
      page,
      feature: feature ?? null,
      session_id: session_id ?? null,
      referrer: referrer ?? null,
      user_agent: userAgent?.slice(0, 200) ?? null,
      ip_hash: ipHash,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

