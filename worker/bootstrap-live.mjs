import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

loadEnvFiles();

const pageUrl = process.argv[2] ?? process.env.WORKER_PAGE_URL ?? "shopee-sieu-re";
const profileDir =
  process.env.WORKER_PROFILE_DIR ??
  path.join(process.cwd(), ".worker", "profiles", pageUrl);
const browserChannel = process.env.WORKER_BROWSER_CHANNEL || "chrome";
const browserPath = process.env.WORKER_BROWSER_PATH || undefined;
const headless = process.env.WORKER_HEADLESS === "true";
const waitMs = Number(process.env.WORKER_WAIT_MS ?? "15000");
const loginTimeoutMs = Number(process.env.WORKER_LOGIN_TIMEOUT_MS ?? `${10 * 60 * 1000}`);
const diagnosticsDir = path.join(process.cwd(), "output", "worker-diagnostics");
const supabaseTable = process.env.SUPABASE_CACHE_TABLE || "site_cache";

function getLaunchOptions() {
  return {
    headless,
    channel: browserPath ? undefined : browserChannel,
    executablePath: browserPath,
    ignoreDefaultArgs: ["--enable-automation"],
    args: [
      "--disable-blink-features=AutomationControlled",
    ],
    viewport: {
      width: Number(process.env.WORKER_VIEWPORT_WIDTH ?? "1280"),
      height: Number(process.env.WORKER_VIEWPORT_HEIGHT ?? "900"),
    },
    locale: "vi-VN",
    timezoneId: process.env.WORKER_TIMEZONE ?? "Asia/Saigon",
    userAgent:
      process.env.WORKER_USER_AGENT ??
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  };
}

async function hardenContext(browserContext) {
  await browserContext.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
  });
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
);

function loadEnvFiles() {
  if (typeof process.loadEnvFile !== "function") {
    return;
  }

  for (const filename of [".env.local", ".env"]) {
    try {
      process.loadEnvFile(filename);
    } catch {}
  }
}

function parseProperties(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getPropertyValue(entries, key) {
  return entries.find((entry) => entry.key === key)?.value ?? null;
}

function normalizeText(value) {
  return typeof value === "string" ? value : "";
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function priceToNumber(value) {
  if (!value || typeof value !== "number") return 0;
  if (value > 100000000) return Math.round(value / 100000);
  return Math.round(value);
}

function getSlotForTimestamp(value) {
  const date = value ? new Date(value) : new Date();
  const hour = Number.isNaN(date.getTime()) ? new Date().getHours() : date.getHours();
  if (hour >= 20) return "2000";
  if (hour >= 15) return "1500";
  if (hour >= 12) return "1200";
  if (hour >= 9) return "0900";
  return "0000";
}

function dedupeBy(entries, getKey) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = getKey(entry);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseCookieHeader(cookieHeader) {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [name, ...valueParts] = entry.split("=");
      return {
        name,
        value: valueParts.join("="),
        domain: ".shopee.vn",
        path: "/",
      };
    })
    .filter((cookie) => cookie.name && cookie.value);
}

function buildProtectedHeaders(baseHeaders = {}) {
  return {
    ...baseHeaders,
    ...(process.env.SHOPEE_AF_AC_ENC_DAT ? { "af-ac-enc-dat": process.env.SHOPEE_AF_AC_ENC_DAT } : {}),
    ...(process.env.SHOPEE_AF_AC_ENC_SZ_TOKEN
      ? { "af-ac-enc-sz-token": process.env.SHOPEE_AF_AC_ENC_SZ_TOKEN }
      : {}),
    ...(process.env.SHOPEE_X_CSRFTOKEN ? { "x-csrftoken": process.env.SHOPEE_X_CSRFTOKEN } : {}),
    ...(process.env.SHOPEE_X_SAP_RI ? { "x-sap-ri": process.env.SHOPEE_X_SAP_RI } : {}),
    ...(process.env.SHOPEE_X_SAP_SEC ? { "x-sap-sec": process.env.SHOPEE_X_SAP_SEC } : {}),
    ...(process.env.SHOPEE_X_SZ_SDK_VERSION
      ? { "x-sz-sdk-version": process.env.SHOPEE_X_SZ_SDK_VERSION }
      : {}),
    ...(process.env.SHOPEE_X_SHOPEE_LANGUAGE
      ? { "x-shopee-language": process.env.SHOPEE_X_SHOPEE_LANGUAGE }
      : {}),
    ...(process.env.SHOPEE_COOKIE ? { cookie: process.env.SHOPEE_COOKIE } : {}),
  };
}

function isBlockedUrl(url) {
  return url.includes("/buyer/login") || url.includes("/verify/traffic") || url.includes("/verify/captcha");
}

function extractMicrositeSummary(pagebuilderPayload, pageUrlValue) {
  const components = pagebuilderPayload.layout?.component_list ?? [];
  const micrositeId = pagebuilderPayload.data?.meta?.page_id
    ? Number(pagebuilderPayload.data.meta.page_id)
    : null;
  const anchors = [];
  const productCollections = [];
  const voucherCollections = [];
  const flashSales = [];

  for (const component of components) {
    const properties = parseProperties(component.properties);
    const data = getPropertyValue(properties, "data");
    const style = getPropertyValue(properties, "style");
    const componentName = normalizeText(getPropertyValue(properties, "_componentName"));
    const hook = component.be_extend_info?.hook ?? null;

    if (component.biz_component_id === 71 && Array.isArray(data?.tabs)) {
      for (const tab of data.tabs) {
        anchors.push({
          label: normalizeText(tab.display_text),
          anchoredComponentIds: Array.isArray(tab.anchored_component_ids)
            ? tab.anchored_component_ids
            : [],
        });
      }
    }

    if (component.biz_component_id === 48 && data) {
      if (typeof data.collection_id === "number") {
        productCollections.push({
          feId: component.fe_id ?? "",
          componentName,
          collectionId: data.collection_id,
          hook,
        });
      }
      if (Array.isArray(data.multi_tabs)) {
        for (const tab of data.multi_tabs) {
          if (typeof tab.collection_id === "number") {
            productCollections.push({
              feId: component.fe_id ?? "",
              componentName: normalizeText(tab.tab_name) || componentName,
              collectionId: tab.collection_id,
              hook,
            });
          }
        }
      }
    }

    if (component.biz_component_id === 51 && typeof data?.voucher_collection_id === "string") {
      voucherCollections.push({
        componentId: component.id ?? 0,
        feId: component.fe_id ?? "",
        micrositeId,
        componentName,
        voucherCollectionId: data.voucher_collection_id,
        numberOfVouchersPerRow:
          typeof style?.number_of_vouchers_per_row === "number"
            ? style.number_of_vouchers_per_row
            : 1,
        hook,
      });
    }

    if (component.biz_component_id === 86) {
      flashSales.push({
        feId: component.fe_id ?? "",
        componentName,
        categoryId:
          typeof data?.flash_sale_session_tab?.global_fs_category_id === "number"
            ? data.flash_sale_session_tab.global_fs_category_id
            : null,
        redirectUrl: typeof style?.redirect_url === "string" ? style.redirect_url : null,
      });
    }
  }

  return {
    pageUrl: pageUrlValue,
    micrositeId,
    anchors,
    productCollections: dedupeBy(
      productCollections,
      (entry) => `${entry.collectionId}:${entry.componentName}`,
    ),
    voucherCollections: dedupeBy(
      voucherCollections,
      (entry) => `${entry.componentId}:${entry.voucherCollectionId}`,
    ),
    flashSales,
  };
}

function normalizeDealItems(collectionResponses, collectionMap) {
  const deals = [];
  for (const response of collectionResponses) {
    const collectionId = response.collectionId;
    const collection = collectionMap.get(collectionId);
    const collectionName = collection?.componentName ?? `Collection ${collectionId}`;
    const items = response.payload?.data?.items ?? [];
    for (const item of items) {
      if (!item?.itemid || !item?.shopid || !item?.name) continue;
      const salePrice = priceToNumber(item.item_price ?? item.price);
      const originalPrice = priceToNumber(item.price_before_discount ?? item.price);
      const discountPercent =
        originalPrice > salePrice && originalPrice > 0
          ? Math.max(0, Math.round(((originalPrice - salePrice) / originalPrice) * 100))
          : 0;
      deals.push({
        id: `shopee-${item.shopid}-${item.itemid}`,
        slug: `${slugify(item.name)}-${item.itemid}`,
        title: item.name,
        category: "tech",
        salePrice,
        originalPrice: originalPrice || salePrice,
        discountPercent,
        badge: collectionName,
        affiliateUrl:
          typeof item.url === "string" && item.url.length
            ? item.url
            : `https://shopee.vn/product/${item.shopid}/${item.itemid}`,
        source: `browser-worker:${collectionId}`,
      });
    }
  }

  return dedupeBy(
    deals.toSorted((left, right) => right.discountPercent - left.discountPercent),
    (entry) => entry.id,
  );
}

async function writeLocalCache(kind, data, slotKey, generatedAt) {
  const cacheRoot = path.join(process.cwd(), "output", "shopee", "cache");
  await mkdir(cacheRoot, { recursive: true });
  const payload = { generatedAt, pageUrl, data };
  const suffix = slotKey ? `-${slotKey}` : "";
  const filename = path.join(cacheRoot, `${kind}-${pageUrl}${suffix}.json`);
  await writeFile(filename, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function upsertCache(kind, data, slotKey, generatedAt) {
  const { error } = await supabase.from(supabaseTable).upsert(
    {
      cache_key: slotKey ? `${kind}:${pageUrl}:${slotKey}` : `${kind}:${pageUrl}`,
      kind,
      page_url: pageUrl,
      generated_at: generatedAt,
      payload: data,
    },
    { onConflict: "cache_key" },
  );
  if (error) throw new Error(`Supabase upsert failed for ${kind}: ${error.message}`);
}

async function writeDiagnostics(name, payload) {
  await mkdir(diagnosticsDir, { recursive: true });
  await writeFile(path.join(diagnosticsDir, `${name}.json`), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function waitForValidSession(page, sessionState) {
  const startedAt = Date.now();
  console.log(
    `Opened Shopee in a real browser window using profile: ${profileDir}\n` +
      "Complete login/challenge if needed. Bootstrap will continue automatically.\n",
  );

  while (Date.now() - startedAt < loginTimeoutMs) {
    if (sessionState.valid) {
      return;
    }

    await page.goto(`https://shopee.vn/m/${pageUrl}`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForTimeout(8000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.8));
    await page.waitForTimeout(5000);
  }

  throw new Error("Login helper timed out before a valid session was detected.");
}

async function main() {
  const browserContext = await chromium.launchPersistentContext(profileDir, getLaunchOptions());
  await hardenContext(browserContext);

  const cookies = parseCookieHeader(process.env.SHOPEE_COOKIE);
  if (cookies.length > 0) {
    await browserContext.addCookies(cookies);
  }

  const page = browserContext.pages()[0] ?? (await browserContext.newPage());
  const collectionResponses = [];
  const collectionDiagnostics = [];
  const sessionState = { valid: false };
  let pagebuilderPayload = null;

  await page.route("**/api/v4/collection/get_items**", async (route, request) => {
    await route.continue({ headers: buildProtectedHeaders(request.headers()) });
  });

  page.on("response", async (response) => {
    const url = response.url();
    try {
      if (url.includes("/api/v4/pagebuilder/get_csr_page")) {
        pagebuilderPayload = await response.json();
      }

      if (url.includes("/api/v4/collection/get_items")) {
        const parsedUrl = new URL(url);
        const collectionId = Number(parsedUrl.searchParams.get("collection_id"));
        const payload = await response.json();

        collectionDiagnostics.push({
          collectionId,
          status: response.status(),
          url,
          error: payload?.error ?? null,
        });

        const items = payload?.data?.items ?? [];
        if (Array.isArray(items) && items.length > 0) {
          sessionState.valid = true;
        }

        if (!collectionId || payload?.error === 90309999) {
          return;
        }

        collectionResponses.push({ collectionId, payload });
      }
    } catch {}
  });

  await page.goto(`https://shopee.vn/m/${pageUrl}`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.waitForTimeout(waitMs);

  if (!process.env.WORKER_SKIP_LOGIN) {
    await waitForValidSession(page, sessionState);
  }

  await page.goto(`https://shopee.vn/m/${pageUrl}`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.waitForTimeout(waitMs);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.8));
  await page.waitForTimeout(5000);

  if (!pagebuilderPayload) {
    throw new Error("Pagebuilder response was not captured.");
  }

  const microsite = extractMicrositeSummary(pagebuilderPayload, pageUrl);
  const blocked = isBlockedUrl(page.url());
  const collectionMap = new Map(
    microsite.productCollections.map((collection) => [collection.collectionId, collection]),
  );
  const deals = normalizeDealItems(collectionResponses, collectionMap);
  const generatedAt = new Date().toISOString();
  const slotKey = getSlotForTimestamp(generatedAt);
  const shouldWriteDeals = deals.length > 0 && !blocked;

  await Promise.all([
    writeLocalCache("microsite", microsite, undefined, generatedAt),
    upsertCache("microsite", microsite, undefined, generatedAt),
    ...(shouldWriteDeals
      ? [
          writeLocalCache("deals", deals, undefined, generatedAt),
          writeLocalCache("deals", deals, slotKey, generatedAt),
          upsertCache("deals", deals, undefined, generatedAt),
          upsertCache("deals", deals, slotKey, generatedAt),
        ]
      : []),
  ]);

  const diagnostics = {
    pageUrl,
    finalUrl: page.url(),
    blocked,
    title: await page.title(),
    collectionDiagnostics,
    collectionResponseCount: collectionResponses.length,
    dealCount: deals.length,
    shouldWriteDeals,
    generatedAt,
    slotKey,
  };
  await writeDiagnostics(`${pageUrl}-latest`, diagnostics);

  if (blocked || deals.length === 0) {
    await mkdir(diagnosticsDir, { recursive: true });
    await page.screenshot({
      path: path.join(diagnosticsDir, `${pageUrl}-${generatedAt.replace(/[:.]/g, "-")}.png`),
      fullPage: true,
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        pageUrl,
        profileDir,
        headless,
        slotKey,
        micrositeId: microsite.micrositeId,
        blocked,
        collectionResponses: dedupeBy(collectionResponses, (entry) => entry.collectionId).length,
        dealCount: deals.length,
        wroteDealsCache: shouldWriteDeals,
        voucherCollectionCount: microsite.voucherCollections.length,
      },
      null,
      2,
    ),
  );

  await browserContext.close();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
