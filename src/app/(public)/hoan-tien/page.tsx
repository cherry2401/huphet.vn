import { createClient } from "@/lib/supabase/server";
import CashbackClient from "./cashback-client";

export const metadata = {
  title: "Hoàn tiền mua sắm – Húp Hết",
  description: "Dán link sản phẩm từ Shopee, Lazada, TikTok Shop — mua sắm bình thường và nhận hoàn tiền về tài khoản.",
};

export default async function CashbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <CashbackClient isLoggedIn={!!user} />;
}
