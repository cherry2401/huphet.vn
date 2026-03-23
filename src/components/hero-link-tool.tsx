"use client";

import { useState, useEffect, type FormEvent } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type LinkResult = {
  ok: boolean;
  error?: string;
  affiliateUrl?: string;
  shortUrl?: string | null;
};

export function HeroLinkTool({ className }: { className?: string }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [productUrl, setProductUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LinkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") setIsLoggedIn(true);
      else if (event === "SIGNED_OUT") setIsLoggedIn(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Don't show for guests or during SSR
  if (isLoggedIn !== true) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || !productUrl.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);
    setShowQr(false);

    try {
      const res = await fetch("/api/cashback/link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productUrl: productUrl.trim() }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        setError(payload.error ?? "Tạo link thất bại.");
        return;
      }
      setResult({ ok: true, affiliateUrl: payload.affiliateUrl });
    } catch {
      setError("Không gọi được API hoàn tiền.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      setProductUrl(text);
    } catch { /* ignore */ }
  }

  const displayUrl = result?.affiliateUrl;

  return (
    <div className={className}>
      <div className="heroLinkTool">
        <p className="heroLinkTitle">Mua sắm hoàn tiền</p>
        <p className="heroLinkSub">Dán link sản phẩm → nhận hoàn tiền đến 90% hoa hồng từ các sàn TMDT</p>

        <form onSubmit={handleSubmit} className="heroLinkForm">
          <div className="heroLinkInputWrap">
            <svg className="heroLinkIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <input
              type="url"
              className="heroLinkInput"
              value={productUrl}
              onChange={(e) => { setProductUrl(e.target.value); setResult(null); setError(null); }}
              placeholder="Dán link sản phẩm..."
              required
            />
            <button type="button" className="heroLinkPaste" onClick={handlePaste} title="Dán từ clipboard">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
          <button type="submit" className="heroLinkSubmit" disabled={loading}>
            {loading ? "Đang xử lý..." : <><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign: 'middle', marginRight: 6}}><path strokeOpacity="0" d="M0 0h24v24H0z" fill="none"/><path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6" /></svg>Lấy hoàn tiền</>}
          </button>
        </form>

        {error && <p className="heroLinkError">{error}</p>}

        {displayUrl && (
          <div className="heroLinkResult">
            <div className="heroLinkResultWrap">
              <input type="text" readOnly value={displayUrl} className="heroLinkResultInput" />
              <button type="button" className="heroLinkCopy" onClick={() => handleCopy(displayUrl)} title={copied ? "Đã copy" : "Copy link"}>
                {copied ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
              </button>
            </div>
            <div className="heroLinkBtnGroup">
              <button type="button" className="heroLinkQrBtn" onClick={() => setShowQr(true)} title="Quét QR">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="4" height="4" rx="0.5"/><line x1="22" y1="14" x2="22" y2="14.01"/><line x1="22" y1="22" x2="22" y2="22.01"/><line x1="18" y1="18" x2="18" y2="18.01"/><line x1="22" y1="18" x2="22" y2="18.01"/><line x1="18" y1="22" x2="18" y2="22.01"/></svg>
                <span style={{marginLeft: 4}}>QR</span>
              </button>
              <button type="button" className="heroLinkBuy" onClick={() => window.open(displayUrl, "_blank")}>
                Mua ngay
              </button>
            </div>
          </div>
        )}

        {/* QR Popup */}
        {showQr && displayUrl && (
          <div className="heroQrOverlay" onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains("heroQrOverlay")) setShowQr(false);
          }}>
            <div className="heroQrPopup">
              <button className="heroQrClose" onClick={() => setShowQr(false)}>✕</button>
              <p className="heroQrTitle">Quét mã QR để mua</p>
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(displayUrl)}`}
                alt="QR Code"
                width={200}
                height={200}
                className="heroQrImg"
                unoptimized
              />
              <p className="heroQrHint">Dùng camera điện thoại quét mã</p>
            </div>
          </div>
        )}

        <p className="heroLinkSupport">✦ Hỗ trợ: Shopee, Lazada, TikTok Shop và nhiều sàn khác</p>
      </div>

      <style jsx>{`
        .heroLinkTool {
          --btn-w: 160px;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 28px 32px;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          border: 1px solid var(--line);
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }
        .heroLinkTitle {
          font-weight: 800;
          font-size: 1.35rem;
          color: var(--text);
          margin-bottom: 4px;
          text-align: center;
        }
        .heroLinkSub {
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin-bottom: 16px;
          text-align: center;
        }
        .heroLinkForm {
          display: flex;
          gap: 10px;
          align-items: stretch;
        }
        .heroLinkInputWrap {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }
        .heroLinkIcon {
          position: absolute;
          left: 12px;
          color: var(--text-secondary);
          pointer-events: none;
        }
        .heroLinkInput {
          width: 100%;
          padding: 12px 40px 12px 38px;
          border: 1.5px solid var(--line);
          border-radius: 12px;
          font-size: 0.9rem;
          color: var(--text);
          background: var(--surface);
          outline: none;
          transition: border-color 180ms ease;
        }
        .heroLinkInput:focus {
          border-color: var(--brand);
          box-shadow: 0 0 0 3px var(--brand-soft);
        }
        .heroLinkPaste {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          padding: 4px;
          display: flex;
          transition: color 180ms;
        }
        .heroLinkPaste:hover {
          color: var(--brand);
        }
        .heroLinkSubmit {
          width: var(--btn-w);
          min-width: var(--btn-w);
          padding: 12px 0;
          border: none;
          border-radius: 12px;
          background: var(--brand-gradient);
          color: #fff;
          font-weight: 800;
          font-size: 0.9rem;
          cursor: pointer;
          white-space: nowrap;
          transition: all 200ms ease;
          box-shadow: 0 4px 16px rgba(238,77,45,0.25);
          text-align: center;
        }
        .heroLinkSubmit:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(238,77,45,0.35);
        }
        .heroLinkSubmit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .heroLinkError {
          margin-top: 10px;
          font-size: 0.82rem;
          color: #dc2626;
          text-align: center;
        }
        .heroLinkResult {
          margin-top: 12px;
          display: flex;
          gap: 10px;
          width: 100%;
          align-items: stretch;
        }
        .heroLinkResultWrap {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }
        .heroLinkResultInput {
          width: 100%;
          padding: 12px 40px 12px 14px;
          border: 1.5px solid #bbf7d0;
          background: #f0fdf4;
          border-radius: 12px;
          font-size: 0.9rem;
          color: #16a34a;
          outline: none;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }
        .heroLinkCopy {
          position: absolute;
          right: 8px;
          padding: 4px;
          border: none;
          border-radius: 6px;
          background: none;
          color: #16a34a;
          cursor: pointer;
          transition: color 180ms;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .heroLinkCopy:hover {
          color: #15803d;
        }
        .heroLinkBtnGroup {
          width: var(--btn-w);
          min-width: var(--btn-w);
          display: flex;
          gap: 6px;
        }
        .heroLinkBuy {
          flex: 1;
          padding: 12px 0;
          border: none;
          border-radius: 12px;
          background: #16a34a;
          color: #fff;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          white-space: nowrap;
          transition: all 180ms;
          box-shadow: 0 2px 8px rgba(22,163,74,0.2);
          text-align: center;
        }
        .heroLinkBuy:hover {
          background: #15803d;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(22,163,74,0.3);
        }
        .heroLinkQrBtn {
          flex: 1;
          padding: 12px 0;
          border: 1.5px solid #bbf7d0;
          border-radius: 12px;
          background: #f0fdf4;
          color: #16a34a;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          gap: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .heroLinkQrBtn:hover {
          background: #dcfce7;
          border-color: #86efac;
        }
        /* QR Popup */
        .heroQrOverlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }
        .heroQrPopup {
          background: #fff;
          border-radius: 20px;
          padding: 32px;
          text-align: center;
          position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          animation: qrFadeIn 200ms ease;
        }
        @keyframes qrFadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .heroQrClose {
          position: absolute;
          top: 12px;
          right: 16px;
          border: none;
          background: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: var(--text-secondary);
          padding: 4px 8px;
          border-radius: 8px;
          transition: background 180ms;
        }
        .heroQrClose:hover {
          background: var(--bg-hover);
        }
        .heroQrTitle {
          font-weight: 800;
          font-size: 1.1rem;
          margin-bottom: 16px;
          color: var(--text);
        }
        .heroQrImg {
          border-radius: 12px;
          border: 2px solid var(--line);
        }
        .heroQrHint {
          margin-top: 12px;
          font-size: 0.82rem;
          color: var(--text-secondary);
        }
        .heroLinkSupport {
          margin-top: 14px;
          font-size: 0.78rem;
          color: var(--text-secondary);
          text-align: center;
        }
        @media (max-width: 640px) {
          .heroLinkTool {
            padding: 20px 16px;
            border-radius: 16px;
            --btn-w: 120px;
          }
          .heroLinkForm {
            flex-direction: column;
          }
          .heroLinkSubmit {
            width: 100%;
          }
          .heroLinkResult {
            flex-direction: column;
          }
          .heroLinkBtnGroup {
            width: 100%;
          }
          .heroQrPopup {
            padding: 20px;
            border-radius: 16px;
            margin: 0 16px;
          }
          .heroQrImg {
            width: 150px;
            height: 150px;
          }
          .heroQrTitle {
            font-size: 0.95rem;
            margin-bottom: 12px;
          }
          .heroQrHint {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
