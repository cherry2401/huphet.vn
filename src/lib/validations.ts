/**
 * Zod v4 schemas cho API request validation.
 * Import schema cần thiết trong mỗi route handler.
 */
import { z } from "zod";

/* ─── Blog Comments ─── */
export const commentSchema = z.object({
  post_id: z.string().uuid("post_id phải là UUID hợp lệ"),
  content: z
    .string()
    .trim()
    .min(1, "Nội dung bình luận không được trống")
    .max(2000, "Bình luận tối đa 2.000 ký tự"),
});

/* ─── Cashback — Submit Order ─── */
export const submitOrderSchema = z.object({
  orderCode: z
    .string()
    .trim()
    .regex(/^[A-Z0-9]{10,30}$/i, "Mã đơn hàng không hợp lệ"),
  platform: z
    .enum(["shopee", "lazada", "tiktok"])
    .optional()
    .default("shopee"),
});

/* ─── Cashback — Withdraw ─── */
export const withdrawSchema = z.object({
  amount: z.coerce
    .number()
    .min(10_000, "Số tiền rút tối thiểu là 10.000đ")
    .max(50_000_000, "Số tiền rút tối đa là 50.000.000đ"),
  bankName: z
    .string()
    .trim()
    .min(2, "Tên ngân hàng không được trống")
    .max(100, "Tên ngân hàng quá dài"),
  bankAccount: z
    .string()
    .trim()
    .min(5, "Số tài khoản quá ngắn")
    .max(30, "Số tài khoản quá dài")
    .regex(/^[0-9]+$/, "Số tài khoản chỉ chứa chữ số"),
  accountName: z
    .string()
    .trim()
    .min(2, "Tên tài khoản không được trống")
    .max(100, "Tên tài khoản quá dài")
    .transform((v) => v.toUpperCase()),
});

/* ─── Tools — Create Link ─── */
export const createLinkSchema = z.object({
  productUrl: z
    .string()
    .trim()
    .url("URL sản phẩm không hợp lệ")
    .max(2000, "URL quá dài"),
  subId1: z.string().trim().max(100).optional(),
  shorten: z.boolean().optional().default(true),
  provider: z.enum(["shopee", "lazada", "tiktok"]).optional(),
});

/* ─── Analytics — Track ─── */
export const trackEventSchema = z.object({
  event_type: z
    .enum(["page_view", "feature_click"])
    .optional()
    .default("page_view"),
  page: z
    .string()
    .trim()
    .min(1, "page không được trống")
    .max(500, "page quá dài"),
  feature: z.string().trim().max(200).optional(),
  session_id: z.string().trim().max(100).optional(),
});

/* ─── Helpers ─── */

/**
 * Parse và validate body với schema.
 * Trả về { success: true, data } hoặc { success: false, error: string }
 */
export function parseBody<T>(
  schema: z.ZodType<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Zod v4: error.issues
  const firstIssue = result.error.issues[0];
  return {
    success: false,
    error: firstIssue?.message ?? "Dữ liệu không hợp lệ",
  };
}
