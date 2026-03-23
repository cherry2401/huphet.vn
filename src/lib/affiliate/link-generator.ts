import type { Deal } from "@/lib/types";

type GeneratorMode = "passthrough" | "template" | "http" | "mmp_pid" | "custom-link";

type LinkContext = {
  id: string;
  slug: string;
  title: string;
  affiliateId?: string;
  sub_id1?: string;
  sub_id2?: string;
  sub_id3?: string;
  sub_id4?: string;
  sub_id5?: string;
  shopId?: number;
  itemId?: number;
  productUrl?: string;
  currentAffiliateUrl: string;
};

type HttpGeneratorPayload = {
  affiliateUrl?: string;
  url?: string;
};

type CustomLinkPayload = {
  customLink?: string;
  shortLink?: string;
  affiliateUrl?: string;
  url?: string;
};

type CustomLinkBatchPayload = {
  ok?: boolean;
  links?: Record<string, string>;
  failed?: string[];
  sessionStatus?: "ok" | "login_required" | "blocked" | "unexpected_page";
  error?: string | null;
};

type ResolvedSubIds = {
  sub_id1: string;
  sub_id2: string;
  sub_id3: string;
  sub_id4: string;
  sub_id5: string;
};

type CustomLinkBatchResult = {
  links: Map<string, string>;
  requested: number;
  failed: number;
  sessionStatus: "ok" | "login_required" | "blocked" | "unexpected_page" | "transport_error";
  error: string | null;
};

function isValidHttpUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function getGeneratorMode(): GeneratorMode {
  const provider = (process.env.AFFILIATE_CUSTOM_LINK_PROVIDER ?? "").trim().toLowerCase();

  if (provider === "template") {
    return "template";
  }
  if (provider === "mmp_pid") {
    return "mmp_pid";
  }
  if (provider === "passthrough") {
    return "passthrough";
  }
  if (provider === "http") {
    return "http";
  }
  if (provider === "gql" || provider === "browser-gql" || provider === "auto") {
    return "custom-link";
  }

  if (process.env.AFFILIATE_CUSTOM_LINK_API_URL) {
    return "custom-link";
  }

  if (process.env.AFFILIATE_LINK_GENERATOR_URL) {
    return "http";
  }

  if (process.env.AFFILIATE_LINK_TEMPLATE) {
    return "template";
  }

  if (process.env.AFFILIATE_ID) {
    return "mmp_pid";
  }

  return "passthrough";
}

function tryParseUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function resolveShopeeProductUrl(context: LinkContext) {
  const productUrl = tryParseUrl(context.productUrl);
  if (productUrl) {
    return productUrl;
  }

  const current = tryParseUrl(context.currentAffiliateUrl);
  if (!current) {
    return null;
  }

  const embeddedUrl = current.searchParams.get("url");
  const parsedEmbedded = tryParseUrl(embeddedUrl ?? undefined);
  if (parsedEmbedded) {
    return parsedEmbedded;
  }

  return current;
}

function buildMmpPidUrl(context: LinkContext) {
  const affiliateId = context.affiliateId?.trim();
  if (!affiliateId) {
    return null;
  }

  const shopeeUrl = resolveShopeeProductUrl(context);
  if (!shopeeUrl) {
    return null;
  }

  shopeeUrl.searchParams.set("mmp_pid", `an_${affiliateId}`);
  return shopeeUrl.toString();
}

function buildTemplateUrl(context: LinkContext) {
  const template = process.env.AFFILIATE_LINK_TEMPLATE;
  if (!template) {
    return null;
  }

  const resolved = template
    .replaceAll("{{id}}", context.id)
    .replaceAll("{{slug}}", context.slug)
    .replaceAll("{{title}}", encodeURIComponent(context.title))
    .replaceAll("{{affiliateId}}", context.affiliateId ?? "")
    .replaceAll("{{sub_id1}}", context.sub_id1 ?? "")
    .replaceAll("{{sub_id2}}", context.sub_id2 ?? "")
    .replaceAll("{{sub_id3}}", context.sub_id3 ?? "")
    .replaceAll("{{sub_id4}}", context.sub_id4 ?? "")
    .replaceAll("{{sub_id5}}", context.sub_id5 ?? "")
    .replaceAll("{{shopId}}", context.shopId ? String(context.shopId) : "")
    .replaceAll("{{itemId}}", context.itemId ? String(context.itemId) : "")
    .replaceAll("{{productUrl}}", context.productUrl ?? "")
    .replaceAll("{{encodedProductUrl}}", encodeURIComponent(context.productUrl ?? ""))
    .replaceAll("{{currentAffiliateUrl}}", context.currentAffiliateUrl)
    .replaceAll("{{encodedCurrentAffiliateUrl}}", encodeURIComponent(context.currentAffiliateUrl));

  return isValidHttpUrl(resolved) ? resolved : null;
}

async function fetchGeneratedUrl(context: LinkContext) {
  const endpoint = process.env.AFFILIATE_LINK_GENERATOR_URL;
  if (!endpoint) {
    return null;
  }

  try {
    const timeoutMs = Number(process.env.AFFILIATE_LINK_GENERATOR_TIMEOUT_MS ?? 6000);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.AFFILIATE_LINK_GENERATOR_BEARER_TOKEN
          ? { authorization: `Bearer ${process.env.AFFILIATE_LINK_GENERATOR_BEARER_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(context),
      signal: AbortSignal.timeout(Number.isFinite(timeoutMs) ? timeoutMs : 6000),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as HttpGeneratorPayload;
    const generated = payload.affiliateUrl ?? payload.url;
    return isValidHttpUrl(generated) ? generated : null;
  } catch {
    return null;
  }
}

function resolveSubIds(): ResolvedSubIds {
  return {
    sub_id1: process.env.AFFILIATE_SUB_ID1 ?? "",
    sub_id2: process.env.AFFILIATE_SUB_ID2 ?? "",
    sub_id3: process.env.AFFILIATE_SUB_ID3 ?? "",
    sub_id4: process.env.AFFILIATE_SUB_ID4 ?? "",
    sub_id5: process.env.AFFILIATE_SUB_ID5 ?? "",
  };
}

async function fetchCustomLinkUrl(context: LinkContext) {
  const endpoint = process.env.AFFILIATE_CUSTOM_LINK_API_URL;
  if (!endpoint) {
    return null;
  }

  const sourceUrl = context.productUrl ?? context.currentAffiliateUrl;
  if (!isValidHttpUrl(sourceUrl)) {
    return null;
  }

  try {
    const timeoutMs = Number(process.env.AFFILIATE_CUSTOM_LINK_TIMEOUT_MS ?? 9000);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.AFFILIATE_CUSTOM_LINK_BEARER_TOKEN
          ? { authorization: `Bearer ${process.env.AFFILIATE_CUSTOM_LINK_BEARER_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        url: sourceUrl,
        affiliateId: context.affiliateId ?? "",
        ...resolveSubIds(),
        meta: {
          id: context.id,
          slug: context.slug,
          title: context.title,
          shopId: context.shopId,
          itemId: context.itemId,
        },
      }),
      signal: AbortSignal.timeout(Number.isFinite(timeoutMs) ? timeoutMs : 9000),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as CustomLinkPayload;
    const generated =
      payload.customLink ?? payload.shortLink ?? payload.affiliateUrl ?? payload.url;
    return isValidHttpUrl(generated) ? generated : null;
  } catch {
    return null;
  }
}

function getSourceUrlForCustomLink(context: LinkContext) {
  const parsed = resolveShopeeProductUrl(context);
  return parsed?.toString() ?? null;
}

async function fetchCustomLinkBatch(contexts: LinkContext[]): Promise<CustomLinkBatchResult> {
  const endpoint = process.env.AFFILIATE_CUSTOM_LINK_API_URL;
  if (!endpoint) {
    return {
      links: new Map<string, string>(),
      requested: 0,
      failed: 0,
      sessionStatus: "transport_error",
      error: "AFFILIATE_CUSTOM_LINK_API_URL is missing",
    };
  }

  const uniqueUrls = [...new Set(contexts.map((context) => getSourceUrlForCustomLink(context)).filter(Boolean))];
  if (uniqueUrls.length === 0) {
    return {
      links: new Map<string, string>(),
      requested: 0,
      failed: 0,
      sessionStatus: "ok",
      error: null,
    };
  }

  const subIds = resolveSubIds();
  try {
    const timeoutMs = Number(process.env.AFFILIATE_CUSTOM_LINK_TIMEOUT_MS ?? 120000);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.AFFILIATE_CUSTOM_LINK_BEARER_TOKEN
          ? { authorization: `Bearer ${process.env.AFFILIATE_CUSTOM_LINK_BEARER_TOKEN}` }
          : {}),
        ...(process.env.INTERNAL_API_KEY
          ? { "x-api-key": process.env.INTERNAL_API_KEY }
          : {}),
      },
      body: JSON.stringify({
        urls: uniqueUrls,
        affiliateId: process.env.AFFILIATE_ID ?? "",
        ...subIds,
      }),
      signal: AbortSignal.timeout(Number.isFinite(timeoutMs) ? timeoutMs : 120000),
      cache: "no-store",
    });

    const payload = (await response.json()) as CustomLinkBatchPayload;
    const links = payload.links ?? {};
    const mapped = new Map<string, string>();

    for (const [source, target] of Object.entries(links)) {
      if (isValidHttpUrl(source) && isValidHttpUrl(target)) {
        mapped.set(source, target);
      }
    }

    const failedFromPayload = Array.isArray(payload.failed) ? payload.failed.length : 0;
    const computedFailed = Math.max(uniqueUrls.length - mapped.size, 0);

    return {
      links: mapped,
      requested: uniqueUrls.length,
      failed: Math.max(failedFromPayload, computedFailed),
      sessionStatus: payload.sessionStatus ?? (response.ok ? "ok" : "transport_error"),
      error: payload.error ?? (response.ok ? null : `HTTP ${response.status}`),
    };
  } catch {
    return {
      links: new Map<string, string>(),
      requested: uniqueUrls.length,
      failed: uniqueUrls.length,
      sessionStatus: "transport_error",
      error: "Custom-link API request failed",
    };
  }
}

async function resolveAffiliateUrl(context: LinkContext): Promise<string> {
  const mode = getGeneratorMode();

  if (mode === "template") {
    return buildTemplateUrl(context) ?? context.currentAffiliateUrl;
  }

  if (mode === "http") {
    const generated = await fetchGeneratedUrl(context);
    if (generated) {
      return generated;
    }

    // Fallback to template when HTTP generator is configured but temporarily unavailable.
    return buildTemplateUrl(context) ?? context.currentAffiliateUrl;
  }

  if (mode === "custom-link") {
    const generated = await fetchCustomLinkUrl(context);
    if (generated) {
      return generated;
    }

    return buildMmpPidUrl(context) ?? context.currentAffiliateUrl;
  }

  if (mode === "mmp_pid") {
    return buildMmpPidUrl(context) ?? context.currentAffiliateUrl;
  }

  return context.currentAffiliateUrl;
}

export type AffiliateRewriteStats = {
  mode: GeneratorMode;
  rewritten: number;
  fallback: number;
  customLink?: {
    requested: number;
    converted: number;
    failed: number;
    mmpFallback: number;
    sessionStatus: "ok" | "login_required" | "blocked" | "unexpected_page" | "transport_error";
    error: string | null;
    subIds: ResolvedSubIds;
  };
};

export async function rewriteDealsWithAffiliateLinks(deals: Deal[]) {
  const mode = getGeneratorMode();
  let rewritten = 0;
  let fallback = 0;

  const contexts = deals.map((deal) => {
    const currentAffiliateUrl = isValidHttpUrl(deal.affiliateUrl)
      ? deal.affiliateUrl
      : deal.productUrl ?? "";

    return {
      deal,
      context: {
        id: deal.id,
        slug: deal.slug,
        title: deal.title,
        affiliateId: process.env.AFFILIATE_ID,
        sub_id1: process.env.AFFILIATE_SUB_ID1,
        sub_id2: process.env.AFFILIATE_SUB_ID2,
        sub_id3: process.env.AFFILIATE_SUB_ID3,
        sub_id4: process.env.AFFILIATE_SUB_ID4,
        sub_id5: process.env.AFFILIATE_SUB_ID5,
        shopId: deal.shopId,
        itemId: deal.itemId,
        productUrl: deal.productUrl,
        currentAffiliateUrl,
      } satisfies LinkContext,
    };
  });

  if (mode === "custom-link") {
    const batch = await fetchCustomLinkBatch(contexts.map((entry) => entry.context));
    const mappedLinks = batch.links;
    const subIds = resolveSubIds();
    let converted = 0;
    let mmpFallback = 0;

    const rewrittenDeals = contexts.map(({ deal, context }) => {
      const sourceUrl = getSourceUrlForCustomLink(context);
      const customLink = sourceUrl ? mappedLinks.get(sourceUrl) : undefined;
      if (customLink) {
        converted += 1;
      }
      const mmpCandidate = buildMmpPidUrl(context);
      if (!customLink && mmpCandidate) {
        mmpFallback += 1;
      }
      const nextAffiliateUrl =
        customLink ??
        mmpCandidate ??
        context.currentAffiliateUrl ??
        deal.affiliateUrl;

      if (nextAffiliateUrl && nextAffiliateUrl !== deal.affiliateUrl) {
        rewritten += 1;
      } else {
        fallback += 1;
      }

      return {
        ...deal,
        affiliateUrl: nextAffiliateUrl || deal.affiliateUrl,
      };
    });

    return {
      deals: rewrittenDeals,
      stats: {
        mode,
        rewritten,
        fallback,
        customLink: {
          requested: batch.requested,
          converted,
          failed: batch.failed,
          mmpFallback,
          sessionStatus: batch.sessionStatus,
          error: batch.error,
          subIds,
        },
      } satisfies AffiliateRewriteStats,
    };
  }

  const rewrittenDeals = await Promise.all(
    contexts.map(async ({ deal, context }) => {
      const nextAffiliateUrl = await resolveAffiliateUrl(context);
      if (nextAffiliateUrl && nextAffiliateUrl !== deal.affiliateUrl) {
        rewritten += 1;
      } else {
        fallback += 1;
      }

      return {
        ...deal,
        affiliateUrl: nextAffiliateUrl || deal.affiliateUrl,
      };
    }),
  );

  return {
    deals: rewrittenDeals,
    stats: {
      mode,
      rewritten,
      fallback,
    } satisfies AffiliateRewriteStats,
  };
}
