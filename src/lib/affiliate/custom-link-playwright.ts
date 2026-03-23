import "server-only";
import path from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";

type SubIdPayload = {
  sub_id1?: string;
  sub_id2?: string;
  sub_id3?: string;
  sub_id4?: string;
  sub_id5?: string;
};

export type CustomLinkConvertInput = {
  urls: string[];
  subIds?: SubIdPayload;
};

export type CustomLinkConvertResult = {
  links: Record<string, string>;
  failed: string[];
  processed: number;
  sessionStatus: "ok" | "login_required" | "blocked" | "unexpected_page";
  error: string | null;
};

const CUSTOM_LINK_PAGE = "https://affiliate.shopee.vn/offer/custom_link";
const CUSTOM_LINK_GQL_ENDPOINT = "https://affiliate.shopee.vn/api/v3/gql?q=batChCustomLink";

function isValidHttpUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getLaunchOptions() {
  const browserPath = process.env.WORKER_BROWSER_PATH || undefined;
  const channel = process.env.WORKER_BROWSER_CHANNEL || "chrome";
  const headless = process.env.AFFILIATE_CUSTOM_LINK_HEADLESS
    ? process.env.AFFILIATE_CUSTOM_LINK_HEADLESS !== "false"
    : process.env.WORKER_HEADLESS !== "false";

  return {
    headless,
    channel: browserPath ? undefined : channel,
    executablePath: browserPath,
    chromiumSandbox: process.env.AFFILIATE_CHROMIUM_SANDBOX !== "false",
    ignoreDefaultArgs: ["--enable-automation"],
    args: ["--disable-blink-features=AutomationControlled"],
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

function getProfileDir() {
  if (process.env.AFFILIATE_WORKER_PROFILE_DIR) {
    return process.env.AFFILIATE_WORKER_PROFILE_DIR;
  }

  if (process.env.WORKER_PROFILE_DIR) {
    return process.env.WORKER_PROFILE_DIR;
  }

  return path.join(process.cwd(), ".worker", "profiles", "affiliate-shopee");
}

async function hardenContext(context: BrowserContext) {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
  });
}

async function openAffiliateSession() {
  const cdpEndpoint = process.env.AFFILIATE_CDP_ENDPOINT;

  if (cdpEndpoint) {
    const browser = await chromium.connectOverCDP(cdpEndpoint);
    const context = browser.contexts()[0];
    if (!context) {
      await browser.close();
      throw new Error("No browser context found via CDP endpoint.");
    }
    const page = context.pages()[0] ?? (await context.newPage());
    return {
      page,
      close: async () => {
        await browser.close();
      },
    };
  }

  const profileDir = getProfileDir();
  const context = await chromium.launchPersistentContext(profileDir, getLaunchOptions());
  await hardenContext(context);
  const page = context.pages()[0] ?? (await context.newPage());
  return {
    page,
    close: async () => {
      await context.close();
    },
  };
}

function chunk<T>(input: T[], size: number) {
  const grouped: T[][] = [];
  for (let index = 0; index < input.length; index += size) {
    grouped.push(input.slice(index, index + size));
  }
  return grouped;
}

async function setSubId(page: Page, key: string, value: string) {
  if (!value) {
    return;
  }

  await page.evaluate(
    ({ label, inputValue }) => {
      const nodes = [...document.querySelectorAll("body *")];
      const labelNode = nodes.find((node) => node.textContent?.trim() === label);
      if (!labelNode) {
        return;
      }

      let input: HTMLInputElement | null = null;

      const labelParent = labelNode.parentElement;
      if (labelParent) {
        input = labelParent.querySelector("input");
      }

      if (!input && labelParent?.nextElementSibling) {
        input = labelParent.nextElementSibling.querySelector("input");
      }

      if (!input) {
        const near = labelNode.closest("div");
        input = near?.querySelector("input") ?? null;
      }

      if (!input) {
        return;
      }

      input.value = inputValue;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    },
    { label: key, inputValue: value },
  );
}

function extractUrls(raw: string) {
  const matches = raw.match(/https?:\/\/s\.shopee\.vn\/[^\s"']+/g);
  return matches ?? [];
}

async function readGeneratedLinks(page: Page) {
  const raw = await page.evaluate(() => {
    const candidates = [
      ...document.querySelectorAll("textarea"),
      ...document.querySelectorAll("input"),
    ] as Array<HTMLTextAreaElement | HTMLInputElement>;

    for (const node of candidates) {
      if (!node.value) {
        continue;
      }
      if (node.value.includes("s.shopee.vn/")) {
        return node.value;
      }
    }

    return document.body.innerText;
  });

  return extractUrls(raw);
}

async function convertBatch(page: Page, urls: string[], subIds: SubIdPayload) {
  const directTab = page.getByText(/Chuyển đổi liên kết/i).first();
  if ((await directTab.count()) > 0) {
    await directTab.click().catch(() => undefined);
  }

  const input = page.locator("textarea").first();
  await input.waitFor({ state: "visible", timeout: 20000 });
  await input.fill(urls.join("\n"));

  await setSubId(page, "Sub_id1", subIds.sub_id1 ?? "");
  await setSubId(page, "Sub_id2", subIds.sub_id2 ?? "");
  await setSubId(page, "Sub_id3", subIds.sub_id3 ?? "");
  await setSubId(page, "Sub_id4", subIds.sub_id4 ?? "");
  await setSubId(page, "Sub_id5", subIds.sub_id5 ?? "");

  const convertButton = page.getByRole("button", { name: /Lấy link|Lay link|Get link/i }).first();
  if ((await convertButton.count()) > 0) {
    await convertButton.click({ timeout: 15000 }).catch(() => undefined);
  }

  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")] as HTMLButtonElement[];
    const found = buttons.find((button) => {
      const text = (button.textContent ?? "").trim().toLowerCase();
      return text.includes("lấy link") || text.includes("lay link") || text.includes("get link");
    });
    found?.click();
  });
  await page.getByText(/Link của Custom Link/i).first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(1200);

  const generated = await readGeneratedLinks(page);

  await page.keyboard.press("Escape").catch(() => undefined);
  await page.waitForTimeout(200);

  return generated;
}

export async function convertShopeeCustomLinks(
  input: CustomLinkConvertInput,
): Promise<CustomLinkConvertResult> {
  const limit = Number(process.env.AFFILIATE_CUSTOM_LINK_MAX_URLS ?? "40");
  const uniqueUrls = [...new Set(input.urls.filter(isValidHttpUrl))].slice(
    0,
    Number.isFinite(limit) ? limit : 40,
  );

  if (uniqueUrls.length === 0) {
    return {
      links: {},
      failed: [],
      processed: 0,
      sessionStatus: "ok",
      error: null,
    };
  }

  const session = await openAffiliateSession();
  try {
    const page = session.page;
    await page.goto(CUSTOM_LINK_PAGE, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });

    const currentUrl = page.url();
    if (currentUrl.includes("/buyer/login") || currentUrl.includes("/login")) {
      return {
        links: {},
        failed: uniqueUrls,
        processed: uniqueUrls.length,
        sessionStatus: "login_required",
        error: "Affiliate session not logged in.",
      };
    }

    if (currentUrl.includes("/verify/traffic")) {
      return {
        links: {},
        failed: uniqueUrls,
        processed: uniqueUrls.length,
        sessionStatus: "blocked",
        error: "Shopee anti-bot challenge detected.",
      };
    }

    if (!currentUrl.includes("/offer/custom_link")) {
      return {
        links: {},
        failed: uniqueUrls,
        processed: uniqueUrls.length,
        sessionStatus: "unexpected_page",
        error: `Unexpected affiliate page: ${currentUrl}`,
      };
    }

    const links: Record<string, string> = {};
    const failed: string[] = [];
    const groups = chunk(uniqueUrls, 5);

    for (const group of groups) {
      const generated = await convertBatch(page, group, input.subIds ?? {});
      for (let index = 0; index < group.length; index += 1) {
        const source = group[index];
        const target = generated[index];
        if (target && isValidHttpUrl(target)) {
          links[source] = target;
        } else {
          failed.push(source);
        }
      }
    }

    return {
      links,
      failed,
      processed: uniqueUrls.length,
      sessionStatus: "ok",
      error: null,
    };
  } finally {
    await session.close();
  }
}

type BrowserGqlResult = {
  ok: boolean;
  links: Record<string, string>;
  failed: string[];
  failCodes: Record<string, string>;
  processed: number;
  sessionStatus: "ok" | "login_required" | "blocked" | "unexpected_page";
  error: string | null;
};

export async function convertShopeeCustomLinksByBrowserGql(
  input: CustomLinkConvertInput,
): Promise<BrowserGqlResult> {
  const limit = Number(process.env.AFFILIATE_CUSTOM_LINK_MAX_URLS ?? "40");
  const uniqueUrls = [...new Set(input.urls.filter(isValidHttpUrl))].slice(
    0,
    Number.isFinite(limit) ? limit : 40,
  );

  if (uniqueUrls.length === 0) {
    return {
      ok: true,
      links: {},
      failed: [],
      failCodes: {},
      processed: 0,
      sessionStatus: "ok",
      error: null,
    };
  }

  const session = await openAffiliateSession();
  try {
    const page = session.page;
    await page.goto(CUSTOM_LINK_PAGE, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });

    const currentUrl = page.url();
    if (currentUrl.includes("/buyer/login") || currentUrl.includes("/login")) {
      return {
        ok: false,
        links: {},
        failed: uniqueUrls,
        failCodes: Object.fromEntries(uniqueUrls.map((url) => [url, "LOGIN_REQUIRED"])),
        processed: uniqueUrls.length,
        sessionStatus: "login_required",
        error: "Affiliate session not logged in for browser-gql.",
      };
    }

    if (currentUrl.includes("/verify/traffic")) {
      return {
        ok: false,
        links: {},
        failed: uniqueUrls,
        failCodes: Object.fromEntries(uniqueUrls.map((url) => [url, "ANTI_BOT"])),
        processed: uniqueUrls.length,
        sessionStatus: "blocked",
        error: "Shopee anti-bot challenge detected before browser-gql.",
      };
    }

    if (!currentUrl.includes("/offer/custom_link") && !currentUrl.includes("/dashboard")) {
      return {
        ok: false,
        links: {},
        failed: uniqueUrls,
        failCodes: Object.fromEntries(uniqueUrls.map((url) => [url, "UNEXPECTED_PAGE"])),
        processed: uniqueUrls.length,
        sessionStatus: "unexpected_page",
        error: `Unexpected affiliate page: ${currentUrl}`,
      };
    }

    const subIds = input.subIds ?? {};
    const result = await page.evaluate(
      async ({ endpoint, urls, sub }) => {
        const payload = {
          operationName: "batchGetCustomLink",
          query:
            "query batchGetCustomLink($linkParams: [CustomLinkParam!], $sourceCaller: SourceCaller){ batchCustomLink(linkParams: $linkParams, sourceCaller: $sourceCaller){ shortLink longLink failCode } }",
          variables: {
            linkParams: urls.map((originalLink: string) => ({
              originalLink,
              advancedLinkParams: {
                subId1: sub.sub_id1 ?? "",
                subId2: sub.sub_id2 ?? "",
                subId3: sub.sub_id3 ?? "",
                subId4: sub.sub_id4 ?? "",
                subId5: sub.sub_id5 ?? "",
              },
            })),
            sourceCaller: "CUSTOM_LINK_CALLER",
          },
        };

        const response = await fetch(endpoint, {
          method: "POST",
          credentials: "include",
          headers: {
            "content-type": "application/json; charset=UTF-8",
            accept: "application/json, text/plain, */*",
          },
          body: JSON.stringify(payload),
        });

        const json = await response.json();
        return {
          status: response.status,
          currentUrl: window.location.href,
          body: json,
        };
      },
      {
        endpoint: CUSTOM_LINK_GQL_ENDPOINT,
        urls: uniqueUrls,
        sub: subIds,
      },
    );

    const body = result.body as {
      error?: number;
      tracking_id?: string;
      is_login?: boolean;
      data?: { batchCustomLink?: Array<{ shortLink?: string; failCode?: string }> };
    };

    if (body?.error === 90309999) {
      return {
        ok: false,
        links: {},
        failed: uniqueUrls,
        failCodes: Object.fromEntries(uniqueUrls.map((url) => [url, "ANTI_BOT_90309999"])),
        processed: uniqueUrls.length,
        sessionStatus: "blocked",
        error: `Shopee anti-bot via browser-gql (tracking_id=${body.tracking_id ?? "n/a"})`,
      };
    }

    if (body?.is_login === false) {
      return {
        ok: false,
        links: {},
        failed: uniqueUrls,
        failCodes: Object.fromEntries(uniqueUrls.map((url) => [url, "LOGIN_REQUIRED"])),
        processed: uniqueUrls.length,
        sessionStatus: "login_required",
        error: "Affiliate session expired for browser-gql.",
      };
    }

    const entries = body?.data?.batchCustomLink ?? [];
    const links: Record<string, string> = {};
    const failed: string[] = [];
    const failCodes: Record<string, string> = {};

    for (let index = 0; index < uniqueUrls.length; index += 1) {
      const source = uniqueUrls[index];
      const mapped = entries[index];
      const shortLink = mapped?.shortLink?.trim();
      if (shortLink) {
        links[source] = shortLink;
      } else {
        failed.push(source);
        failCodes[source] = mapped?.failCode ?? "NO_SHORT_LINK";
      }
    }

    return {
      ok: failed.length === 0,
      links,
      failed,
      failCodes,
      processed: uniqueUrls.length,
      sessionStatus: "ok",
      error: null,
    };
  } finally {
    await session.close();
  }
}
