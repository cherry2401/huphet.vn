import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/blog/interact — toggle like/save
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { post_id, type } = body; // type: "like" | "save"

  if (!post_id || !["like", "save"].includes(type)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const table = type === "like" ? "blog_likes" : "blog_saves";

  // Check if already exists
  const { data: existing } = await supabase
    .from(table)
    .select("user_id")
    .eq("user_id", user.id)
    .eq("post_id", post_id)
    .maybeSingle();

  if (existing) {
    // Remove
    await supabase.from(table).delete().eq("user_id", user.id).eq("post_id", post_id);
    return NextResponse.json({ active: false });
  } else {
    // Add
    await supabase.from(table).insert({ user_id: user.id, post_id });
    return NextResponse.json({ active: true });
  }
}
