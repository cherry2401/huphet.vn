import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/blog/categories
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ categories: data ?? [] });
}

// POST /api/blog/categories — create category (admin only)
export async function POST(request: Request) {
  const { requireAdmin } = await import("@/lib/admin/auth");
  try { await requireAdmin(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const body = await request.json();
  const { name, slug, description, sort_order } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: "Name and slug required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("blog_categories")
    .insert({
      name,
      slug,
      description: description || null,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ category: data });
}

// PUT /api/blog/categories — update category (admin only)
export async function PUT(request: Request) {
  const { requireAdmin } = await import("@/lib/admin/auth");
  try { await requireAdmin(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const body = await request.json();
  const { id, name, slug, description, sort_order } = body;

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { data, error } = await supabase
    .from("blog_categories")
    .update({ name, slug, description, sort_order })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ category: data });
}

// DELETE /api/blog/categories (admin only)
export async function DELETE(request: Request) {
  const { requireAdmin } = await import("@/lib/admin/auth");
  try { await requireAdmin(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { error } = await supabase.from("blog_categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
