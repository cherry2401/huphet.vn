import { cache } from "react";
import type { Voucher } from "@/lib/types";

const API_URL = "https://pub2-api.accesstrade.vn/v1/creative/coupon";
const MERCHANT_ID = process.env.ACCESSTRADE_MERCHANT_ID || "4742147753565840242";
const TOKEN = process.env.ACCESSTRADE_TOKEN || "";

type ATCoupon = {
  id: string;
  name: string;
  content: string;
  coupons: { coupon_code: string; coupon_desc: string }[];
  prod_link: string;
  image: string;
  end_date: string;
  percentage_used: number;
  time_left: string;
};

type VoucherResult = {
  vouchers: Voucher[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const getVouchers = cache(
  async (page = 1, limit = 30): Promise<VoucherResult> => {
    if (!TOKEN) return { vouchers: [], total: 0, page, limit, totalPages: 0 };

    try {
      const res = await fetch(
        `${API_URL}?page=${page}&limit=${limit}&merchant=${MERCHANT_ID}`,
        {
          headers: { Authorization: `Bearer ${TOKEN}` },
          next: { revalidate: 300 },
        },
      );

      if (!res.ok)
        return { vouchers: [], total: 0, page, limit, totalPages: 0 };

      const json = await res.json();
      const items: ATCoupon[] = json?.data?.data ?? [];
      const total: number = json?.data?.count ?? 0;

      const vouchers = items.map((item) => ({
        id: item.id,
        slug: item.id,
        title: item.name,
        code: item.coupons?.[0]?.coupon_code ?? "",
        description: item.content?.split("\n")[0] ?? "",
        expiresAt: item.end_date,
        affiliateUrl: item.prod_link,
        source: "accesstrade",
        percentageUsed: item.percentage_used ?? 0,
        imageUrl: item.image,
        timeLeft: item.time_left,
      }));

      return {
        vouchers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch {
      return { vouchers: [], total: 0, page, limit, totalPages: 0 };
    }
  },
);
