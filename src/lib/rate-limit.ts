/**
 * In-memory rate limiter cho API routes.
 * Dùng sliding window counter pattern.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
 *   // Trong route handler:
 *   const ip = request.headers.get("x-forwarded-for") ?? "unknown";
 *   if (!limiter.check(ip)) {
 *     return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 *   }
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimiterOptions = {
  /** Thời gian cửa sổ tính bằng milliseconds (default: 60s) */
  windowMs?: number;
  /** Số request tối đa trong cửa sổ (default: 10) */
  max?: number;
};

export function createRateLimiter(opts: RateLimiterOptions = {}) {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 10;
  const store = new Map<string, RateLimitEntry>();

  // Cleanup expired entries mỗi 5 phút
  const CLEANUP_INTERVAL = 5 * 60 * 1000;
  let lastCleanup = Date.now();

  function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }

  return {
    /**
     * Kiểm tra key có bị rate limit không.
     * @returns true nếu request được phép, false nếu bị limit
     */
    check(key: string): boolean {
      cleanup();
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }

      if (entry.count >= max) {
        return false;
      }

      entry.count++;
      return true;
    },

    /** Lấy headers rate limit để trả về client */
    getHeaders(key: string): Record<string, string> {
      const entry = store.get(key);
      const remaining = entry ? Math.max(0, max - entry.count) : max;
      const reset = entry ? Math.ceil((entry.resetAt - Date.now()) / 1000) : 0;
      return {
        "X-RateLimit-Limit": String(max),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(Math.max(0, reset)),
      };
    },
  };
}

/** Helper lấy IP từ request */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
