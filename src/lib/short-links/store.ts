import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

type ShortLinkPayload = {
  targetUrl: string;
  createdAt: string;
};

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function getSupabaseTable() {
  return process.env.SUPABASE_CACHE_TABLE || "site_cache";
}

function getShortLinksRoot() {
  return path.join(process.cwd(), "output", "short-links");
}

function getCodePath(code: string) {
  return path.join(getShortLinksRoot(), `${code}.json`);
}

function makeCode() {
  return randomBytes(4).toString("base64url");
}

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createShortLink(targetUrl: string) {
  if (!isHttpUrl(targetUrl)) {
    throw new Error("Invalid target URL");
  }

  const createdAt = new Date().toISOString();
  const payload: ShortLinkPayload = {
    targetUrl,
    createdAt,
  };

  const code = makeCode();

  await mkdir(getShortLinksRoot(), { recursive: true });
  await writeFile(getCodePath(code), `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const client = getSupabaseClient();
  if (client) {
    await client.from(getSupabaseTable()).upsert(
      {
        cache_key: `short-link:${code}`,
        kind: "partner-status",
        page_url: "short-links",
        generated_at: createdAt,
        payload,
      },
      { onConflict: "cache_key" },
    );
  }

  return {
    code,
    targetUrl,
    createdAt,
  };
}

export async function resolveShortLink(code: string) {
  const normalized = code.trim();
  if (!normalized) {
    return null;
  }

  const client = getSupabaseClient();
  if (client) {
    const { data } = await client
      .from(getSupabaseTable())
      .select("payload")
      .eq("cache_key", `short-link:${normalized}`)
      .maybeSingle();
    const targetUrl = (data?.payload as ShortLinkPayload | undefined)?.targetUrl;
    if (targetUrl && isHttpUrl(targetUrl)) {
      return targetUrl;
    }
  }

  try {
    const parsed = JSON.parse(await readFile(getCodePath(normalized), "utf8")) as ShortLinkPayload;
    if (parsed.targetUrl && isHttpUrl(parsed.targetUrl)) {
      return parsed.targetUrl;
    }
  } catch {
    return null;
  }

  return null;
}

