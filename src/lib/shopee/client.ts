const SHOPEE_BASE_URL = "https://shopee.vn";

type FetchJsonOptions = {
  method?: "GET" | "POST";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
};

type ShopeeCookieMap = {
  csrftoken?: string;
};

function getExtraEnvHeaders() {
  const headers = new Headers();

  if (process.env.SHOPEE_AF_AC_ENC_DAT) {
    headers.set("af-ac-enc-dat", process.env.SHOPEE_AF_AC_ENC_DAT);
  }

  if (process.env.SHOPEE_AF_AC_ENC_SZ_TOKEN) {
    headers.set("af-ac-enc-sz-token", process.env.SHOPEE_AF_AC_ENC_SZ_TOKEN);
  }

  if (process.env.SHOPEE_X_SAP_RI) {
    headers.set("x-sap-ri", process.env.SHOPEE_X_SAP_RI);
  }

  if (process.env.SHOPEE_X_SAP_SEC) {
    headers.set("x-sap-sec", process.env.SHOPEE_X_SAP_SEC);
  }

  if (process.env.SHOPEE_X_SZ_SDK_VERSION) {
    headers.set("x-sz-sdk-version", process.env.SHOPEE_X_SZ_SDK_VERSION);
  }

  if (process.env.SHOPEE_X_SHOPEE_LANGUAGE) {
    headers.set("x-shopee-language", process.env.SHOPEE_X_SHOPEE_LANGUAGE);
  }

  if (process.env.SHOPEE_EXTRA_HEADERS_JSON) {
    try {
      const parsed = JSON.parse(process.env.SHOPEE_EXTRA_HEADERS_JSON) as Record<string, string>;
      for (const [key, value] of Object.entries(parsed)) {
        headers.set(key, value);
      }
    } catch {
      // Ignore invalid JSON so the app can keep falling back to mock data.
    }
  }

  return headers;
}

function buildUrl(path: string, query?: FetchJsonOptions["query"]) {
  const url = new URL(path, SHOPEE_BASE_URL);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

function parseShopeeCookies(cookieHeader: string | undefined): ShopeeCookieMap {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<ShopeeCookieMap>((accumulator, entry) => {
    const [name, ...rawValue] = entry.trim().split("=");
    if (!name || rawValue.length === 0) {
      return accumulator;
    }

    const value = rawValue.join("=");
    if (name === "csrftoken") {
      accumulator.csrftoken = value;
    }
    return accumulator;
  }, {});
}

export function getShopeeHeaders(extraHeaders?: HeadersInit): Headers {
  const cookie = process.env.SHOPEE_COOKIE;
  const cookies = parseShopeeCookies(cookie);
  const headers = new Headers({
    accept: "application/json, text/plain, */*",
    "accept-language": "vi-VN,vi;q=0.9,en;q=0.8",
    priority: "u=1, i",
    referer: "https://shopee.vn/m/shopee-sieu-re",
    "sec-ch-ua": '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    "x-api-source": "pc",
    "x-requested-with": "XMLHttpRequest",
  });

  if (cookie) {
    headers.set("cookie", cookie);
  }

  if (cookies.csrftoken) {
    headers.set("x-csrftoken", cookies.csrftoken);
  }

  getExtraEnvHeaders().forEach((value, key) => {
    headers.set(key, value);
  });

  if (extraHeaders) {
    const overrideHeaders = new Headers(extraHeaders);
    overrideHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
}

export async function fetchShopeeJson<T>(
  path: string,
  options: FetchJsonOptions = {},
): Promise<T> {
  const url = buildUrl(path, options.query);
  const method = options.method ?? "GET";
  const headers = getShopeeHeaders(options.headers);

  if (method === "POST" && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: options.cache ?? "no-store",
  });

  if (!response.ok) {
    throw new Error(`Shopee request failed: ${response.status} ${response.statusText} for ${url}`);
  }

  return (await response.json()) as T;
}

export function getShopeeDebugConfig() {
  return {
    hasCookie: Boolean(process.env.SHOPEE_COOKIE),
    hasProtectedHeaders:
      Boolean(process.env.SHOPEE_AF_AC_ENC_DAT) ||
      Boolean(process.env.SHOPEE_AF_AC_ENC_SZ_TOKEN) ||
      Boolean(process.env.SHOPEE_X_SAP_RI) ||
      Boolean(process.env.SHOPEE_X_SAP_SEC) ||
      Boolean(process.env.SHOPEE_EXTRA_HEADERS_JSON),
  };
}
