import Link from "next/link";
import styles from "../policy.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giới thiệu — Húp Hết",
  description: "Tìm hiểu về Húp Hết — nền tảng tổng hợp deal giá rẻ, mã giảm giá và xu live từ Shopee.",
};

export default function AboutPage() {
  return (
    <div className={styles.policyPage}>
      <Link href="/" className={styles.backLink}>
        ← Về trang chủ
      </Link>

      <header className={styles.policyHeader}>
        <h1 className={styles.policyTitle}>
          Về Húp Hết
        </h1>
        <p className={styles.policySub}>
          Nền tảng tổng hợp deal giá rẻ, mã giảm giá & xu live từ Shopee — giúp bạn mua sắm thông minh, tiết kiệm tối đa.
        </p>
      </header>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>Húp Hết là gì?</h2>
        <p className={styles.policyText}>
          Húp Hết là nền tảng tổng hợp thông tin deal, mã giảm giá và cơ hội nhận xu live từ Shopee. 
          Chúng tôi giúp người dùng Việt Nam tiết kiệm thời gian và tiền bạc khi mua sắm online bằng cách 
          tập trung tất cả ưu đãi tốt nhất vào một nơi duy nhất — cập nhật 24/7, hoàn toàn miễn phí.
        </p>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>Sứ mệnh của chúng tôi</h2>
        <p className={styles.policyText}>
          Mua sắm online không nên tốn quá nhiều công sức để tìm deal tốt. Húp Hết ra đời để giải quyết vấn đề đó — 
          biến việc săn deal, thu thập mã giảm giá, và cào xu live trở nên đơn giản nhất có thể.
        </p>
        <p className={styles.policyText}>
          Chúng tôi tin rằng mọi người đều xứng đáng được hưởng mức giá tốt nhất khi mua sắm online.
        </p>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>Tính năng nổi bật</h2>
        <ul className={styles.policyList}>
          <li>Deal đồng giá 1K — Sản phẩm chỉ từ 1.000đ, cập nhật mỗi ngày</li>
          <li>Flash Sale Shopee — Tổng hợp các đợt Flash Sale hot nhất</li>
          <li>Mã giảm giá — Voucher từ Shopee Mall và các shop uy tín</li>
          <li>Cào xu Live — Thông tin phiên live có xu, tối đa cơ hội nhận thưởng</li>
          <li>Tạo link Shopee — Tạo link tiếp thị liên kết dễ dàng</li>
          <li>Hoàn tiền Cashback — Mua hàng qua Húp Hết để nhận hoàn tiền</li>
        </ul>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>Cam kết minh bạch</h2>
        <p className={styles.policyText}>
          Húp Hết hoạt động dựa trên mô hình tiếp thị liên kết (affiliate marketing). Khi bạn mua hàng thông qua 
          link từ Húp Hết, chúng tôi có thể nhận một khoản hoa hồng nhỏ từ Shopee — hoàn toàn không ảnh hưởng đến 
          giá bạn phải trả. Phần lớn hoa hồng này được chia sẻ lại cho người dùng dưới dạng hoàn tiền cashback.
        </p>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>Liên hệ</h2>
        <p className={styles.policyText}>
          Nếu bạn có bất kỳ câu hỏi, góp ý hoặc cần hỗ trợ, hãy liên hệ chúng tôi qua:
        </p>
        <ul className={styles.policyList}>
          <li>
            Group Zalo:{" "}
            <a href="https://zalo.me/g/gitecp218" target="_blank" rel="noopener noreferrer" style={{color: "var(--brand)"}}>
              Tham gia ngay
            </a>
          </li>
          <li>
            Fanpage Facebook:{" "}
            <a href="https://www.facebook.com/profile.php?id=61582651056869" target="_blank" rel="noopener noreferrer" style={{color: "var(--brand)"}}>
              Húp Hết
            </a>
          </li>
          <li>
            Group Facebook:{" "}
            <a href="https://www.facebook.com/groups/2004178647070026" target="_blank" rel="noopener noreferrer" style={{color: "var(--brand)"}}>
              Cộng đồng Húp Hết
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
