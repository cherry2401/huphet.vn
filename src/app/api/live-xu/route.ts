import { NextResponse } from "next/server";

const API_URL = "https://api.tienve.vn/api/v1/flash-deals/shopee-xu";

type TienVeXuItem = {
  drawId: number;
  sessionId: number;
  userId: number;
  shopId: string;
  userName: string;
  startTime: number;
  slot: number;
  maxcoin: number;
  viewer_count: string;
};

export async function GET() {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json([], { status: 502 });
    }

    const json = await res.json();

    if (!json.success || !Array.isArray(json.data)) {
      return NextResponse.json([], { status: 502 });
    }

    const sessions = json.data.map((item: TienVeXuItem) => ({
      id: `xu-${item.drawId}`,
      slug: `xu-${item.drawId}`,
      title: item.userName,
      hostName: item.userName,
      startsAt: new Date(item.startTime).toISOString(),
      rewardLabel: `${item.maxcoin.toLocaleString("vi-VN")} xu`,
      affiliateUrl: item.shopId,
      source: "tienve-xu-api",
      maxcoin: item.maxcoin,
    }));

    return NextResponse.json(
      sessions.sort(
        (a: { maxcoin: number }, b: { maxcoin: number }) => b.maxcoin - a.maxcoin
      )
    );
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
