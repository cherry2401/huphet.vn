import Link from "next/link";
import styles from "../policy.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng — Húp Hết",
  description: "Điều khoản sử dụng dịch vụ Húp Hết — nền tảng tổng hợp deal và hoàn tiền từ Shopee.",
};

export default function TermsPage() {
  return (
    <div className={styles.policyPage}>
      <Link href="/" className={styles.backLink}>
        ← Về trang chủ
      </Link>

      <header className={styles.policyHeader}>
        <h1 className={styles.policyTitle}>
          Điều khoản Sử dụng
        </h1>
        <p className={styles.policySub}>
          Thỏa thuận ràng buộc giữa bạn và Húp Hết khi sử dụng dịch vụ
        </p>
        <div className={styles.policyMeta}>
          <span>Cập nhật: 15/03/2026</span>
          <span>Có hiệu lực: 15/03/2026</span>
        </div>
      </header>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>1. Chấp nhận điều khoản</h2>
        <p className={styles.policyText}>
          Bằng việc truy cập và sử dụng website Húp Hết (hupher.com), bạn đồng ý tuân thủ toàn bộ các 
          điều khoản và điều kiện được nêu trong tài liệu này. Nếu bạn không đồng ý với bất kỳ phần nào, 
          vui lòng ngừng sử dụng dịch vụ.
        </p>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>2. Mô tả dịch vụ</h2>
        <p className={styles.policyText}>
          Húp Hết là nền tảng tổng hợp thông tin deal, mã giảm giá, xu live và hoàn tiền cashback từ Shopee. 
          Chúng tôi cung cấp các dịch vụ bao gồm:
        </p>
        <ul className={styles.policyList}>
          <li>Tổng hợp và hiển thị deal đồng giá, flash sale từ Shopee</li>
          <li>Cung cấp mã giảm giá (voucher) từ các shop trên Shopee</li>
          <li>Thông tin phiên live có xu trên Shopee</li>
          <li>Tạo link tiếp thị liên kết (affiliate link)</li>
          <li>Hoàn tiền cashback khi mua hàng qua link Húp Hết</li>
        </ul>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>3. Tài khoản người dùng</h2>
        <p className={styles.policyText}>
          Để sử dụng một số tính năng (như hoàn tiền cashback), bạn cần đăng ký tài khoản. 
          Bạn có trách nhiệm:
        </p>
        <ul className={styles.policyList}>
          <li>Cung cấp thông tin chính xác, đầy đủ khi đăng ký</li>
          <li>Bảo mật thông tin đăng nhập và không chia sẻ cho người khác</li>
          <li>Chịu trách nhiệm về mọi hoạt động diễn ra trong tài khoản của mình</li>
          <li>Thông báo ngay cho chúng tôi nếu phát hiện truy cập trái phép</li>
        </ul>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>4. Hoàn tiền Cashback</h2>
        <p className={styles.policyText}>
          Chương trình hoàn tiền cashback hoạt động dựa trên hoa hồng tiếp thị liên kết từ Shopee:
        </p>
        <ul className={styles.policyList}>
          <li>Hoàn tiền được tính khi đơn hàng hoàn tất thành công (không bị hủy/trả)</li>
          <li>Thời gian xác nhận hoàn tiền phụ thuộc vào Shopee, thường từ 30-60 ngày</li>
          <li>Số tiền hoàn lại có thể thay đổi tùy chương trình khuyến mãi</li>
          <li>Rút tiền cashback khi đạt mức tối thiểu qua tài khoản ngân hàng</li>
          <li>Húp Hết có quyền từ chối hoàn tiền nếu phát hiện gian lận</li>
        </ul>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>5. Hành vi bị cấm</h2>
        <p className={styles.policyText}>
          Khi sử dụng Húp Hết, bạn không được:
        </p>
        <ul className={styles.policyList}>
          <li>Tạo nhiều tài khoản để trục lợi chương trình hoàn tiền</li>
          <li>Sử dụng bot, script hoặc công cụ tự động để truy cập dịch vụ</li>
          <li>Gian lận đơn hàng hoặc lạm dụng chương trình khuyến mãi</li>
          <li>Thu thập dữ liệu từ website mà không có sự cho phép</li>
          <li>Sử dụng dịch vụ cho mục đích vi phạm pháp luật</li>
        </ul>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>6. Giới hạn trách nhiệm</h2>
        <p className={styles.policyText}>
          Húp Hết là nền tảng trung gian tổng hợp thông tin từ Shopee. Chúng tôi không chịu trách nhiệm về:
        </p>
        <ul className={styles.policyList}>
          <li>Chất lượng, giá cả sản phẩm — thuộc trách nhiệm của người bán trên Shopee</li>
          <li>Sự chính xác tuyệt đối của thông tin deal — vui lòng kiểm tra lại trước khi mua</li>
          <li>Thay đổi chính sách từ phía Shopee ảnh hưởng đến dịch vụ</li>
          <li>Gián đoạn dịch vụ do lỗi kỹ thuật hoặc bảo trì hệ thống</li>
        </ul>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>7. Thay đổi điều khoản</h2>
        <p className={styles.policyText}>
          Chúng tôi có quyền cập nhật điều khoản sử dụng bất kỳ lúc nào. Các thay đổi sẽ có hiệu lực 
          ngay khi được đăng trên website. Việc bạn tiếp tục sử dụng dịch vụ sau khi thay đổi đồng nghĩa 
          với việc bạn chấp nhận điều khoản mới.
        </p>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>8. Liên hệ</h2>
        <p className={styles.policyText}>
          Nếu bạn có thắc mắc về điều khoản sử dụng, vui lòng liên hệ chúng tôi qua{" "}
          <a href="https://zalo.me/g/gitecp218" target="_blank" rel="noopener noreferrer" style={{color: "var(--brand)"}}>
            Group Zalo
          </a>{" "}
          hoặc{" "}
          <a href="https://www.facebook.com/profile.php?id=61582651056869" target="_blank" rel="noopener noreferrer" style={{color: "var(--brand)"}}>
            Fanpage Facebook
          </a>.
        </p>
      </section>
    </div>
  );
}
