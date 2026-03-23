/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getAdminDashboardData } from "@/lib/admin/dashboard";
import { requireAdmin } from "@/lib/admin/auth";

/**
 * GET /api/admin/stats
 * Trả về metrics tính năng website cho admin dashboard
 */
export async function GET() {
  try {
    await requireAdmin();
    const data = await getAdminDashboardData();

    return NextResponse.json({
      ok: true,
      features: {
        deals: {
          label: "Deal 1K",
          count: data.partner.dealCount,
          cacheDate: data.partner.cacheGeneratedAt,
        },
        flashSales: {
          label: "Flash Sale",
          count: data.cache.flashSaleCount,
        },
        vouchers: {
          label: "Voucher",
          count: data.cache.voucherCollectionCount,
        },
        collections: {
          label: "Bộ sưu tập",
          count: data.cache.collectionCount,
        },
      },
      system: {
        partnerApi: data.partner.apiHealth,
        shopeeSession: data.shopee.hasCookie,
        cacheBackend: data.cacheBackend,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
