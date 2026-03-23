import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BlogArticleClient } from "./blog-article-client";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, excerpt, cover_image")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) return { title: "Bài viết không tồn tại" };

  return {
    title: `${post.title} — Blog Húp Hết`,
    description: post.excerpt || `Đọc bài viết ${post.title} trên Blog Húp Hết`,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.cover_image ? [post.cover_image] : undefined,
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*, blog_categories(name, slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) notFound();

  // Get like/save counts + tags
  const [{ count: likeCount }, { count: saveCount }, { data: postTags }] = await Promise.all([
    supabase.from("blog_likes").select("*", { count: "exact", head: true }).eq("post_id", post.id),
    supabase.from("blog_saves").select("*", { count: "exact", head: true }).eq("post_id", post.id),
    supabase.from("blog_post_tags").select("tag_id, blog_tags(name, slug)").eq("post_id", post.id),
  ]);

  const tags = (postTags ?? [])
    .map((pt) => (pt as unknown as { blog_tags: { name: string; slug: string } }).blog_tags)
    .filter(Boolean);

  return (
    <BlogArticleClient
      post={post}
      likeCount={likeCount ?? 0}
      saveCount={saveCount ?? 0}
      tags={tags}
    />
  );
}
