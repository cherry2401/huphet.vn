"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
import Image from "next/image";
import styles from "../blog.module.css";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  views: number;
  published_at: string | null;
  category_id: string | null;
  blog_categories: { name: string; slug: string } | null;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_profiles: { display_name: string | null; avatar_url: string | null } | null;
};

type RelatedPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  views: number;
  published_at: string | null;
  blog_categories: { name: string; slug: string } | null;
};

type Props = {
  post: Post;
  likeCount: number;
  saveCount: number;
  tags: { name: string; slug: string }[];
};

export function BlogArticleClient({ post, likeCount: initialLikes, saveCount: initialSaves, tags }: Props) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [saves, setSaves] = useState(initialSaves);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const viewTracked = useRef(false);

  // Sanitize HTML content to prevent XSS
  const sanitizedContent = useMemo(() => {
    return DOMPurify.sanitize(post.content, {
      ALLOWED_TAGS: [
        "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr",
        "ul", "ol", "li", "blockquote", "pre", "code",
        "strong", "em", "b", "i", "u", "s", "del", "ins", "mark", "sub", "sup",
        "a", "img", "figure", "figcaption", "picture", "source",
        "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
        "div", "span", "section", "article", "details", "summary",
        "iframe",
      ],
      ALLOWED_ATTR: [
        "href", "target", "rel", "src", "alt", "title", "width", "height",
        "class", "id", "style", "loading", "decoding",
        "colspan", "rowspan", "scope",
        "allowfullscreen", "frameborder",
      ],
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ["target"],
      FORBID_TAGS: ["script", "style", "form", "input", "textarea", "select", "button"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
    });
  }, [post.content]);

  // Track view
  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    fetch("/api/blog/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id }),
    });
  }, [post.id]);

  // Fetch comments
  useEffect(() => {
    fetch(`/api/blog/comments?post_id=${post.id}`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []));
  }, [post.id]);

  // Fetch related posts
  useEffect(() => {
    async function fetchRelated() {
      let results: RelatedPost[] = [];

      // 1. Try fetching from same category first
      if (post.blog_categories?.slug) {
        const catParams = new URLSearchParams({
          admin: "1",
          limit: "4",
          status: "published",
          category: post.blog_categories.slug,
        });
        const catRes = await fetch(`/api/blog/posts?${catParams}`);
        const catData = await catRes.json();
        results = (catData.posts ?? []).filter((p: RelatedPost) => p.id !== post.id);
      }

      // 2. If not enough, fetch latest posts to fill up
      if (results.length < 3) {
        const fallbackParams = new URLSearchParams({
          admin: "1",
          limit: "6",
          status: "published",
        });
        const fallbackRes = await fetch(`/api/blog/posts?${fallbackParams}`);
        const fallbackData = await fallbackRes.json();
        const existingIds = new Set(results.map((r) => r.id));
        const extra = (fallbackData.posts ?? []).filter(
          (p: RelatedPost) => p.id !== post.id && !existingIds.has(p.id)
        );
        results = [...results, ...extra];
      }

      setRelatedPosts(results.slice(0, 3));
    }
    fetchRelated();
  }, [post.id, post.blog_categories?.slug]);

  async function toggleInteraction(type: "like" | "save") {
    try {
      const res = await fetch("/api/blog/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id, type }),
      });
      const data = await res.json();

      if (data.error) {
        alert("Vui lòng đăng nhập để " + (type === "like" ? "thích" : "lưu") + " bài viết!");
        return;
      }

      if (type === "like") {
        setLiked(data.active);
        setLikes((v) => v + (data.active ? 1 : -1));
      } else {
        setSaved(data.active);
        setSaves((v) => v + (data.active ? 1 : -1));
      }
    } catch {
      alert("Vui lòng đăng nhập!");
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id, content: commentText }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Vui lòng đăng nhập để bình luận!");
      } else if (data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setCommentText("");
      }
    } catch {
      alert("Lỗi khi gửi bình luận!");
    }
    setSubmitting(false);
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: post.title, url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Đã sao chép link!");
    }
  }

  return (
    <article className={styles.articlePage}>
      {/* Hero Banner */}
      <div className={`${styles.articleHero} ${!post.cover_image ? styles.articleHeroNoCover : ""}`}>
        {post.cover_image && (
          <div className={styles.articleHeroBg}>
            <Image src={post.cover_image} alt={post.title} width={1200} height={600} unoptimized />
          </div>
        )}
        <div className={styles.articleHeroContent}>
          <div className={styles.articleHeroBreadcrumb}>
            <Link href="/">Trang chủ</Link>
            <span>›</span>
            <Link href="/blog">Blog</Link>
            {post.blog_categories && (
              <>
                <span>›</span>
                <Link href={`/blog?category=${post.blog_categories.slug}`}>
                  {post.blog_categories.name}
                </Link>
              </>
            )}
          </div>
          {post.blog_categories && (
            <span className={styles.articleHeroCategory}>{post.blog_categories.name}</span>
          )}
          <h1 className={styles.articleHeroTitle}>{post.title}</h1>
          {post.excerpt && (
            <p className={styles.articleHeroExcerpt}>{post.excerpt}</p>
          )}
          <div className={styles.articleHeroMeta}>
            <span>
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString("vi-VN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : ""}
            </span>
            <span>· {post.views.toLocaleString()} lượt xem</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className={styles.articleContent}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />

      {/* Social Interactions */}
      <div className={styles.socialBar}>
        <button
          type="button"
          className={liked ? styles.socialBtnActive : styles.socialBtn}
          onClick={() => toggleInteraction("like")}
        >
          {liked ? "♥" : "♡"} {likes > 0 ? likes : ""} Thích
        </button>
        <button
          type="button"
          className={saved ? styles.socialBtnActive : styles.socialBtn}
          onClick={() => toggleInteraction("save")}
        >
          {saved ? "■" : "□"} {saves > 0 ? saves : ""} Lưu
        </button>
        <button type="button" className={styles.socialBtn} onClick={handleShare}>
          ↗ Chia sẻ
        </button>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className={styles.tagSection}>
          <span className={styles.tagLabel}>Tags</span>
          <div className={styles.tagList}>
            {tags.map((tag) => (
              <Link key={tag.slug} href={`/blog?tag=${tag.slug}`} className={styles.tagChip}>
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className={styles.commentsSection}>
        <h2 className={styles.commentsSectionTitle}>
          Bình luận ({comments.length})
        </h2>

        <form onSubmit={handleComment} className={styles.commentForm}>
          <input
            className={styles.commentInput}
            placeholder="Viết bình luận..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button
            type="submit"
            className={styles.commentSubmitBtn}
            disabled={submitting || !commentText.trim()}
          >
            {submitting ? "..." : "Gửi"}
          </button>
        </form>

        <div className={styles.commentsList}>
          {comments.map((c) => (
            <div key={c.id} className={styles.commentItem}>
              <div className={styles.commentAvatar}>
                {(c.user_profiles?.display_name || "U").charAt(0).toUpperCase()}
              </div>
              <div className={styles.commentBody}>
                <span className={styles.commentAuthor}>
                  {c.user_profiles?.display_name || "Ẩn danh"}
                </span>
                <span className={styles.commentDate}>
                  {new Date(c.created_at).toLocaleDateString("vi-VN")}
                </span>
                <p className={styles.commentText}>{c.content}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
              Chưa có bình luận nào. Hãy là người đầu tiên!
            </p>
          )}
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className={styles.relatedSection}>
          <div className={styles.relatedHeader}>
            <h2 className={styles.relatedTitle}>Bài viết liên quan</h2>
          </div>
          <p className={styles.relatedSub}>Khám phá thêm nội dung hữu ích</p>

          <div className={styles.relatedGrid}>
            {relatedPosts.map((rp) => (
              <Link key={rp.id} href={`/blog/${rp.slug}`} className={styles.relatedCard}>
                <div className={styles.relatedCover}>
                  {rp.cover_image ? (
                    <Image src={rp.cover_image} alt={rp.title} width={400} height={200} unoptimized />
                  ) : (
                    <div className={styles.relatedCoverFallback}>✎</div>
                  )}
                  {rp.blog_categories && (
                    <span className={styles.relatedCatBadge}>{rp.blog_categories.name}</span>
                  )}
                </div>
                <div className={styles.relatedBody}>
                  <h3 className={styles.relatedCardTitle}>{rp.title}</h3>
                  {rp.excerpt && <p className={styles.relatedExcerpt}>{rp.excerpt}</p>}
                  <div className={styles.relatedMeta}>
                    <span>
                      {rp.published_at
                        ? new Date(rp.published_at).toLocaleDateString("vi-VN")
                        : ""}
                    </span>
                    <span>· {rp.views} xem</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Link href="/blog" className={styles.relatedBackLink}>
            ← Xem tất cả bài viết
          </Link>
        </div>
      )}
    </article>
  );
}
