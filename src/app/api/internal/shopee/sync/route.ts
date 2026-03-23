import { NextResponse } from "next/server";
import { syncShopeeCache } from "@/lib/shopee/sync";
import { requireAdmin } from "@/lib/admin/auth";

type SyncRequestBody = {
  pageUrl?: string;
};

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SyncRequestBody = {};

  try {
    body = (await request.json()) as SyncRequestBody;
  } catch {
    body = {};
  }

  try {
    const result = await syncShopeeCache(body.pageUrl ?? "shopee-sieu-re");
    return NextResponse.json({
      ok: true,
      pageUrl: result.pageUrl,
      cachePaths: result.cachePaths,
      dealCount: result.deals.length,
      collectionCount: result.microsite.productCollections.length,
      voucherCollectionCount: result.microsite.voucherCollections.length,
      errors: result.errors,
      debug: result.debug,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 },
    );
  }
}
