import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { BlogListClient } from "./blog-list-client";

export const metadata: Metadata = {
  title: "Blog — Húp Hết | Mẹo mua sắm, Review, Đời sống",
  description:
    "Blog Húp Hết — Chia sẻ mẹo mua sắm, review sản phẩm, hướng dẫn sử dụng, và mẹo tiết kiệm khi mua hàng online.",
  openGraph: {
    title: "Blog — Húp Hết",
    description: "Mẹo mua sắm, review sản phẩm, hướng dẫn & đời sống",
  },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolved = await searchParams;
  const category = (Array.isArray(resolved.category) ? resolved.category[0] : resolved.category) ?? "";
  const tagSlug = (Array.isArray(resolved.tag) ? resolved.tag[0] : resolved.tag) ?? "";
  const page = Number((Array.isArray(resolved.page) ? resolved.page[0] : resolved.page) ?? "1");

  const supabase = await createClient();

  // Fetch categories
  const { data: categories } = await supabase
    .from("blog_categories")
    .select("id, name, slug")
    .order("sort_order");

  // Count posts per category
  const { data: countData } = await supabase
    .from("blog_posts")
    .select("category_id")
    .eq("status", "published");

  const categoryCounts: Record<string, number> = {};
  (countData ?? []).forEach((p) => {
    if (p.category_id) {
      categoryCounts[p.category_id] = (categoryCounts[p.category_id] || 0) + 1;
    }
  });

  // Fetch posts
  let query = supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_image, views, is_featured, published_at, blog_categories(name, slug)", { count: "exact" })
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false });

  if (category) {
    const cat = (categories ?? []).find((c) => c.slug === category);
    if (cat) query = query.eq("category_id", cat.id);
  }

  // Filter by tag
  if (tagSlug) {
    const { data: tagRow } = await supabase
      .from("blog_tags")
      .select("id")
      .eq("slug", tagSlug)
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

  const limit = 12;
  query = query.range((page - 1) * limit, page * limit - 1);

  const { data: posts, count } = await query;

  type BlogPost = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_image: string | null;
    views: number;
    is_featured: boolean;
    published_at: string | null;
    blog_categories: { name: string; slug: string } | null;
  };

  return (
    <BlogListClient
      posts={(posts ?? []) as unknown as BlogPost[]}
      categories={categories ?? []}
      categoryCounts={categoryCounts}
      currentCategory={category}
      currentPage={page}
      totalPages={Math.ceil((count ?? 0) / limit)}
    />
  );
}
