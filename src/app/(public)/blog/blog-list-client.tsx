"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./blog.module.css";

type Post = {
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

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  posts: Post[];
  categories: Category[];
  categoryCounts: Record<string, number>;
  currentCategory: string;
  currentPage: number;
  totalPages: number;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "2-digit",
    year: "numeric",
  });
}

function estimateReadTime(excerpt: string | null): string {
  const words = (excerpt || "").split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 40))} phút`;
}

export function BlogListClient({ posts, categories, categoryCounts, currentCategory, currentPage, totalPages }: Props) {
  const router = useRouter();

  const featuredPost = posts.find((p) => p.is_featured) || posts[0] || null;
  const remainingPosts = posts.filter((p) => p.id !== featuredPost?.id);
  const sidePosts = remainingPosts.slice(0, 2);
  const gridPosts = remainingPosts; // Tất cả bài trừ featured
  const popularPosts = [...posts].sort((a, b) => b.views - a.views).slice(0, 7);

  function handleCategoryChange(slug: string) {
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    router.push(`/blog${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className={styles.blogPage}>
      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className={styles.categoryTabs}>
          <button
            type="button"
            className={!currentCategory ? styles.categoryTabActive : styles.categoryTab}
            onClick={() => handleCategoryChange("")}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={currentCategory === cat.slug ? styles.categoryTabActive : styles.categoryTab}
              onClick={() => handleCategoryChange(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <div className={styles.emptyBlog}>
          <h2>Chưa có bài viết</h2>
          <p>Hãy quay lại sau để đọc các bài viết mới nhất!</p>
        </div>
      ) : (
        /* ═══ 2-Column Layout: Content + Sidebar ═══ */
        <div className={styles.blogMainLayout}>
          {/* LEFT: All content */}
          <div className={styles.blogMainContent}>
            {/* Featured Section: 1 big + 2 small */}
            <div className={styles.featuredSection}>
              {featuredPost && (
                <Link href={`/blog/${featuredPost.slug}`} className={styles.featuredCard}>
                  <div className={styles.featuredBg}>
                    {featuredPost.cover_image ? (
                      <Image src={featuredPost.cover_image} alt={featuredPost.title} width={800} height={400} unoptimized />
                    ) : (
                      <div className={styles.featuredFallback} />
                    )}
                  </div>
                  <div className={styles.featuredOverlay}>
                    <span className={styles.featuredBadge}>Nổi bật</span>
                    {featuredPost.blog_categories && (
                      <span className={styles.featuredCat}>{featuredPost.blog_categories.name}</span>
                    )}
                    <h2 className={styles.featuredTitle}>{featuredPost.title}</h2>
                    {featuredPost.excerpt && (
                      <p className={styles.featuredExcerpt}>{featuredPost.excerpt}</p>
                    )}
                    <div className={styles.featuredMeta}>
                      <span>{formatDate(featuredPost.published_at)}</span>
                      <span>👁 {featuredPost.views}</span>
                      <span>⏱ {estimateReadTime(featuredPost.excerpt)}</span>
                    </div>
                  </div>
                </Link>
              )}

              {sidePosts.length > 0 && (
                <div className={styles.sideList}>
                  {sidePosts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className={styles.sideCard}>
                      <div className={styles.sideThumb}>
                        {post.cover_image ? (
                          <Image src={post.cover_image} alt={post.title} width={200} height={120} unoptimized />
                        ) : (
                          <div className={styles.sideThumbFallback}>✎</div>
                        )}
                      </div>
                      <div className={styles.sideInfo}>
                        {post.blog_categories && (
                          <span className={styles.sideCat}>{post.blog_categories.name}</span>
                        )}
                        <h3 className={styles.sideTitle}>{post.title}</h3>
                        <span className={styles.sideMeta}>{formatDate(post.published_at)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Grid posts below */}
            {gridPosts.length > 0 && (
              <>
                <h2 className={styles.sectionHeading}>Bài viết mới nhất</h2>
                <div className={styles.postGrid}>
                  {gridPosts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className={styles.postCard}>
                      <div className={styles.postCover}>
                        {post.cover_image ? (
                          <Image src={post.cover_image} alt={post.title} width={400} height={200} unoptimized />
                        ) : (
                          <div className={styles.postCoverFallback}>✎</div>
                        )}
                        {post.blog_categories && (
                          <span className={styles.postCategoryBadge}>{post.blog_categories.name}</span>
                        )}
                      </div>
                      <div className={styles.postBody}>
                        <h2 className={styles.postCardTitle}>{post.title}</h2>
                        {post.excerpt && <p className={styles.postExcerpt}>{post.excerpt}</p>}
                        <div className={styles.postMeta}>
                          <span>{formatDate(post.published_at)}</span>
                          <span>⏱ {estimateReadTime(post.excerpt)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={p === currentPage ? styles.pageBtnActive : styles.pageBtn}
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (currentCategory) params.set("category", currentCategory);
                      if (p > 1) params.set("page", String(p));
                      router.push(`/blog${params.toString() ? `?${params}` : ""}`);
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar — sits alongside everything from top */}
          <aside className={styles.blogSidebar}>
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarHeading}>Xem nhiều nhất</h3>
              <ul className={styles.popularList}>
                {popularPosts.map((post, idx) => (
                  <li key={post.id}>
                    <Link href={`/blog/${post.slug}`} className={styles.popularItem}>
                      <span className={styles.popularRank}>{idx + 1}</span>
                      <div className={styles.popularInfo}>
                        <span className={styles.popularTitle}>{post.title}</span>
                        <span className={styles.popularMeta}>
                          {post.views} · {post.blog_categories?.name ?? "Blog"}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarHeading}>Danh mục</h3>
              <ul className={styles.sidebarCatList}>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      type="button"
                      className={styles.sidebarCatItem}
                      onClick={() => handleCategoryChange(cat.slug)}
                    >
                      <span className={styles.catIcon}>›</span>
                      <span className={styles.catName}>{cat.name}</span>
                      <span className={styles.catCount}>{categoryCounts[cat.id] ?? 0}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
