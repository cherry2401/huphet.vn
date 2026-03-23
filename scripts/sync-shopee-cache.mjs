if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env.local");
  } catch {}
  try {
    process.loadEnvFile();
  } catch {}
}

const pageUrl = process.argv[2] ?? "shopee-sieu-re";
const baseUrl = process.env.INTERNAL_BASE_URL ?? "http://localhost:3000";
const apiKey = process.env.INTERNAL_API_KEY;

if (!apiKey) {
  console.error("Missing INTERNAL_API_KEY in environment.");
  process.exit(1);
}

const response = await fetch(`${baseUrl}/api/internal/shopee/sync`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": apiKey,
  },
  body: JSON.stringify({ pageUrl }),
});

const payload = await response.json();
console.log(JSON.stringify(payload, null, 2));

if (!response.ok) {
  process.exit(1);
}
