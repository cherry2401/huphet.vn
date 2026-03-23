"use client";

import { useState, useEffect } from "react";
import styles from "../../admin.module.css";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
};

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", sort_order: 0 });
  const [saving, setSaving] = useState(false);

  async function fetchCategories() {
    setLoading(true);
    const res = await fetch("/api/blog/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchCategories(); }, []);

  function toSlug(str: string) {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: editing ? f.slug : toSlug(name) }));
  }

  function startEdit(cat: Category) {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || "", sort_order: cat.sort_order });
  }

  function resetForm() {
    setEditing(null);
    setForm({ name: "", slug: "", description: "", sort_order: 0 });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.slug) return;
    setSaving(true);

    if (editing) {
      await fetch("/api/blog/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
    } else {
      await fetch("/api/blog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    resetForm();
    setSaving(false);
    fetchCategories();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xóa danh mục "${name}"?`)) return;
    await fetch(`/api/blog/categories?id=${id}`, { method: "DELETE" });
    fetchCategories();
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerInfo}>
            <p className={styles.eyebrow}>Blog</p>
            <h1>Quản lý danh mục</h1>
            <p className={styles.headerSub}>Tạo và sắp xếp danh mục cho blog.</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className={styles.controlsPanel}>
        <p className={styles.controlsTitle}>{editing ? "Sửa danh mục" : "Thêm danh mục mới"}</p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              className={styles.testInput}
              placeholder="Tên danh mục"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
            <input
              className={styles.testInput}
              placeholder="Slug (URL)"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              required
            />
            <input
              className={styles.testInput}
              placeholder="Thứ tự"
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
              style={{ maxWidth: 80 }}
            />
          </div>
          <input
            className={styles.testInput}
            placeholder="Mô tả (tùy chọn)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className={styles.btnRow}>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm"}
            </button>
            {editing && (
              <button type="button" className={styles.btnGhost} onClick={resetForm}>Hủy</button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}><p>Đang tải...</p></div>
        ) : categories.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📂</div>
            <strong>Chưa có danh mục</strong>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Slug</th>
                <th>Mô tả</th>
                <th>Thứ tự</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td><strong>{cat.name}</strong></td>
                  <td><code>{cat.slug}</code></td>
                  <td>{cat.description || "—"}</td>
                  <td>{cat.sort_order}</td>
                  <td>
                    <div className={styles.btnRow}>
                      <button type="button" className={styles.btnGhost} onClick={() => startEdit(cat)}>Sửa</button>
                      <button
                        type="button"
                        className={styles.btnGhost}
                        style={{ color: "var(--danger)" }}
                        onClick={() => handleDelete(cat.id, cat.name)}
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
