import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Validate redirect path — only allow safe relative paths
function getSafeRedirect(next: string | null): string {
  if (!next) return "/";
  // Must start with / and not contain protocol or double slashes
  if (!next.startsWith("/") || next.startsWith("//") || next.includes(":\\")) return "/";
  // Block common redirect attack patterns
  if (next.includes("@") || next.includes("%2f%2f") || next.includes("\\")) return "/";
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeRedirect(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
