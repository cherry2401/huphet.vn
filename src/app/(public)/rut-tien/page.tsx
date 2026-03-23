import type { Metadata } from "next";
import WithdrawClient from "./withdraw-client";

export const metadata: Metadata = {
  title: "Rút tiền – Húp Hết",
  description: "Rút cashback về tài khoản ngân hàng hoặc ví điện tử",
};

export default function WithdrawPage() {
  return <WithdrawClient />;
}
