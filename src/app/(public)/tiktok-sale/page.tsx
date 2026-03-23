import Image from "next/image";
import { getTikTokProducts } from "@/lib/adapters/tiktok-sale-adapter";
import { TikTokSaleClient } from "./tiktok-sale-client";
import styles from "./tiktok-sale.module.css";

export const metadata = {
  title: "TikTok Sale — Húp Hết",
  description:
    "Sản phẩm hot từ TikTok Shop với hoàn tiền lên đến 10%. Mua sắm thông minh, hoàn tiền thật.",
};

export const dynamic = "force-dynamic";

export default async function TikTokSalePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = (await searchParams) ?? {};
  const sort = (Array.isArray(resolved.sort) ? resolved.sort[0] : resolved.sort) ?? "RECOMMENDED";
  const q = (Array.isArray(resolved.q) ? resolved.q[0] : resolved.q) ?? "";

  const feed = await getTikTokProducts({
    sortField: "RECOMMENDED",
    sortOrder: "DESC",
    limit: 40,
    keyword: q || undefined,
  });

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Sản phẩm TikTok Shop hoa hồng cao</p>
        <h1 className={styles.heroTitle}>
          <span className={styles.heroTiktokIcon}>
            <Image src="/images/tiktok-2.png" alt="TikTok" width={32} height={32} />
          </span>
          TikTok <span className={styles.heroAccent}>Sale</span>
        </h1>
        <p className={styles.heroSub}>
          Deal hot TikTok Shop — hoàn tiền lên đến 10%
        </p>
      </section>

      <TikTokSaleClient
        initialProducts={feed.products}
        initialNextPageToken={feed.nextPageToken}
        initialError={feed.error}
        initialSort={sort}
        initialQuery={q}
      />
    </main>
  );
}
