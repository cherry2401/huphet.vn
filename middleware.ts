import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/* ─── Helpers: Internal API auth ─── */

function unauthorizedResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Shopee Admin"',
    },
  });
}

function parseBasicAuth(headerValue: string | null) {
  if (!headerValue || !headerValue.startsWith("Basic ")) return null;
  try {
    const decoded = atob(headerValue.slice(6));
    const sep = decoded.indexOf(":");
    if (sep === -1) return null;
    return { username: decoded.slice(0, sep), password: decoded.slice(sep + 1) };
  } catch {
    return null;
  }
}

function isValidBasicAuth(request: NextRequest) {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUsername || !expectedPassword) return false;

  const parsed = parseBasicAuth(request.headers.get("authorization"));
  return parsed?.username === expectedUsername && parsed.password === expectedPassword;
}

/* ─── Main Middleware ─── */

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── 1. Internal APIs: require API key or Basic Auth ──
  if (pathname.startsWith("/api/internal/")) {
    const apiKey = request.headers.get("x-api-key");
    const internalApiKey = process.env.INTERNAL_API_KEY;

    if (internalApiKey && apiKey === internalApiKey) {
      return NextResponse.next();
    }
    if (isValidBasicAuth(request)) {
      return NextResponse.next();
    }
    return unauthorizedResponse();
  }

  // ── 2. Supabase session refresh (keeps auth cookies alive) ──
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Refresh session — keeps the session alive
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Internal APIs
    "/api/internal/:path*",
    // All pages (session refresh) — exclude static/image/favicon
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
