"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "../admin.module.css";

type Post = {
  id: string;
  title: string;
  slug: string;
  status: string;
  views: number;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  blog_categories: { name: string; slug: string } | null;
};

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ admin: "1", limit: "100" });
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/blog/posts?${params}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      try {
        const params = new URLSearchParams({ admin: "1", limit: "100" });
        if (filter !== "all") params.set("status", filter);
        const res = await fetch(`/api/blog/posts?${params}`);
        const data = await res.json();
        if (!cancelled) {
          setPosts(data.posts ?? []);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPosts();

    return () => {
      cancelled = true;
    };
  }, [filter]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Xóa bài "${title}"?`)) return;
    const res = await fetch(`/api/blog/posts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(`Xóa thất bại: ${data.error || res.statusText}`);
      return;
    }
    fetchPosts();
  }

  async function handleToggleFeatured(id: string, current: boolean) {
    await fetch(`/api/blog/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: !current }),
    });
    fetchPosts();
  }

  const totalPosts = posts.length;
  const publishedCount = posts.filter(p => p.status === "published").length;
  const draftCount = posts.filter(p => p.status === "draft").length;

  return (
    <div className={styles.page}>
      {/* ═══ Hero Banner ═══ */}
      <div className={styles.heroBanner} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p className={styles.eyebrow}>Blog</p>
          <h1 className={styles.heroTitle}>Quản lý bài viết</h1>
          <p className={styles.heroSub}>
            {totalPosts} bài viết · {publishedCount} đã xuất bản · {draftCount} bản nháp
          </p>
        </div>
        <div className={styles.btnRow}>
          <Link href="/admin/blog/categories" className={styles.btnOutline} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
            Danh mục
          </Link>
          <Link href="/admin/blog/editor" className={styles.btnPrimary} style={{ background: "#fff", color: "#f97316" }}>
            + Viết bài mới
          </Link>
        </div>
      </div>

      {/* Filter Pills */}
      <div className={styles.controlsPanel}>
        <div className={styles.btnRow}>
          {(["all", "published", "draft"] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={filter === f ? styles.btnPrimary : styles.btnGhost}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? `Tất cả (${totalPosts})` : f === "published" ? `Đã xuất bản (${publishedCount})` : `Bản nháp (${draftCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⏳</div>
            <p>Đang tải...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}></div>
            <strong>Chưa có bài viết nào</strong>
            <p>Bấm &quot;Viết bài mới&quot; để bắt đầu.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Danh mục</th>
                <th>Trạng thái</th>
                <th>Nổi bật</th>
                <th>Lượt xem</th>
                <th>Ngày đăng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <strong style={{ color: "#1a1d23" }}>{post.title}</strong>
                    <br />
                    <code>/{post.slug}</code>
                  </td>
                  <td>{post.blog_categories?.name ?? "—"}</td>
                  <td>
                    <span className={post.status === "published" ? styles.chipOk : styles.chipFail}>
                      {post.status === "published" ? "✓ Xuất bản" : "Nháp"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={post.is_featured ? styles.btnPrimary : styles.btnGhost}
                      onClick={() => handleToggleFeatured(post.id, post.is_featured)}
                      style={{ fontSize: "0.75rem", padding: "5px 12px" }}
                    >
                      {post.is_featured ? "Nổi bật" : "☆ Đặt"}
                    </button>
                  </td>
                  <td style={{ fontWeight: 600, color: "#1a1d23" }}>
                    {post.views.toLocaleString()}
                  </td>
                  <td style={{ color: "#6b7280" }}>
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>
                  <td>
                    <div className={styles.btnRow}>
                      <Link
                        href={`/admin/blog/editor?id=${post.id}`}
                        className={styles.btnOutline}
                        style={{ fontSize: "0.75rem", padding: "5px 12px" }}
                      >
                        Sửa
                      </Link>
                      <button
                        type="button"
                        className={styles.btnGhost}
                        onClick={() => handleDelete(post.id, post.title)}
                        style={{ color: "#ef4444", fontSize: "0.75rem", padding: "5px 12px" }}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
