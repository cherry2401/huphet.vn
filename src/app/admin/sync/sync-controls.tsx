"use client";

import { useState, useTransition } from "react";
import styles from "@/app/admin/admin.module.css";

type AdminSnapshot = {
  pageUrl: string;
  partnerPageUrl: string;
  cachePaths: {
    microsite: string;
    deals: string;
  };
  partnerCachePaths: {
    microsite: string;
    deals: string;
  };
  cacheBackend: {
    file: boolean;
    supabase: boolean;
    supabaseTable: string;
  };
  shopee: {
    hasCookie: boolean;
    hasProtectedHeaders: boolean;
  };
  cache: {
    micrositeGeneratedAt: string | null;
    dealsGeneratedAt: string | null;
    dealCount: number;
    collectionCount: number;
    voucherCollectionCount: number;
    flashSaleCount: number;
    latestDealSlot: string | null;
    dealSnapshots: Array<{
      slot: string;
      generatedAt: string;
      count: number;
      cacheKey: string;
    }>;
  };
  partner: {
    apiHealth: {
      endpoint: string;
      ok: boolean;
      status: number | null;
      latencyMs: number;
      checkedAt: string;
      error: string | null;
    };
    cacheGeneratedAt: string | null;
    dealCount: number;
    latestDealSlot: string | null;
    dealSnapshots: Array<{
      slot: string;
      generatedAt: string;
      count: number;
      cacheKey: string;
    }>;
    syncStatus: {
      pageUrl: string;
      generatedAt: string;
      updatedSlots: string[];
      dealCount: number;
      errors: string[];
      slotTabs: Array<{
        slot: string;
        label: string;
        sub: string;
      }>;
      slotResults: Array<{
        slot: string;
        ok: boolean;
        dealCount: number;
        error: string | null;
      }>;
      affiliate: {
        mode: "passthrough" | "template" | "http" | "mmp_pid" | "custom-link";
        rewritten: number;
        fallback: number;
        customLink?: {
          requested: number;
          converted: number;
          failed: number;
          mmpFallback: number;
          sessionStatus:
            | "ok"
            | "login_required"
            | "blocked"
            | "unexpected_page"
            | "transport_error";
          error: string | null;
          subIds: {
            sub_id1: string;
            sub_id2: string;
            sub_id3: string;
            sub_id4: string;
            sub_id5: string;
          };
        };
      };
    } | null;
    affiliateConfig: {
      affiliateId: string;
      customLinkApiUrl: string;
      subIds: {
        sub_id1: string;
        sub_id2: string;
        sub_id3: string;
        sub_id4: string;
        sub_id5: string;
      };
    };
  };
};

type Props = {
  initialData: AdminSnapshot;
};

export function SyncControls({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [message, setMessage] = useState<string | null>(null);
  const [testUrl, setTestUrl] = useState("https://shopee.vn/product/729641628/40352936667");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const normalizeUrlForMatch = (value: string) => {
    try {
      const url = new URL(value);
      url.hash = "";
      return url.toString();
    } catch {
      return value.trim();
    }
  };

  const refreshStatus = () => {
    startTransition(async () => {
      setMessage("Đang tải lại trạng thái...");
      const response = await fetch(`/api/internal/shopee/status?pageUrl=${data.pageUrl}`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as AdminSnapshot & { error?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "Không tải được trạng thái.");
        return;
      }

      setData(payload);
      setMessage("✓ Đã cập nhật trạng thái.");
    });
  };

  const runSync = () => {
    startTransition(async () => {
      setMessage("⏳ Đang sync Shopee cache...");
      const response = await fetch("/api/internal/shopee/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ pageUrl: data.pageUrl }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        errors?: string[];
      };

      if (!response.ok || payload.ok === false) {
        setMessage(payload.error ?? "Sync thất bại.");
        return;
      }

      setMessage(
        payload.errors?.length
          ? `⚠ Sync xong, nhưng còn ${payload.errors.length} lỗi.`
          : "✓ Sync xong.",
      );
      refreshStatus();
    });
  };

  const runPartnerSync = () => {
    startTransition(async () => {
      setMessage("⏳ Đang sync partner API...");
      const response = await fetch("/api/internal/partner/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ pageUrl: data.partnerPageUrl }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        errors?: string[];
      };

      if (!response.ok || payload.ok === false) {
        setMessage(payload.error ?? "Partner sync thất bại.");
        return;
      }

      setMessage(
        payload.errors?.length
          ? `⚠ Partner sync xong, còn ${payload.errors.length} slot lỗi.`
          : "✓ Partner sync xong.",
      );
      refreshStatus();
    });
  };

  const runCustomLinkTest = () => {
    startTransition(async () => {
      if (!testUrl.trim()) {
        setTestResult("Nhập URL sản phẩm trước khi test.");
        return;
      }

      setMessage("⏳ Đang test custom-link...");
      setTestResult(null);

      const response = await fetch("/api/internal/affiliate/custom-link", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          url: testUrl.trim(),
          sub_id1: data.partner.affiliateConfig.subIds.sub_id1,
          sub_id2: data.partner.affiliateConfig.subIds.sub_id2,
          sub_id3: data.partner.affiliateConfig.subIds.sub_id3,
          sub_id4: data.partner.affiliateConfig.subIds.sub_id4,
          sub_id5: data.partner.affiliateConfig.subIds.sub_id5,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        links?: Record<string, string>;
        failed?: string[];
        failCodes?: Record<string, string>;
        missingFields?: string[];
        sessionStatus?: string;
      };

      if (!response.ok) {
        setMessage("✗ Test custom-link thất bại.");
        setTestResult(
          payload.error ??
            `Không gọi được API custom-link.${payload.missingFields?.length ? ` Missing: ${payload.missingFields.join(", ")}` : ""}`,
        );
        return;
      }

      const inputUrl = testUrl.trim();
      const normalizedInput = normalizeUrlForMatch(inputUrl);
      const linkEntries = Object.entries(payload.links ?? {});
      const mappedDirect = payload.links?.[inputUrl];
      const mappedByNormalized = linkEntries.find(
        ([source]) => normalizeUrlForMatch(source) === normalizedInput,
      )?.[1];
      const mappedFallback = linkEntries[0]?.[1];
      const mapped = mappedDirect ?? mappedByNormalized ?? mappedFallback;

      if (mapped) {
        setMessage("✓ Test custom-link thành công.");
        setTestResult(
          `session=${payload.sessionStatus ?? "ok"} | sub_id1=${data.partner.affiliateConfig.subIds.sub_id1 || "-"} | ${mapped}`,
        );
      } else {
        setMessage("✗ Custom-link không trả về link.");
        const failCode =
          payload.failCodes?.[inputUrl] ??
          payload.failCodes?.[
            Object.keys(payload.failCodes ?? {}).find(
              (source) => normalizeUrlForMatch(source) === normalizedInput,
            ) ?? ""
          ];
        setTestResult(
          payload.error ??
            `session=${payload.sessionStatus ?? "unknown"} | failed=${payload.failed?.length ?? 0} | mapped=${linkEntries.length}${failCode ? ` | failCode=${failCode}` : ""}${payload.missingFields?.length ? ` | missing=${payload.missingFields.join(",")}` : ""}`,
        );
      }
    });
  };

  return (
    <div className={styles.controlsPanel}>
      {/* ── Header + Buttons ── */}
      <div className={styles.controlsHeader}>
        <span className={styles.controlsTitle}>Controls</span>
      </div>

      <div className={styles.btnRow}>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={runSync}
          disabled={isPending}
        >
          {isPending ? "Đang chạy..." : "Sync Shopee"}
        </button>
        <button
          type="button"
          className={styles.btnOutline}
          onClick={runPartnerSync}
          disabled={isPending}
        >
          {isPending ? "Đang chạy..." : "Sync Partner"}
        </button>
        <button
          type="button"
          className={styles.btnGhost}
          onClick={refreshStatus}
          disabled={isPending}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Status Message ── */}
      {message ? (
        <div className={styles.statusMessage}>{message}</div>
      ) : null}

      {/* ── Quick Stats ── */}
      <div className={styles.quickStats}>
        <span className={styles.quickStat}>
          Deals: <strong>{data.cache.dealCount}</strong>
        </span>
        <span className={styles.quickStat}>
          Partner: <strong>{data.partner.dealCount}</strong>
        </span>
        <span className={styles.quickStat}>
          Slots: <strong>{data.cache.dealSnapshots.length}</strong>
        </span>
        <span className={styles.quickStat}>
          Collections: <strong>{data.cache.collectionCount}</strong>
        </span>
        <span className={styles.quickStat}>
          Supabase: <strong>{data.cacheBackend.supabase ? "✓" : "✗"}</strong>
        </span>
      </div>

      {/* ── Test Custom Link ── */}
      <div className={styles.testSection}>
        <p className={styles.testLabel}>Test Custom Link</p>
        <div className={styles.testInputRow}>
          <input
            className={styles.testInput}
            value={testUrl}
            onChange={(event) => setTestUrl(event.target.value)}
            placeholder="https://shopee.vn/product/<shop>/<item>"
          />
          <button
            type="button"
            className={styles.btnOutline}
            onClick={runCustomLinkTest}
            disabled={isPending}
          >
            {isPending ? "..." : "Test"}
          </button>
        </div>
        {testResult ? (
          <div className={styles.testResult}>{testResult}</div>
        ) : null}
      </div>
    </div>
  );
}
