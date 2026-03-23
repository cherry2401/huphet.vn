import path from "node:path";
import { chromium } from "playwright";

loadEnvFiles();

const profileDir =
  process.env.AFFILIATE_WORKER_PROFILE_DIR ??
  process.env.WORKER_PROFILE_DIR ??
  path.join(process.cwd(), ".worker", "profiles", "affiliate-shopee");
const browserChannel = process.env.WORKER_BROWSER_CHANNEL || "chrome";
const browserPath = process.env.WORKER_BROWSER_PATH || undefined;
const timeoutMs = Number(process.env.WORKER_LOGIN_TIMEOUT_MS ?? `${10 * 60 * 1000}`);
const targetUrl = "https://affiliate.shopee.vn/offer/custom_link";

function getLaunchOptions() {
  return {
    headless: false,
    channel: browserPath ? undefined : browserChannel,
    executablePath: browserPath,
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

  await page.goto(targetUrl, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });

  console.log(
    `Opened affiliate custom-link page with profile: ${profileDir}\n` +
      "Please complete login/challenge in this browser window.\n",
  );

  while (Date.now() - startedAt < timeoutMs) {
    const url = page.url();
    if (url.includes("affiliate.shopee.vn/offer/custom_link")) {
      console.log("Affiliate session looks valid. You can close this helper.");
      await browserContext.close();
      return;
    }

    await page.waitForTimeout(5000);
  }

  console.log("Affiliate login helper timed out.");
  await browserContext.close();
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});

