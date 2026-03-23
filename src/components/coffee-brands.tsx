import Image from "next/image";
import styles from "./coffee-brands.module.css";

const BRANDS = [
  {
    name: "Highlands Coffee",
    cashbackRate: "Hoàn 5%",
    badgeClass: styles.cashbackBadgeHighlands,
    affiliateUrl:
      "https://go.isclix.com/deep_link/v6/6570088397752993170/6709203674879803188?sub1=7436820&sub4=oneatapp&utm_source=Website&utm_medium=Website&utm_campaign=Highland&utm_content=H%C3%BAp+H%E1%BA%BFt&url_enc=aHR0cHM6Ly96YWxvLm1lL3MvMzI3NDExNjI5MTI3MzEyMDY3L2dhbWVzL2FmZmlsaWF0ZQ%3D%3D",
    promos: [
      {
        img: "https://i0.wp.com/highlandsvoucher.com/wp-content/uploads/2026/02/highland-khuyen-mai.png?w=600&ssl=1",
        label: "Khuyến mãi HOT",
      },
      {
        img: "https://i0.wp.com/highlandsvoucher.com/wp-content/uploads/2026/02/highlands-khuyen-mai.png?w=600&ssl=1",
        label: "Ưu đãi đặc biệt",
      },
      {
        img: "https://i0.wp.com/highlandsvoucher.com/wp-content/uploads/2026/02/ma-giam-gia-highland.png?w=600&ssl=1",
        label: "Mã giảm giá",
      },
      {
        img: "https://i0.wp.com/highlandsvoucher.com/wp-content/uploads/2026/02/Ma-giam-gia-Highlands-Coffee-Mua-1-Tang-1-Link-1.png?w=600&ssl=1",
        label: "Mua 1 Tặng 1",
      },
      {
        img: "https://i0.wp.com/highlandsvoucher.com/wp-content/uploads/2026/02/Ma-giam-gia-Highlands-Coffee-Mua-1-Tang-1-Link-2.png?w=600&ssl=1",
        label: "Mua 1 Tặng 1",
      },
      {
        img: "https://i0.wp.com/highlandsvoucher.com/wp-content/uploads/2026/02/ma-giam-gia-highlands-coffee.png?w=600&ssl=1",
        label: "Voucher Highlands",
      },
      {
        img: "https://i0.wp.com/highlandsvoucher.com/wp-content/uploads/2025/11/ma-giam-gia-highlands-mua-1-tang-1.png?w=600&ssl=1",
        label: "Phindi Mua 1 Tặng 1",
      },
      {
        img: "https://i0.wp.com/highlandsvoucher.com/wp-content/uploads/2026/01/ma-giam-gia-highlands-new-user.png?w=600&ssl=1",
        label: "New User Voucher",
      },
      {
        img: "https://i0.wp.com/highlandsvoucher.com/wp-content/uploads/2026/01/ma-giam-gia-highlands-shopeefood.png?w=600&ssl=1",
        label: "ShopeeFood Voucher",
      },
    ],
  },
  {
    name: "The Coffee House",
    cashbackRate: "Hoàn 4%",
    badgeClass: styles.cashbackBadgeTch,
    affiliateUrl:
      "https://go.isclix.com/deep_link/v6/6570088397752993170/6699917486599106569?sub4=oneatweb&utm_source=website&utm_medium=website&utm_campaign=The+coffee+House&utm_content=H%C3%BAp+h%E1%BA%BFt&url_enc=aHR0cHM6Ly9wcm9tb3RoZWNvZmZlZWVob3VzZS5jb20udm4v",
    promos: [
      {
        img: "https://thecoffeehousevoucher.vn/wp-content/uploads/2025/09/coffee-house-voucher.jpg",
        label: "Voucher TCH",
      },
      {
        img: "https://thecoffeehousevoucher.vn/wp-content/uploads/2025/10/the-coffee-house-voucher-combo-89k.jpg",
        label: "Combo 89K",
      },
      {
        img: "https://thecoffeehousevoucher.vn/wp-content/uploads/2025/10/the-coffee-house-voucher-giam-30k.png",
        label: "Giảm 30K",
      },
      {
        img: "https://thecoffeehousevoucher.vn/wp-content/uploads/2025/10/the-coffee-house-voucher-mua-2-tang-1.png",
        label: "Mua 2 Tặng 1",
      },
      {
        img: "https://thecoffeehousevoucher.vn/wp-content/uploads/2025/10/the-coffee-house-voucher.jpg",
        label: "Voucher HOT",
      },
      {
        img: "https://thecoffeehousevoucher.vn/wp-content/uploads/2025/10/voucher-the-coffee-house-combo-105k.jpg",
        label: "Combo 105K",
      },
      {
        img: "https://thecoffeehousevoucher.vn/wp-content/uploads/2025/08/voucher-the-coffee-house-shopeefood.png",
        label: "ShopeeFood Voucher",
      },
    ],
  },
];

export function CoffeeBrands() {
  return (
    <section className={styles.coffeeBrands}>
      {/* Header */}
      <div className={styles.coffeeBrandsHeader}>
        <div className={styles.coffeeBrandsIcon}>☕</div>
        <div>
          <h2 className={styles.coffeeBrandsTitle}>Uống cà phê cũng hoàn tiền</h2>
          <p className={styles.coffeeBrandsSub}>
            Highlands, The Coffee House và nhiều hơn nữa
          </p>
        </div>
      </div>

      {/* Brand rows */}
      {BRANDS.map((brand) => (
        <div key={brand.name} className={styles.brandRow}>
          <div className={styles.brandRowHeader}>
            <span className={styles.brandName}>{brand.name}</span>
            <span className={`${styles.cashbackBadge} ${brand.badgeClass}`}>
              {brand.cashbackRate}
            </span>
          </div>

          <div className={styles.marqueeContainer}>
            <div className={styles.marqueeTrack}>
              {/* Render twice for seamless loop */}
              {[...brand.promos, ...brand.promos].map((promo, i) => (
                <a
                  key={`${brand.name}-${i}`}
                  href={brand.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.promoCard}
                >
                  <Image
                    src={promo.img}
                    alt={promo.label}
                    width={160}
                    height={200}
                    unoptimized
                  />
                  <div className={styles.promoOverlay}>
                    <span className={styles.promoOverlayText}>{promo.label}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* CTA */}
      <a href="/hoan-tien" className={styles.coffeeCta}>
        <svg
          className={styles.coffeeCtaIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 6 15 12 9 18" />
        </svg>
        Xem tất cả thương hiệu hoàn tiền
      </a>
    </section>
  );
}
