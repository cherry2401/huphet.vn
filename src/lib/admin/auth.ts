import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Kiểm tra user hiện tại có phải admin không.
 * Trả về user object nếu là admin, throw Response nếu không.
 *
 * Sử dụng: const user = await requireAdmin();
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Response(JSON.stringify({ error: "Chưa đăng nhập" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const email = (user.email ?? "").toLowerCase();

  if (ADMIN_EMAILS.length === 0) {
    // Nếu chưa set ADMIN_EMAILS → reject tất cả (fail-safe)
    console.error("[Auth] ADMIN_EMAILS env chưa được cấu hình!");
    throw new Response(
      JSON.stringify({ error: "Hệ thống chưa cấu hình admin" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!ADMIN_EMAILS.includes(email)) {
    throw new Response(
      JSON.stringify({ error: "Bạn không có quyền truy cập" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  return user;
}

/**
 * Kiểm tra API key cho internal/cron endpoints.
 * Trả về true nếu hợp lệ.
 */
export function requireApiKey(request: Request, envKey: string): boolean {
  const expected = process.env[envKey];
  if (!expected) return false;

  const authHeader = request.headers.get("authorization") ?? "";
  const apiKeyHeader = request.headers.get("x-api-key") ?? "";

  return (
    authHeader === `Bearer ${expected}` || apiKeyHeader === expected
  );
}
