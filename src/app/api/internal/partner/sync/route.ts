import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { syncTienVePartnerCache } from "@/lib/tienve/sync";

type SyncRequestBody = {
  pageUrl?: string;
};

export async function POST(request: Request) {
  // Auth guard — require admin access
  try {
    await requireAdmin();
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SyncRequestBody = {};

  try {
    body = (await request.json()) as SyncRequestBody;
  } catch {
    body = {};
  }

  try {
    const result = await syncTienVePartnerCache(body.pageUrl);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Partner sync failed",
      },
      { status: 500 },
    );
  }
}

