export function assertInternalApiKey(request: Request) {
  const expected = process.env.INTERNAL_API_KEY;

  if (!expected) {
    throw new Error("INTERNAL_API_KEY is not configured.");
  }

  const provided =
    request.headers.get("x-api-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (provided !== expected) {
    throw new Error("Invalid internal API key.");
  }
}
