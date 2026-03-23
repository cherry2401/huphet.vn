"use client";

import { useState } from "react";
import { trackFeatureClick } from "@/components/analytics/track";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      trackFeatureClick("/voucher", "voucher_copy");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* fallback: do nothing */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Sao chép mã"
      style={{
        marginLeft: "auto",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: 6,
        border: "none",
        background: "transparent",
        color: copied ? "#16a34a" : "#ea580c",
        cursor: "pointer",
        transition: "background 150ms ease",
      }}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
    </button>
  );
}
