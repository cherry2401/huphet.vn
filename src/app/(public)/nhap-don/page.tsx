import type { Metadata } from "next";
import SubmitOrderClient from "./submit-order-client";

export const metadata: Metadata = {
  title: "Nhập đơn hoàn tiền – Húp Hết",
  description: "Nhập mã đơn hàng Shopee mua qua link MXH để nhận xu thưởng hoàn tiền.",
};

export default function NhapDonPage() {
  return <SubmitOrderClient />;
}
