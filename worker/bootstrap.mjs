import { spawn } from "node:child_process";

loadEnvFiles();

const pageUrl = process.argv[2] ?? process.env.WORKER_PAGE_URL ?? "shopee-sieu-re";

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
  if (process.env.WORKER_SKIP_LOGIN !== "true") {
    await runStep("worker/login-helper.mjs", [pageUrl]);
  }

  await runStep("worker/browser-sync.mjs", [pageUrl]);
}

function runStep(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      stdio: "inherit",
      cwd: process.cwd(),
      env: process.env,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${scriptPath} exited with code ${code ?? "unknown"}`));
    });

    child.on("error", reject);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
