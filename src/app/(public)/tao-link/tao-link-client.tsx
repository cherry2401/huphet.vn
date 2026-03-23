"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import styles from "@/app/(public)/tao-link/page.module.css";

type LinkToolResponse = {
  ok: boolean;
  error?: string;
  affiliateUrl?: string;
  shortUrl?: string | null;
};

async function copyText(value: string) {
  if (!value) return false;
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }
  return false;
}

export function TaoLinkClient() {
  const [productUrl, setProductUrl] = useState("");
  const [subId1, setSubId1] = useState("huphet");
  const [shorten, setShorten] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LinkToolResponse | null>(null);
  const [copyState, setCopyState] = useState<"" | "affiliate" | "short">("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setCopyState("");

    try {
      const response = await fetch("/api/tools/shopee-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productUrl: productUrl.trim(),
          subId1: subId1.trim(),
          shorten,
        }),
      });

      const payload = (await response.json()) as LinkToolResponse;
      if (!response.ok || !payload.ok) {
        setResult(null);
        setError(payload.error ?? "Tạo link thất bại.");
        return;
      }

      setResult(payload);
    } catch {
      setResult(null);
      setError("Không gọi được API tạo link.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(value: string, type: "affiliate" | "short") {
    const copied = await copyText(value);
    setCopyState(copied ? type : "");
  }

  return (
    <div className={styles.clientWrapper}>
      <section className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="productUrl" className={styles.label}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Link sản phẩm Shopee
            </label>
            <div className={styles.inputGroup}>
              <input
                id="productUrl"
                type="url"
                required
                className={styles.input}
                value={productUrl}
                onChange={(event) => setProductUrl(event.target.value)}
                placeholder="Dán link Shopee vào đây..."
              />
              <button 
                type="button" 
                className={styles.pasteButton} 
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setProductUrl(text);
                  } catch (err) {
                    console.error("Failed to read clipboard", err);
                  }
                }}
                title="Dán từ Clipboard"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="subId1" className={styles.labelSub}>
              sub_id (Tùy chọn)
            </label>
            <input
              id="subId1"
              type="text"
              className={styles.inputSub}
              value={subId1}
              onChange={(event) => setSubId1(event.target.value)}
              placeholder="Ex: fb_group, tiktok_bio..."
            />
          </div>

          <div className={styles.actionsRow}>
            <label className={styles.checkboxWrap}>
              <input
                type="checkbox"
                checked={shorten}
                onChange={(event) => setShorten(event.target.checked)}
              />
              Tạo kèm link rút gọn
            </label>
          </div>

          <button 
            type="submit" 
            className={styles.submitButton} 
            disabled={loading}
          >
            {loading ? (
              "Đang tạo..."
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Tạo Link Shopee
              </>
            )}
          </button>
        </form>

        {error ? <p className={styles.error}>{error}</p> : null}

        {result?.ok && result.affiliateUrl ? (
          <div className={styles.result}>
            <div className={styles.resultRow}>
              <p className={styles.resultLabel}>Affiliate URL (Shopee)</p>
              <div className={styles.resultBox}>
                <p className={styles.resultValue}>{result.affiliateUrl}</p>
                <button
                  type="button"
                  className={styles.copyButton}
                  onClick={() => handleCopy(result.affiliateUrl ?? "", "affiliate")}
                >
                  {copyState === "affiliate" ? "Đã copy" : "Copy"}
                </button>
              </div>
            </div>

            {result.shortUrl ? (
              <div className={styles.resultRow}>
                <p className={styles.resultLabel}>Short URL</p>
                <div className={styles.resultBox}>
                  <p className={styles.resultValue}>{result.shortUrl}</p>
                  <button
                    type="button"
                    className={styles.copyButton}
                    onClick={() => handleCopy(result.shortUrl ?? "", "short")}
                  >
                    {copyState === "short" ? "Đã copy" : "Copy"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className={styles.instructionSection}>
        <div className={styles.instructionHeader}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" stroke="none"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4" stroke="white" strokeWidth="2" strokeLinecap="round"/><path d="M12 8h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
          <h3>Hướng dẫn</h3>
        </div>
        <ol className={styles.instructionList}>
          <li>Dán link sản phẩm từ <strong>Shopee</strong>.</li>
          <li>Nhấn <strong>Tạo Link</strong> → Copy link affiliate.</li>
          <li>Dán link dưới bình luận bài đăng này hoặc bài bất kỳ ở Facebook.</li>
          <li>Click vào link để mở Shopee sẽ nhận được mã.</li>
          <li>Link chứa voucher Facebook giảm 20-25%.</li>
        </ol>

        <a
          href="https://www.facebook.com/share/p/1KCBi4DmhH/"
          target="_blank"
          rel="noreferrer"
          className={styles.fbButton}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Đến bài đăng Facebook
        </a>

        <Image
          src="/images/voucher-fb.png"
          alt="Voucher Facebook giảm 25% - Giảm tối đa 250k"
          className={styles.voucherImage}
          width={600}
          height={300}
        />
      </section>
    </div>
  );
}
