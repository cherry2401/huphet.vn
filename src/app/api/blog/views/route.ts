import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/blog/views — increment view count
export async function POST(request: Request) {
  const body = await request.json();
  const { post_id } = body;

  if (!post_id) return NextResponse.json({ error: "post_id required" }, { status: 400 });

  const supabase = await createClient();
  await supabase.rpc("increment_blog_views", { p_post_id: post_id });

  return NextResponse.json({ ok: true });
}
