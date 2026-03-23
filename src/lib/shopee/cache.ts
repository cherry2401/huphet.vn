import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type {
  CachedDocument,
  Deal,
  DealSlotSnapshot,
  PartnerSyncStatus,
  ShopeeMicrositeSummary,
} from "@/lib/types";
import { slotOptions } from "@/lib/deal-filters";

type CacheKind = "microsite" | "deals" | "partner-status";

type SupabaseCacheRow = {
  cache_key: string;
  kind: CacheKind;
  page_url: string;
  generated_at: string;
  payload: unknown;
};

function getCacheRoot() {
  return path.join(process.cwd(), "output", "shopee", "cache");
}

function getCachePath(kind: CacheKind, pageUrl: string, slotKey?: string) {
  const suffix = slotKey ? `-${slotKey}` : "";
  return path.join(getCacheRoot(), `${kind}-${pageUrl}${suffix}.json`);
}

function getCacheKey(kind: CacheKind, pageUrl: string, slotKey?: string) {
  return slotKey ? `${kind}:${pageUrl}:${slotKey}` : `${kind}:${pageUrl}`;
}

function parseDealSlotCacheKey(cacheKey: string, pageUrl: string): string | null {
  const prefix = `deals:${pageUrl}:`;
  if (!cacheKey.startsWith(prefix)) {
    return null;
  }

  const slot = cacheKey.slice(prefix.length);
  return slot.length > 0 ? slot : null;
}

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

async function readCacheFile<T>(
  kind: CacheKind,
  pageUrl: string,
  slotKey?: string,
): Promise<CachedDocument<T> | null> {
  try {
    const content = await readFile(getCachePath(kind, pageUrl, slotKey), "utf8");
    return JSON.parse(content) as CachedDocument<T>;
  } catch {
    return null;
  }
}

async function writeCacheFile<T>(
  kind: CacheKind,
  pageUrl: string,
  data: T,
  slotKey?: string,
  generatedAt?: string,
) {
  await mkdir(getCacheRoot(), { recursive: true });
  const payload: CachedDocument<T> = {
    generatedAt: generatedAt ?? new Date().toISOString(),
    pageUrl,
    data,
  };
  await writeFile(
    getCachePath(kind, pageUrl, slotKey),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );
  return payload;
}

async function readSupabaseCache<T>(
  kind: CacheKind,
  pageUrl: string,
  slotKey?: string,
): Promise<CachedDocument<T> | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from(getSupabaseTable())
    .select("kind, page_url, generated_at, payload")
    .eq("cache_key", getCacheKey(kind, pageUrl, slotKey))
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as Omit<SupabaseCacheRow, "cache_key">;

  return {
    generatedAt: row.generated_at,
    pageUrl: row.page_url,
    data: row.payload as T,
  };
}

async function writeSupabaseCache<T>(
  kind: CacheKind,
  pageUrl: string,
  data: T,
  slotKey?: string,
  generatedAt?: string,
) {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const resolvedGeneratedAt = generatedAt ?? new Date().toISOString();
  const payload = {
    cache_key: getCacheKey(kind, pageUrl, slotKey),
    kind,
    page_url: pageUrl,
    generated_at: resolvedGeneratedAt,
    payload: data,
  };

  const { error } = await client.from(getSupabaseTable()).upsert(payload, {
    onConflict: "cache_key",
  });

  if (error) {
    throw new Error(`Supabase cache write failed: ${error.message}`);
  }

  return {
    generatedAt: resolvedGeneratedAt,
    pageUrl,
    data,
  } satisfies CachedDocument<T>;
}

async function readCache<T>(kind: CacheKind, pageUrl: string, slotKey?: string) {
  const remote = await readSupabaseCache<T>(kind, pageUrl, slotKey);
  if (remote) {
    return remote;
  }

  return readCacheFile<T>(kind, pageUrl, slotKey);
}

async function writeCache<T>(
  kind: CacheKind,
  pageUrl: string,
  data: T,
  slotKey?: string,
  generatedAt?: string,
) {
  const local = await writeCacheFile(kind, pageUrl, data, slotKey, generatedAt);
  await writeSupabaseCache(kind, pageUrl, data, slotKey, local.generatedAt);
  return local;
}

async function listSupabaseDealSnapshots(pageUrl: string): Promise<DealSlotSnapshot[]> {
  const client = getSupabaseClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from(getSupabaseTable())
    .select("cache_key, generated_at, payload")
    .eq("kind", "deals")
    .eq("page_url", pageUrl)
    .order("generated_at", { ascending: false })
    .limit(20);

  if (error || !data) {
    return [];
  }

  return dedupeSnapshots(
    (data as Pick<SupabaseCacheRow, "cache_key" | "generated_at" | "payload">[])
      .map((row) => {
        const slot = parseDealSlotCacheKey(row.cache_key, pageUrl);
        if (!slot) {
          return null;
        }

        return {
          slot,
          generatedAt: row.generated_at,
          count: Array.isArray(row.payload) ? row.payload.length : 0,
          cacheKey: row.cache_key,
        } satisfies DealSlotSnapshot;
      })
      .filter((entry): entry is DealSlotSnapshot => entry !== null),
  );
}

async function listFileDealSnapshots(pageUrl: string): Promise<DealSlotSnapshot[]> {
  try {
    const root = getCacheRoot();
    const files = await readdir(root);
    return dedupeSnapshots(
      await Promise.all(
        files
          .filter((filename) => filename.startsWith(`deals-${pageUrl}-`) && filename.endsWith(".json"))
          .map(async (filename) => {
            const slot = filename
              .replace(`deals-${pageUrl}-`, "")
              .replace(".json", "");

            const content = JSON.parse(
              await readFile(path.join(root, filename), "utf8"),
            ) as CachedDocument<Deal[]>;

            return {
              slot,
              generatedAt: content.generatedAt,
              count: content.data.length,
              cacheKey: getCacheKey("deals", pageUrl, slot),
            } satisfies DealSlotSnapshot;
          }),
      ).then((entries) => entries.filter((entry): entry is DealSlotSnapshot => entry !== null)),
    );
  } catch {
    return [];
  }
}

function dedupeSnapshots(entries: DealSlotSnapshot[]) {
  const picked = new Map<string, DealSlotSnapshot>();

  for (const entry of entries) {
    const current = picked.get(entry.slot);
    if (!current || new Date(entry.generatedAt).getTime() > new Date(current.generatedAt).getTime()) {
      picked.set(entry.slot, entry);
    }
  }

  return [...picked.values()].sort(
    (left, right) => new Date(right.generatedAt).getTime() - new Date(left.generatedAt).getTime(),
  );
}

export async function getCachedMicrositeSummary(pageUrl = "shopee-sieu-re") {
  return readCache<ShopeeMicrositeSummary>("microsite", pageUrl);
}

export async function getCachedDeals(pageUrl = "shopee-sieu-re", slotKey?: string) {
  return readCache<Deal[]>("deals", pageUrl, slotKey);
}

export async function listCachedDealSnapshots(pageUrl = "shopee-sieu-re") {
  const remote = await listSupabaseDealSnapshots(pageUrl);
  if (remote.length > 0) {
    return remote;
  }

  return listFileDealSnapshots(pageUrl);
}

export async function writeCachedMicrositeSummary(
  pageUrl: string,
  data: ShopeeMicrositeSummary,
  generatedAt?: string,
) {
  return writeCache("microsite", pageUrl, data, undefined, generatedAt);
}

export async function writeCachedDeals(
  pageUrl: string,
  data: Deal[],
  slotKey?: string,
  generatedAt?: string,
) {
  return writeCache("deals", pageUrl, data, slotKey, generatedAt);
}

export async function getCachedPartnerSyncStatus(pageUrl = "tienve-partner") {
  return readCache<PartnerSyncStatus>("partner-status", pageUrl);
}

export async function writeCachedPartnerSyncStatus(
  pageUrl: string,
  data: PartnerSyncStatus,
  generatedAt?: string,
) {
  return writeCache("partner-status", pageUrl, data, undefined, generatedAt);
}

export function getCachePaths(pageUrl = "shopee-sieu-re") {
  return {
    microsite: getCachePath("microsite", pageUrl),
    deals: getCachePath("deals", pageUrl),
    dealSlots: slotOptions.reduce<Record<string, string>>((accumulator, slot) => {
      accumulator[slot] = getCachePath("deals", pageUrl, slot);
      return accumulator;
    }, {}),
  };
}

export function getCacheBackendInfo() {
  return {
    file: true,
    supabase: Boolean(getSupabaseClient()),
    supabaseTable: getSupabaseTable(),
  };
}
