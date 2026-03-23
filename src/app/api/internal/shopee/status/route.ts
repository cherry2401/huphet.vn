import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const pageUrl = searchParams.get("pageUrl") ?? "shopee-sieu-re";
  const { getAdminDashboardData } = await import("@/lib/admin/dashboard");
  return NextResponse.json(await getAdminDashboardData(pageUrl));
}
