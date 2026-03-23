import path from "node:path";
import { chromium } from "playwright";

loadEnvFiles();

const pageUrl = process.argv[2] ?? process.env.WORKER_PAGE_URL ?? "shopee-sieu-re";
const profileDir =
  process.env.WORKER_PROFILE_DIR ??
  path.join(process.cwd(), ".worker", "profiles", pageUrl);
const browserChannel = process.env.WORKER_BROWSER_CHANNEL || "chrome";
const browserPath = process.env.WORKER_BROWSER_PATH || undefined;
const timeoutMs = Number(process.env.WORKER_LOGIN_TIMEOUT_MS ?? `${10 * 60 * 1000}`);

function getLaunchOptions() {
  return {
    headless: false,
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

async function main() {
  const browserContext = await chromium.launchPersistentContext(profileDir, getLaunchOptions());
  await hardenContext(browserContext);

  const page = browserContext.pages()[0] ?? (await browserContext.newPage());
  const startedAt = Date.now();
  let success = false;
  let lastStatus = "Waiting for a valid Shopee session...";

  page.on("response", async (response) => {
    const url = response.url();
    if (!url.includes("/api/v4/collection/get_items")) {
      return;
    }

    try {
      const payload = await response.json();
      const items = payload?.data?.items ?? [];
      if (Array.isArray(items) && items.length > 0) {
        success = true;
        lastStatus = `Session looks valid. Captured ${items.length} protected items.`;
      } else if (payload?.error === 90309999) {
        lastStatus = "Still blocked by Shopee anti-bot. Keep the browser open and finish login/challenge.";
      }
    } catch {}
  });

  await page.goto(`https://shopee.vn/m/${pageUrl}`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });

  console.log(
    `Opened Shopee in a real browser window using profile: ${profileDir}\n` +
      "If Shopee shows login or challenge, complete it in that window. " +
      "This helper will keep retrying automatically.\n",
  );

  while (Date.now() - startedAt < timeoutMs) {
    if (success) {
      console.log(lastStatus);
      await browserContext.close();
      return;
    }

    if (page.url().includes("/buyer/login") || page.url().includes("/verify/traffic/error")) {
      console.log(`Status: ${lastStatus}`);
    }

    await page.goto(`https://shopee.vn/m/${pageUrl}`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForTimeout(8000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.8));
    await page.waitForTimeout(5000);
  }

  console.log("Login helper timed out before a valid session was detected.");
  await browserContext.close();
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
