import Image from "next/image";
import Link from "next/link";
import { getVouchers } from "@/lib/adapters/voucher-adapter";
import { CopyCode } from "./copy-code";
import styles from "./page.module.css";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function VoucherPage({ searchParams }: Props) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const { vouchers, total, totalPages } = await getVouchers(currentPage, 30);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Mã giảm giá Shopee</h1>
        <p className={styles.subtitle}>
          {total > 0 ? `${total.toLocaleString("vi-VN")} mã đang có hiệu lực` : "Đang cập nhật..."}
        </p>

        <div className={styles.grid}>
          {vouchers.map((v) => (
            <article key={v.id} className={styles.card}>
              <div className={styles.cardHeader}>
                {v.imageUrl && (
                  <Image
                    src={v.imageUrl}
                    alt={v.title}
                    className={styles.avatar}
                    width={40}
                    height={40}
                    unoptimized
                  />
                )}
                <div className={styles.cardHeaderText}>
                  <h2 className={styles.cardTitle}>{v.title}</h2>
                  <p className={styles.cardDesc}>{v.description}</p>
                </div>
              </div>

              <div className={styles.codeRow}>
                <span className={styles.codeLabel}>Mã:</span>
                <code className={styles.codeValue}>{v.code}</code>
                <CopyCode code={v.code} />
              </div>

              {typeof v.percentageUsed === "number" && (
                <div className={styles.progressWrap}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${Math.min(v.percentageUsed, 100)}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>
                    Còn lại {v.percentageUsed}%
                  </span>
                </div>
              )}

              <a
                href={v.affiliateUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.claimBtn}
              >
                Lấy mã
              </a>
            </article>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className={styles.pagination}>
            {currentPage > 1 && (
              <Link
                href={`/voucher?page=${currentPage - 1}`}
                className={styles.pageBtn}
              >
                ← Trước
              </Link>
            )}

            <span className={styles.pageInfo}>
              Trang {currentPage} / {totalPages}
            </span>

            {currentPage < totalPages && (
              <Link
                href={`/voucher?page=${currentPage + 1}`}
                className={styles.pageBtn}
              >
                Tiếp →
              </Link>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
