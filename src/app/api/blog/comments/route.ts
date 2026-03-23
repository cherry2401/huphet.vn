import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRateLimiter, getClientIP } from "@/lib/rate-limit";
import { commentSchema, parseBody } from "@/lib/validations";

// 10 comments per minute per IP
const commentLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

// GET /api/blog/comments?post_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("post_id");
  if (!postId) return NextResponse.json({ error: "post_id required" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_comments")
    .select("*, user_profiles(display_name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ comments: data ?? [] });
}

// POST /api/blog/comments
export async function POST(request: Request) {
  // Rate limit
  const ip = getClientIP(request);
  if (!commentLimiter.check(ip)) {
    return NextResponse.json({ error: "Quá nhiều bình luận, thử lại sau" }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rawBody = await request.json();
  const parsed = parseBody(commentSchema, rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { post_id, content } = parsed.data;

  const { data, error } = await supabase
    .from("blog_comments")
    .insert({
      post_id,
      user_id: user.id,
      content: content.trim(),
    })
    .select("*, user_profiles(display_name, avatar_url)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ comment: data });
}

// DELETE /api/blog/comments?id=xxx (owner or admin)
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Check ownership
  const { data: comment } = await supabase
    .from("blog_comments")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

  // Allow: comment owner OR admin
  if (comment.user_id !== user.id) {
    const { requireAdmin } = await import("@/lib/admin/auth");
    try { await requireAdmin(); } catch {
      return NextResponse.json({ error: "Không có quyền xóa" }, { status: 403 });
    }
  }

  const { error } = await supabase.from("blog_comments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
