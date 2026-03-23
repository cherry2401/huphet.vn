import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/blog/posts — list posts (public: published only, admin: all)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supabase = await createClient();

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(Number(searchParams.get("limit") ?? 12), 50);
  const category = searchParams.get("category") ?? null;
  const status = searchParams.get("status") ?? null;
  const admin = searchParams.get("admin") === "1";

  // Admin mode: check auth
  if (admin) {
    const { requireAdmin } = await import("@/lib/admin/auth");
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let query = supabase
    .from("blog_posts")
    .select("*, blog_categories(name, slug)", { count: "exact" });

  if (admin) {
    // Admin sees all
    if (status) query = query.eq("status", status);
  } else {
    query = query.eq("status", "published");
  }

  if (category) {
    // join filter by category slug
    const { data: cat } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("slug", category)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }

  const tag = searchParams.get("tag") ?? null;
  if (tag) {
    const { data: tagRow } = await supabase
      .from("blog_tags")
      .select("id")
      .eq("slug", tag)
      .single();
    if (tagRow) {
      const { data: postTags } = await supabase
        .from("blog_post_tags")
        .select("post_id")
        .eq("tag_id", tagRow.id);
      const postIds = (postTags ?? []).map((pt) => pt.post_id);
      if (postIds.length > 0) {
        query = query.in("id", postIds);
      } else {
        query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
      }
    }
  }

  query = query
    .order("published_at", { ascending: false, nullsFirst: false })
    .range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    posts: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}

// POST /api/blog/posts — create post (admin)
export async function POST(request: Request) {
  const supabase = await createClient();

  // Admin only
  const { requireAdmin } = await import("@/lib/admin/auth");
  let user;
  try {
    user = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, slug, excerpt, content, cover_image, category_id, status: postStatus } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: "Title and slug required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title,
      slug,
      excerpt: excerpt || null,
      content: content || "",
      cover_image: cover_image || null,
      category_id: category_id || null,
      author_id: user.id,
      status: postStatus || "draft",
      published_at: postStatus === "published" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ post: data });
}
