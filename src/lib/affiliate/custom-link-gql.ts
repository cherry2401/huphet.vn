import "server-only";

type SubIdPayload = {
  sub_id1?: string;
  sub_id2?: string;
  sub_id3?: string;
  sub_id4?: string;
  sub_id5?: string;
};

type GqlEntry = {
  shortLink?: string | null;
  longLink?: string | null;
  failCode?: string | null;
};

type GqlResponse = {
  is_login?: boolean;
  error?: number;
  tracking_id?: string;
  data?: {
    batchCustomLink?: GqlEntry[];
  };
  errors?: Array<{ message?: string }>;
};

export type CustomLinkGqlResult = {
  ok: boolean;
  links: Record<string, string>;
  failed: string[];
  failCodes: Record<string, string>;
  processed: number;
  sessionStatus: "ok" | "login_required" | "blocked" | "unexpected_page" | "transport_error";
  error: string | null;
  missingFields?: string[];
};

function normalizeUrls(urls: string[]) {
  return [...new Set(urls)]
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    });
}

function getGqlEndpoint() {
  return process.env.AFFILIATE_GQL_URL ?? "https://affiliate.shopee.vn/api/v3/gql?q=batChCustomLink";
}

function parseExtraHeadersJson() {
  const raw = process.env.AFFILIATE_GQL_EXTRA_HEADERS_JSON;
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function buildHeaders() {
  const cookie = process.env.AFFILIATE_COOKIE ?? process.env.SHOPEE_COOKIE;
  const csrfFromCookie = cookie
    ?.split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("csrftoken="))
    ?.slice("csrftoken=".length);
  const csrfToken = csrfFromCookie || process.env.AFFILIATE_CSRF_TOKEN;

  const headers: Record<string, string> = {
    accept: "application/json, text/plain, */*",
    "accept-language": process.env.AFFILIATE_ACCEPT_LANGUAGE ?? "en-US,en;q=0.9",
    "content-type": "application/json; charset=UTF-8",
    "affiliate-program-type": process.env.AFFILIATE_PROGRAM_TYPE ?? "1",
    pragma: "no-cache",
    "cache-control": "no-cache",
    origin: process.env.AFFILIATE_ORIGIN ?? "https://affiliate.shopee.vn",
    ...(process.env.AFFILIATE_REFERRER
      ? { referer: process.env.AFFILIATE_REFERRER }
      : { referer: "https://affiliate.shopee.vn/offer/custom_link" }),
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    priority: process.env.AFFILIATE_PRIORITY_HEADER ?? "u=1, i",
    ...(process.env.AFFILIATE_USER_AGENT
      ? { "user-agent": process.env.AFFILIATE_USER_AGENT }
      : {}),
    ...(process.env.AFFILIATE_SEC_CH_UA ? { "sec-ch-ua": process.env.AFFILIATE_SEC_CH_UA } : {}),
    ...(process.env.AFFILIATE_SEC_CH_UA_MOBILE
      ? { "sec-ch-ua-mobile": process.env.AFFILIATE_SEC_CH_UA_MOBILE }
      : {}),
    ...(process.env.AFFILIATE_SEC_CH_UA_PLATFORM
      ? { "sec-ch-ua-platform": process.env.AFFILIATE_SEC_CH_UA_PLATFORM }
      : {}),
  };

  if (csrfToken) {
    headers["csrf-token"] = csrfToken;
    headers["x-csrftoken"] = csrfToken;
  }

  if (cookie) {
    headers.cookie = cookie;
  }

  const afDat = process.env.AFFILIATE_AF_AC_ENC_DAT ?? process.env.SHOPEE_AF_AC_ENC_DAT;
  if (afDat) {
    headers["af-ac-enc-dat"] = afDat;
  }

  const afToken =
    process.env.AFFILIATE_AF_AC_ENC_SZ_TOKEN ?? process.env.SHOPEE_AF_AC_ENC_SZ_TOKEN;
  if (afToken) {
    headers["af-ac-enc-sz-token"] = afToken;
  }

  const xSapRi = process.env.AFFILIATE_X_SAP_RI ?? process.env.SHOPEE_X_SAP_RI;
  if (xSapRi) {
    headers["x-sap-ri"] = xSapRi;
  }

  const xSapSec = process.env.AFFILIATE_X_SAP_SEC ?? process.env.SHOPEE_X_SAP_SEC;
  if (xSapSec) {
    headers["x-sap-sec"] = xSapSec;
  }

  const xSz = process.env.AFFILIATE_X_SZ_SDK_VERSION ?? process.env.SHOPEE_X_SZ_SDK_VERSION;
  if (xSz) {
    headers["x-sz-sdk-version"] = xSz;
  }

  return {
    ...headers,
    ...parseExtraHeadersJson(),
  };
}

function resolveMissingFields() {
  const cookie = process.env.AFFILIATE_COOKIE ?? process.env.SHOPEE_COOKIE;
  const csrfFromCookie = cookie
    ?.split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("csrftoken="))
    ?.slice("csrftoken=".length);

  const checks: Array<[string, string | undefined]> = [
    ["AFFILIATE_COOKIE", cookie],
    ["AFFILIATE_AF_AC_ENC_DAT", process.env.AFFILIATE_AF_AC_ENC_DAT ?? process.env.SHOPEE_AF_AC_ENC_DAT],
    [
      "AFFILIATE_AF_AC_ENC_SZ_TOKEN",
      process.env.AFFILIATE_AF_AC_ENC_SZ_TOKEN ?? process.env.SHOPEE_AF_AC_ENC_SZ_TOKEN,
    ],
    ["AFFILIATE_X_SAP_RI", process.env.AFFILIATE_X_SAP_RI ?? process.env.SHOPEE_X_SAP_RI],
    ["AFFILIATE_X_SAP_SEC", process.env.AFFILIATE_X_SAP_SEC ?? process.env.SHOPEE_X_SAP_SEC],
    ["AFFILIATE_CSRF_TOKEN(or csrftoken in cookie)", csrfFromCookie ?? process.env.AFFILIATE_CSRF_TOKEN],
  ];

  return checks
    .filter(([, value]) => !value || value.trim().length === 0)
    .map(([name]) => name);
}

function resolveSessionStatus(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("login") || lower.includes("unauthorized") || lower.includes("forbidden")) {
    return "login_required" as const;
  }
  if (lower.includes("anti-bot") || lower.includes("captcha") || lower.includes("verify/traffic")) {
    return "blocked" as const;
  }
  return "transport_error" as const;
}

export async function convertShopeeCustomLinksByGql(
  urls: string[],
  subIds?: SubIdPayload,
): Promise<CustomLinkGqlResult> {
  const input = normalizeUrls(urls);
  if (input.length === 0) {
    return {
      ok: true,
      links: {},
      failed: [],
      failCodes: {},
      processed: 0,
      sessionStatus: "ok",
      error: null,
      missingFields: [],
    };
  }

  const missingFields = resolveMissingFields();
  if (missingFields.length > 0) {
    return {
      ok: false,
      links: {},
      failed: input,
      failCodes: Object.fromEntries(input.map((url) => [url, "MISSING_FIELDS"])),
      processed: input.length,
      sessionStatus: "transport_error",
      error: `Missing required affiliate headers/env: ${missingFields.join(", ")}`,
      missingFields,
    };
  }

  const variables = {
    linkParams: input.map((originalLink) => ({
      originalLink,
      advancedLinkParams: {
        subId1: subIds?.sub_id1 ?? "",
        subId2: subIds?.sub_id2 ?? "",
        subId3: subIds?.sub_id3 ?? "",
        subId4: subIds?.sub_id4 ?? "",
        subId5: subIds?.sub_id5 ?? "",
      },
    })),
    sourceCaller: "CUSTOM_LINK_CALLER",
  };

  const payload = {
    operationName: "batchGetCustomLink",
    query:
      "query batchGetCustomLink($linkParams: [CustomLinkParam!], $sourceCaller: SourceCaller){ batchCustomLink(linkParams: $linkParams, sourceCaller: $sourceCaller){ shortLink longLink failCode } }",
    variables,
  };

  try {
    const response = await fetch(getGqlEndpoint(), {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.AFFILIATE_GQL_TIMEOUT_MS ?? 15000)),
    });

    const parsed = (await response.json()) as GqlResponse;

    if (parsed.error === 90309999) {
      return {
        ok: false,
        links: {},
        failed: input,
        failCodes: Object.fromEntries(input.map((url) => [url, "ANTI_BOT_90309999"])),
        processed: input.length,
        sessionStatus: "blocked",
        error: `Shopee anti-bot (tracking_id=${parsed.tracking_id ?? "n/a"})`,
        missingFields: [],
      };
    }

    if (parsed.is_login === false) {
      return {
        ok: false,
        links: {},
        failed: input,
        failCodes: Object.fromEntries(input.map((url) => [url, "LOGIN_REQUIRED"])),
        processed: input.length,
        sessionStatus: "login_required",
        error: "Affiliate session not logged in.",
        missingFields: [],
      };
    }

    if (!response.ok) {
      const message = parsed.errors?.[0]?.message ?? `HTTP ${response.status}`;
      return {
        ok: false,
        links: {},
        failed: input,
        failCodes: Object.fromEntries(input.map((url) => [url, "HTTP_ERROR"])),
        processed: input.length,
        sessionStatus: resolveSessionStatus(message),
        error: message,
        missingFields: [],
      };
    }

    const entries = parsed.data?.batchCustomLink ?? [];
    const links: Record<string, string> = {};
    const failed: string[] = [];
    const failCodes: Record<string, string> = {};

    for (let index = 0; index < input.length; index += 1) {
      const source = input[index];
      const entry = entries[index];
      const shortLink = entry?.shortLink?.trim();

      if (shortLink) {
        links[source] = shortLink;
      } else {
        failed.push(source);
        failCodes[source] = entry?.failCode ?? "NO_SHORT_LINK";
      }
    }

    return {
      ok: true,
      links,
      failed,
      failCodes,
      processed: input.length,
      sessionStatus: "ok",
      error: parsed.errors?.[0]?.message ?? null,
      missingFields: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "GQL request failed";
    return {
      ok: false,
      links: {},
      failed: input,
      failCodes: Object.fromEntries(input.map((url) => [url, "REQUEST_FAILED"])),
      processed: input.length,
      sessionStatus: resolveSessionStatus(message),
      error: message,
      missingFields: [],
    };
  }
}
