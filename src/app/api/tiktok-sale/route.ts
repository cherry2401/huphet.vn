import { NextResponse } from "next/server";
import { getTikTokProducts } from "@/lib/adapters/tiktok-sale-adapter";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const keyword = searchParams.get("q") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 40), 60);
  const pageToken = searchParams.get("page_token") ?? undefined;

  const feed = await getTikTokProducts({
    sortField: "RECOMMENDED",
    sortOrder: "DESC",
    limit,
    keyword,
    pageToken,
  });

  return NextResponse.json(feed);
}
