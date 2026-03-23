import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AUTO_POST_API_KEY = process.env.AUTO_POST_API_KEY ?? "";

// POST /api/blog/auto-post — Create post from n8n (API key auth)
export async function POST(request: Request) {
  // SECURITY: Reject ALL requests if API key not configured (prevent fail-open)
  if (!AUTO_POST_API_KEY) {
    return NextResponse.json(
      { error: "Server misconfigured: API key not set" },
      { status: 500 }
    );
  }

  // Verify API key
  const authHeader = request.headers.get("x-api-key") || "";
  if (!authHeader || authHeader !== AUTO_POST_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    slug,
    excerpt,
    content,
    cover_image,
    category_slug,
    status: postStatus,
  } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: "Title and slug required" }, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Find category by slug (optional)
  let category_id: string | null = null;
  if (category_slug) {
    const { data: cat } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("slug", category_slug)
      .single();

    if (cat) {
      category_id = cat.id;
    } else {
      // Auto-create category if not found
      const newSlug = category_slug
        .toLowerCase()
        .replace(/[^a-z0-9\u00C0-\u024F\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 80);
      const { data: newCat } = await supabase
        .from("blog_categories")
        .insert({ name: category_slug, slug: newSlug })
        .select("id")
        .single();
      if (newCat) category_id = newCat.id;
    }
  }

  const finalStatus = postStatus || "draft";

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title,
      slug,
      excerpt: excerpt || null,
      content: content || "",
      cover_image: cover_image || null,
      category_id,
      author_id: null, // auto-post has no user
      status: finalStatus,
      published_at: finalStatus === "published" ? new Date().toISOString() : null,
    })
    .select("id, title, slug, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Handle tags if provided
  const tags: string[] = body.tags || [];
  if (data && tags.length > 0) {
    for (const tagName of tags) {
      const tagSlug = tagName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80);

      // Upsert tag
      let tagId: string | null = null;
      const { data: existingTag } = await supabase
        .from("blog_tags")
        .select("id")
        .eq("slug", tagSlug)
        .single();

      if (existingTag) {
        tagId = existingTag.id;
      } else {
        const { data: newTag } = await supabase
          .from("blog_tags")
          .insert({ name: tagName, slug: tagSlug })
          .select("id")
          .single();
        if (newTag) tagId = newTag.id;
      }

      // Link tag to post
      if (tagId) {
        await supabase
          .from("blog_post_tags")
          .insert({ post_id: data.id, tag_id: tagId });
      }
    }
  }

  return NextResponse.json({ success: true, post: data });
}
