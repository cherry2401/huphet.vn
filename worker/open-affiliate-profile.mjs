import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

loadEnvFiles();

const targetUrl =
  process.argv[2] ??
  process.env.AFFILIATE_OPEN_URL ??
  "https://affiliate.shopee.vn/offer/custom_link";
const remoteDebugPort = process.env.AFFILIATE_CDP_PORT ?? "9222";
const profileDir = path.resolve(
  process.cwd(),
  process.env.AFFILIATE_WORKER_PROFILE_DIR ??
    process.env.WORKER_PROFILE_DIR ??
    ".worker/brave-user-data-clone",
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

function resolveBrowserPath() {
  const candidates = [
    process.env.WORKER_BROWSER_PATH,
    process.env.AFFILIATE_OPEN_BROWSER_PATH,
    "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function main() {
  const browserPath = resolveBrowserPath();
  if (!browserPath) {
    console.error("Cannot find browser executable. Set WORKER_BROWSER_PATH or AFFILIATE_OPEN_BROWSER_PATH.");
    process.exit(1);
  }

  const args = [`--user-data-dir=${profileDir}`, `--remote-debugging-port=${remoteDebugPort}`, targetUrl];
  const child = spawn(browserPath, args, {
    detached: true,
    stdio: "ignore",
    windowsHide: false,
  });
  child.unref();

  console.log(
    JSON.stringify(
      {
        ok: true,
        browserPath,
        profileDir,
        targetUrl,
        cdpEndpoint: `http://127.0.0.1:${remoteDebugPort}`,
      },
      null,
      2,
    ),
  );
}

main();
