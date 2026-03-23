import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import { getDeals } from "@/lib/adapters/deal-adapter";
import { getLiveSessions } from "@/lib/adapters/live-adapter";
import { getVouchers } from "@/lib/adapters/voucher-adapter";
import { getTikTokProducts } from "@/lib/adapters/tiktok-sale-adapter";
import { CopyCode } from "./voucher/copy-code";
import { UserGreeting } from "@/components/user-greeting";
import { CoffeeBrands } from "@/components/coffee-brands";
import { HeroCTA } from "@/components/hero-cta";
import { HeroLinkTool } from "@/components/hero-link-tool";
import { GuestOnly } from "@/components/guest-only";
import { FAQ } from "@/components/faq";
import { Footer } from "@/components/footer";

export default async function Home() {
  const [deals, liveSessions, voucherResult, tiktokFeed] = await Promise.all([
    getDeals().catch(() => []),
    getLiveSessions().catch(() => []),
    getVouchers(1, 8).catch(() => ({ vouchers: [], total: 0, page: 1, limit: 8, totalPages: 0 })),
    getTikTokProducts({ limit: 4 }).catch(() => ({ products: [], nextPageToken: null, error: null })),
  ]);

  const topDeals = deals.slice(0, 4);
  const topLive = liveSessions.slice(0, 3);
  const totalXu = liveSessions.reduce((sum, s) => sum + (s.maxcoin ?? 0), 0);
  const topVouchers = voucherResult.vouchers;
  const topTiktok = tiktokFeed.products.slice(0, 4);

  return (
    <>
    <main className={styles.page}>
      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <UserGreeting className={styles.heroGreeting} />
          <h1 className={styles.heroTitle}>
            <span className={styles.brandName}>Húp Hết</span>
            <br />
            Săn sale không bỏ sót
          </h1>
          <p className={styles.heroSub}>
            Deal 1K, flash sale, xu live — tất cả trong một. Cập nhật 24/7, hoàn toàn miễn phí.
          </p>
          <div className={styles.heroActions}>
            <HeroCTA primaryClass={styles.ctaPrimary} secondaryClass={styles.ctaSecondary} />
          </div>
        </div>
      </section>

      {/* ===== HERO LINK TOOL (logged-in only) ===== */}
      <HeroLinkTool className={styles.heroLinkSection} />

      {/* ===== STATS BAR (guests only) ===== */}
      <GuestOnly>
        <section className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{deals.length}+</span>
            <span className={styles.statLabel}>Deal mỗi ngày</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{totalXu > 0 ? `${(totalXu / 1000).toFixed(0)}K` : "Free"}</span>
            <span className={styles.statLabel}>Xu Live miễn phí</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>24/7</span>
            <span className={styles.statLabel}>Cập nhật liên tục</span>
          </div>
        </section>
      </GuestOnly>

      {/* ===== COFFEE BRANDS ===== */}
      <CoffeeBrands />

      {/* ===== DEAL 1K SECTION ===== */}
      <section className={styles.featureSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Deal đồng giá từ 1K</h2>
          <Link href="/deal" className={styles.seeAll}>
            Xem tất cả
            <svg className={styles.seeAllIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
          </Link>
        </div>
        {topDeals.length > 0 ? (
          <div className={styles.dealGrid}>
            {topDeals.map((deal) => (
              <a key={deal.slug} href={deal.affiliateUrl} target="_blank" rel="noreferrer" className={styles.dealCard}>
                <div className={styles.dealImgWrap}>
                  {deal.imageUrl && (
                    <Image src={deal.imageUrl} alt={deal.title} className={styles.dealImg} width={200} height={200} unoptimized />
                  )}
                  <span className={styles.dealDiscount}>-{deal.discountPercent}%</span>
                </div>
                <div className={styles.dealInfo}>
                  <h3 className={styles.dealName}>{deal.title}</h3>
                  <div className={styles.dealPrice}>
                    <span className={styles.priceNow}>{deal.salePrice?.toLocaleString("vi-VN")} ₫</span>
                    <span className={styles.priceOld}>{deal.originalPrice?.toLocaleString("vi-VN")} ₫</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className={styles.emptyHint}>Đang cập nhật deal mới...</p>
        )}
      </section>

      {/* ===== TIKTOK SALE SECTION ===== */}
      <section className={styles.featureSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>TikTok Sale</h2>
          <Link href="/tiktok-sale" className={styles.seeAll}>
            Xem tất cả
            <svg className={styles.seeAllIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
          </Link>
        </div>
        {topTiktok.length > 0 ? (
          <div className={styles.dealGrid}>
            {topTiktok.map((product) => (
              <a key={product.id} href={product.affiliateUrl} target="_blank" rel="noreferrer" className={styles.dealCard}>
                <div className={styles.dealImgWrap}>
                  {product.imageUrl && (
                    <Image src={product.imageUrl} alt={product.title} className={styles.dealImg} width={200} height={200} unoptimized />
                  )}
                  {product.commissionRate > 0 && (
                    <span className={styles.dealDiscount}>Up to {product.commissionRate.toFixed(product.commissionRate % 1 === 0 ? 0 : 1)}%</span>
                  )}
                </div>
                <div className={styles.dealInfo}>
                  <h3 className={styles.dealName}>{product.title}</h3>
                  <div className={styles.dealPrice}>
                    <span className={styles.priceNow}>{product.salePriceMin?.toLocaleString("vi-VN")} ₫</span>
                    {product.originalPriceMin > product.salePriceMin && (
                      <span className={styles.priceOld}>{product.originalPriceMin?.toLocaleString("vi-VN")} ₫</span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className={styles.emptyHint}>Đang cập nhật sản phẩm TikTok Shop...</p>
        )}
      </section>

      {/* ===== VOUCHER SECTION ===== */}
      <section className={styles.featureSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Mã giảm giá Shopee</h2>
          <Link href="/voucher" className={styles.seeAll}>
            Xem tất cả
            <svg className={styles.seeAllIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
          </Link>
        </div>
        {topVouchers.length > 0 ? (
          <div className={styles.voucherGrid}>
            {topVouchers.map((v) => (
              <a key={v.id} href={v.affiliateUrl} target="_blank" rel="noreferrer" className={styles.voucherCard}>
                <div className={styles.voucherHeader}>
                  {v.imageUrl && (
                    <Image src={v.imageUrl} alt={v.title} className={styles.voucherAvatar} width={40} height={40} unoptimized />
                  )}
                  <div className={styles.voucherHeaderText}>
                    <span className={styles.voucherTitle}>{v.title}</span>
                    <span className={styles.voucherDesc}>{v.description}</span>
                  </div>
                </div>

                <div className={styles.voucherCodeRow}>
                  <span className={styles.voucherCodeLabel}>Mã:</span>
                  <code className={styles.voucherCode}>{v.code}</code>
                  <CopyCode code={v.code} />
                </div>

                {typeof v.percentageUsed === "number" && (
                  <div className={styles.voucherProgressWrap}>
                    <div className={styles.voucherProgress}>
                      <div className={styles.voucherProgressFill} style={{ width: `${Math.min(v.percentageUsed, 100)}%` }} />
                    </div>
                    <span className={styles.voucherProgressText}>Còn lại {v.percentageUsed}%</span>
                  </div>
                )}

              </a>
            ))}
          </div>
        ) : (
          <p className={styles.emptyHint}>Đang cập nhật voucher...</p>
        )}
      </section>

      {/* ===== XU LIVE SECTION ===== */}
      <section className={styles.featureSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Cào xu livestream miễn phí</h2>
          <Link href="/live" className={styles.seeAll}>
            Cào xu ngay
            <svg className={styles.seeAllIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
          </Link>
        </div>
        {topLive.length > 0 ? (
          <div className={styles.liveGrid}>
            {topLive.map((session, i) => (
              <article key={`${session.id}-${i}`} className={`${styles.liveCard} ${i === 0 ? styles.liveCardTop : i === 1 ? styles.liveCardSilver : i === 2 ? styles.liveCardBronze : ""}`}>
                <div className={styles.liveRank}>#{i + 1}</div>
                <div className={styles.liveCoin}>
                  <span className={styles.liveCoinNum}>{(session.maxcoin ?? 0).toLocaleString("vi-VN")}</span>
                  <span className={styles.liveCoinLabel}>xu</span>
                </div>
                <div className={styles.liveShop}>{session.hostName}</div>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.emptyHint}>Đang cập nhật phiên live...</p>
        )}
      </section>

      {/* ===== TẠO LINK SECTION ===== */}
      <section className={styles.featureSection}>
        <div className={styles.linkFeature}>
          <div>
            <h2 className={styles.sectionTitle}>Tạo link Shopee lấy mã giảm giá</h2>
            <p className={styles.sectionSub}>
              Dán link sản phẩm → nhận link có voucher Facebook giảm 20-25%
            </p>
          </div>
          <Link href="/tao-link" className={styles.ctaPrimary}>
            Tạo link ngay
          </Link>
        </div>
      </section>

      {/* ===== SOCIAL PROOF ===== */}
      <section className={styles.socialProof}>
        <div className={styles.socialProofInner}>
          <div className={styles.proofItem}>
            <svg className={styles.proofIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <div>
              <span className={styles.proofNumber}>12,000+</span>
              <span className={styles.proofLabel}>người dùng tin tưởng</span>
            </div>
          </div>
          <div className={styles.proofDivider} />
          <div className={styles.proofItem}>
            <svg className={styles.proofIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <div>
              <span className={styles.proofNumber}>500+</span>
              <span className={styles.proofLabel}>deal cập nhật mỗi ngày</span>
            </div>
          </div>
          <div className={styles.proofDivider} />
          <div className={styles.proofItem}>
            <svg className={styles.proofIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <div>
              <span className={styles.proofNumber}>4.9 ⭐</span>
              <span className={styles.proofLabel}>đánh giá từ cộng đồng</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMMUNITY ===== */}
      <section className={styles.featureSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Tham gia cộng đồng Húp Hết</h2>
        </div>
        <p className={styles.communitySub}>Nhận deal hot, thông báo flash sale & mã giảm giá độc quyền mỗi ngày</p>
        <div className={styles.communityGrid}>
          <a href="https://zalo.me/g/gitecp218" target="_blank" rel="noopener noreferrer" className={`${styles.communityCard} ${styles.communityZalo}`}>
            <div className={styles.communityIconWrap}>
              <svg className={styles.communityIcon} viewBox="0 0 48 48" fill="currentColor">
                <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm8.95 27.3c-.2.55-.95 1-1.55 1.15-.45.1-1.05.2-3.05-.65-2.55-1.1-4.2-3.7-4.35-3.85-.1-.15-.95-1.25-.95-2.4s.6-1.7.8-1.95c.2-.2.45-.3.6-.3h.45c.15 0 .35-.05.55.4.2.5.7 1.7.75 1.85.05.1.1.25 0 .4-.05.15-.1.25-.2.35-.1.15-.2.3-.3.4-.1.1-.25.25-.1.5.15.2.6 1 1.3 1.6.9.8 1.65 1.05 1.9 1.15.2.1.35.1.5-.05.1-.2.5-.6.65-.8.15-.2.3-.2.5-.1.2.05 1.3.6 1.5.75.25.1.4.15.45.25.1.15.1.75-.1 1.3zM15.3 31h-1.5c-.3 0-.8-.1-.8-.1L10.7 18h1.6l1.8 10.3L16.3 18h1.4l-2.4 13zm5.2 0h-1.4V18h1.4v13zm8.8-8.5c0-.85-.7-1.55-1.55-1.55s-1.55.7-1.55 1.55.7 1.55 1.55 1.55 1.55-.7 1.55-1.55z"/>
              </svg>
            </div>
            <div className={styles.communityInfo}>
              <span className={styles.communityName}>Group Zalo</span>
              <span className={styles.communityDesc}>Chat real-time, nhận deal nhanh nhất</span>
            </div>
            <svg className={styles.communityArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
          </a>

          <a href="https://www.facebook.com/profile.php?id=61582651056869" target="_blank" rel="noopener noreferrer" className={`${styles.communityCard} ${styles.communityFanpage}`}>
            <div className={styles.communityIconWrap}>
              <svg className={styles.communityIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div className={styles.communityInfo}>
              <span className={styles.communityName}>Fanpage Facebook</span>
              <span className={styles.communityDesc}>Theo dõi tin tức & deal hot hàng ngày</span>
            </div>
            <svg className={styles.communityArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
          </a>

          <a href="https://www.facebook.com/groups/2004178647070026" target="_blank" rel="noopener noreferrer" className={`${styles.communityCard} ${styles.communityGroup}`}>
            <div className={styles.communityIconWrap}>
              <svg className={styles.communityIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div className={styles.communityInfo}>
              <span className={styles.communityName}>Group Facebook</span>
              <span className={styles.communityDesc}>Cộng đồng chia sẻ deal & mã giảm giá</span>
            </div>
            <svg className={styles.communityArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
          </a>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <FAQ />

      {/* ===== BOTTOM CTA ===== */}
      <section className={styles.bottomCta}>
        <h2>Săn deal thông minh, tiết kiệm dễ dàng</h2>
        <p>Tham gia cộng đồng Húp Hết — nơi hàng ngàn tín đồ mua sắm cập nhật deal hot mỗi ngày</p>
        <div className={styles.heroActions}>
          <Link href="/deal" className={styles.ctaPrimary}>
            Khám phá ngay
          </Link>
          <Link href="/tao-link" className={styles.ctaSecondary}>
            Tạo link Shopee
          </Link>
        </div>
      </section>
    </main>
      <Footer />
    </>
  );
}
