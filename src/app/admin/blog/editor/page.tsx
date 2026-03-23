"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import NextImage from "next/image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import styles from "./blog-editor.module.css";
import adminStyles from "../../admin.module.css";

type Category = { id: string; name: string; slug: string };

import type { EditorView } from "@tiptap/pm/view";

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function BlogEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [showCoverUrlInput, setShowCoverUrlInput] = useState(false);
  const [coverUrlInput, setCoverUrlInput] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({ HTMLAttributes: { class: "blog-image" } }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Bắt đầu viết bài..." }),
      Underline,
    ],
    content: "",
    editorProps: {
      handleDrop(view: EditorView, event: DragEvent) {
        const files = event.dataTransfer?.files;
        if (files?.length) {
          event.preventDefault();
          for (const file of Array.from(files)) {
            if (file.type.startsWith("image/")) {
              uploadFile(file).then((url) => {
                if (url) {
                  const { schema } = view.state;
                  const node = schema.nodes.image.create({ src: url });
                  const tr = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(tr);
                }
              });
            }
          }
          return true;
        }
        return false;
      },
      handlePaste(view: EditorView, event: ClipboardEvent) {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) {
                uploadFile(file).then((url) => {
                  if (url) {
                    const { schema } = view.state;
                    const node = schema.nodes.image.create({ src: url });
                    const tr = view.state.tr.replaceSelectionWith(node);
                    view.dispatch(tr);
                  }
                });
              }
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  // Fetch categories
  useEffect(() => {
    fetch("/api/blog/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
  }, []);

  // Load post if editing
  useEffect(() => {
    if (!editId) return;
    fetch(`/api/blog/posts/${editId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.post) {
          setTitle(d.post.title);
          setSlug(d.post.slug);
          setExcerpt(d.post.excerpt || "");
          setCoverImage(d.post.cover_image || "");
          setCategoryId(d.post.category_id || "");
          setStatus(d.post.status);
          setAutoSlug(false);
          editor?.commands.setContent(d.post.content || "");
        }
      });
  }, [editId, editor]);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (autoSlug) setSlug(toSlug(val));
  }

  async function uploadFile(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/blog/upload", { method: "POST", body: formData });
      const data = await res.json();
      return data.url ?? null;
    } catch {
      return null;
    }
  }

  async function handleUploadCover() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const url = await uploadFile(file);
        if (url) setCoverImage(url);
      }
    };
    input.click();
  }

  function handleInsertImageUrl() {
    const url = prompt("Nhập URL ảnh:");
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }

  function handleInsertImageUpload() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const url = await uploadFile(file);
        if (url) editor?.chain().focus().setImage({ src: url }).run();
      }
    };
    input.click();
  }

  function handleInsertLink() {
    const url = prompt("Nhập URL:");
    if (url) {
      editor?.chain().focus().setLink({ href: url, target: "_blank" }).run();
    }
  }

  const save = useCallback(async (publishStatus: "draft" | "published") => {
    if (!title || !slug || !editor) return;
    setSaving(true);

    const body = {
      title,
      slug,
      excerpt,
      content: editor.getHTML(),
      cover_image: coverImage || null,
      category_id: categoryId || null,
      status: publishStatus,
    };

    try {
      if (editId) {
        await fetch(`/api/blog/posts/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/blog/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      router.push("/admin/blog");
    } catch (err) {
      alert("Lỗi khi lưu: " + String(err));
    }
    setSaving(false);
  }, [title, slug, excerpt, coverImage, categoryId, editor, editId, router]);

  if (!editor) return null;

  return (
    <div className={styles.editorPage}>
      <div className={styles.editorHeader}>
        <h1>{editId ? "Sửa bài viết" : "Viết bài mới"}</h1>
        <div className={adminStyles.btnRow}>
          <button
            type="button"
            className={adminStyles.btnGhost}
            onClick={() => router.push("/admin/blog")}
          >
            ← Quay lại
          </button>
          <button
            type="button"
            className={adminStyles.btnOutline}
            onClick={() => save("draft")}
            disabled={saving}
          >
            💾 Lưu nháp
          </button>
          <button
            type="button"
            className={adminStyles.btnPrimary}
            onClick={() => save("published")}
            disabled={saving}
          >
            🚀 Xuất bản
          </button>
        </div>
      </div>

      <div className={styles.editorLayout}>
        {/* Main Editor */}
        <div className={styles.editorMain}>
          <input
            className={styles.titleInput}
            placeholder="Tiêu đề bài viết..."
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <button
              type="button"
              className={`${styles.toolbarBtn} ${editor.isActive("heading", { level: 1 }) ? styles.active : ""}`}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              title="Heading 1"
            >
              H1
            </button>
            <button
              type="button"
              className={`${styles.toolbarBtn} ${editor.isActive("heading", { level: 2 }) ? styles.active : ""}`}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              title="Heading 2"
            >
              H2
            </button>
            <button
              type="button"
              className={`${styles.toolbarBtn} ${editor.isActive("heading", { level: 3 }) ? styles.active : ""}`}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              title="Heading 3"
            >
              H3
            </button>
            <div className={styles.toolbarDivider} />
            <button
              type="button"
              className={`${styles.toolbarBtn} ${editor.isActive("bold") ? styles.active : ""}`}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              className={`${styles.toolbarBtn} ${editor.isActive("italic") ? styles.active : ""}`}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              className={`${styles.toolbarBtn} ${editor.isActive("underline") ? styles.active : ""}`}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Underline"
            >
              <u>U</u>
            </button>
            <button
              type="button"
              className={`${styles.toolbarBtn} ${editor.isActive("strike") ? styles.active : ""}`}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Strikethrough"
            >
              <s>S</s>
            </button>
            <div className={styles.toolbarDivider} />
            <button
              type="button"
              className={`${styles.toolbarBtn} ${editor.isActive("bulletList") ? styles.active : ""}`}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bullet List"
            >
              •
            </button>
            <button
              type="button"
              className={`${styles.toolbarBtn} ${editor.isActive("orderedList") ? styles.active : ""}`}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Ordered List"
            >
              1.
            </button>
            <button
              type="button"
              className={`${styles.toolbarBtn} ${editor.isActive("blockquote") ? styles.active : ""}`}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Quote"
            >
              &ldquo;
            </button>
            <button
              type="button"
              className={`${styles.toolbarBtn} ${editor.isActive("codeBlock") ? styles.active : ""}`}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              title="Code Block"
            >
              {"</>"}
            </button>
            <div className={styles.toolbarDivider} />
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={handleInsertLink}
              title="Insert Link"
            >
              🔗
            </button>
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={handleInsertImageUpload}
              title="Upload Image"
            >
              📷
            </button>
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={handleInsertImageUrl}
              title="Image URL"
            >
              🌐
            </button>
            <div className={styles.toolbarDivider} />
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Divider"
            >
              ─
            </button>
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={() => editor.chain().focus().undo().run()}
              title="Undo"
            >
              ↩
            </button>
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={() => editor.chain().focus().redo().run()}
              title="Redo"
            >
              ↪
            </button>
          </div>

          {/* Editor Content */}
          <div className={styles.editorContent}>
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.editorSidebar}>
          {/* Slug */}
          <div className={styles.sidebarCard}>
            <h3>Cài đặt bài viết</h3>
            <div className={styles.fieldGroup}>
              <div>
                <label className={styles.fieldLabel}>Slug (URL)</label>
                <input
                  className={styles.fieldInput}
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setAutoSlug(false);
                  }}
                  placeholder="url-bai-viet"
                />
              </div>
              <div>
                <label className={styles.fieldLabel}>Tóm tắt (SEO Description)</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Mô tả ngắn cho bài viết..."
                  rows={3}
                />
              </div>
              <div>
                <label className={styles.fieldLabel}>Danh mục</label>
                <select
                  className={styles.fieldSelect}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">— Chọn danh mục —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div className={styles.sidebarCard}>
            <h3>Ảnh bìa</h3>
            <div className={styles.coverPreview}>
              {coverImage ? (
                <NextImage src={coverImage} alt="Cover" width={400} height={200} unoptimized />
              ) : (
                "Chưa có ảnh bìa"
              )}
            </div>
            <div className={styles.coverActions}>
              <button type="button" className={adminStyles.btnOutline} onClick={handleUploadCover} style={{ fontSize: "0.75rem", padding: "5px 10px" }}>
                📁 Upload
              </button>
              <button
                type="button"
                className={adminStyles.btnGhost}
                onClick={() => setShowCoverUrlInput(!showCoverUrlInput)}
                style={{ fontSize: "0.75rem", padding: "5px 10px" }}
              >
                🌐 URL
              </button>
              {coverImage && (
                <button
                  type="button"
                  className={adminStyles.btnGhost}
                  onClick={() => setCoverImage("")}
                  style={{ fontSize: "0.75rem", padding: "5px 10px", color: "var(--danger)" }}
                >
                  ✕
                </button>
              )}
            </div>
            {showCoverUrlInput && (
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input
                  className={styles.fieldInput}
                  placeholder="Dán URL ảnh bìa..."
                  value={coverUrlInput}
                  onChange={(e) => setCoverUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && coverUrlInput.trim()) {
                      setCoverImage(coverUrlInput.trim());
                      setCoverUrlInput("");
                      setShowCoverUrlInput(false);
                    }
                  }}
                  style={{ fontSize: "0.75rem" }}
                  autoFocus
                />
                <button
                  type="button"
                  className={adminStyles.btnPrimary}
                  onClick={() => {
                    if (coverUrlInput.trim()) {
                      setCoverImage(coverUrlInput.trim());
                      setCoverUrlInput("");
                      setShowCoverUrlInput(false);
                    }
                  }}
                  style={{ fontSize: "0.72rem", padding: "4px 10px", whiteSpace: "nowrap" }}
                >
                  OK
                </button>
              </div>
            )}
          </div>

          {/* Status */}
          <div className={styles.sidebarCard}>
            <h3>Trạng thái</h3>
            <select
              className={styles.fieldSelect}
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            >
              <option value="draft">📝 Bản nháp</option>
              <option value="published">✅ Xuất bản</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
