import Link from "next/link";
import styles from "../policy.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách bảo mật — Húp Hết",
  description: "Chính sách bảo mật của Húp Hết — cam kết bảo vệ dữ liệu cá nhân của bạn.",
};

export default function PrivacyPage() {
  return (
    <div className={styles.policyPage}>
      <Link href="/" className={styles.backLink}>
        ← Về trang chủ
      </Link>

      <header className={styles.policyHeader}>
        <h1 className={styles.policyTitle}>
          Chính sách Bảo mật
        </h1>
        <p className={styles.policySub}>
          Cam kết bảo vệ dữ liệu cá nhân của bạn khi sử dụng Húp Hết
        </p>
        <div className={styles.policyMeta}>
          <span>Cập nhật: 15/03/2026</span>
          <span>Có hiệu lực: 15/03/2026</span>
        </div>
      </header>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>1. Thông tin chúng tôi thu thập</h2>
        <p className={styles.policyText}>
          Khi bạn sử dụng Húp Hết, chúng tôi có thể thu thập các thông tin sau:
        </p>
        <ul className={styles.policyList}>
          <li>Thông tin tài khoản: tên, email, số điện thoại (khi đăng ký)</li>
          <li>Thông tin ngân hàng: tên ngân hàng, số tài khoản, tên chủ tài khoản (để rút tiền cashback)</li>
          <li>Lịch sử đơn hàng và hoàn tiền cashback liên kết với tài khoản</li>
          <li>Dữ liệu truy cập: địa chỉ IP, trình duyệt, thiết bị, trang đã xem</li>
          <li>Cookie và công nghệ theo dõi tương tự</li>
        </ul>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>2. Mục đích sử dụng dữ liệu</h2>
        <p className={styles.policyText}>
          Chúng tôi sử dụng thông tin của bạn cho các mục đích:
        </p>
        <ul className={styles.policyList}>
          <li>Cung cấp và duy trì dịch vụ (hiển thị deal, xử lý cashback)</li>
          <li>Xác minh danh tính và xử lý thanh toán hoàn tiền</li>
          <li>Gửi thông báo về đơn hàng, hoàn tiền và cập nhật dịch vụ</li>
          <li>Cải thiện trải nghiệm người dùng và phát triển tính năng mới</li>
          <li>Phát hiện và ngăn chặn gian lận</li>
        </ul>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>3. Bảo mật dữ liệu</h2>
        <p className={styles.policyText}>
          Chúng tôi áp dụng các biện pháp bảo mật để bảo vệ dữ liệu của bạn:
        </p>
        <ul className={styles.policyList}>
          <li>Mã hóa SSL/TLS cho toàn bộ kết nối</li>
          <li>Mật khẩu được mã hóa một chiều (hash), không lưu dạng plaintext</li>
          <li>Thông tin ngân hàng được mã hóa và chỉ hiển thị một phần</li>
          <li>Giới hạn quyền truy cập dữ liệu cho nhân sự cần thiết</li>
          <li>Sao lưu dữ liệu định kỳ để tránh mất mát</li>
        </ul>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>4. Chia sẻ thông tin</h2>
        <p className={styles.policyText}>
          Chúng tôi <strong>không bán</strong> dữ liệu cá nhân của bạn cho bên thứ ba. 
          Thông tin chỉ được chia sẻ trong các trường hợp:
        </p>
        <ul className={styles.policyList}>
          <li>Với đối tác liên kết (Shopee/AccessTrade) để xử lý hoàn tiền — chỉ thông tin đơn hàng cần thiết</li>
          <li>Khi có yêu cầu từ cơ quan pháp luật theo quy định</li>
          <li>Với sự đồng ý rõ ràng của bạn</li>
        </ul>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>5. Cookie</h2>
        <p className={styles.policyText}>
          Húp Hết sử dụng cookie để:
        </p>
        <ul className={styles.policyList}>
          <li>Duy trì phiên đăng nhập của bạn</li>
          <li>Theo dõi link tiếp thị liên kết (affiliate tracking cookie)</li>
          <li>Phân tích lưu lượng truy cập và cải thiện dịch vụ</li>
        </ul>
        <p className={styles.policyText}>
          Bạn có thể tắt cookie trong trình duyệt, nhưng một số tính năng có thể bị ảnh hưởng.
        </p>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>6. Quyền của bạn</h2>
        <p className={styles.policyText}>
          Bạn có các quyền sau đối với dữ liệu cá nhân:
        </p>
        <ul className={styles.policyList}>
          <li>Truy cập và xem dữ liệu cá nhân đã cung cấp</li>
          <li>Yêu cầu chỉnh sửa thông tin không chính xác</li>
          <li>Yêu cầu xóa tài khoản và dữ liệu liên quan</li>
          <li>Từ chối nhận thông báo tiếp thị</li>
        </ul>
        <p className={styles.policyText}>
          Để thực hiện các quyền này, vui lòng liên hệ chúng tôi qua kênh hỗ trợ.
        </p>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>7. Thay đổi chính sách</h2>
        <p className={styles.policyText}>
          Chúng tôi có thể cập nhật chính sách bảo mật khi cần thiết. Mọi thay đổi sẽ được thông báo 
          trên website. Chúng tôi khuyến khích bạn xem lại chính sách này định kỳ.
        </p>
      </section>

      <section className={styles.policySection}>
        <h2 className={styles.policySectionTitle}>8. Liên hệ</h2>
        <p className={styles.policyText}>
          Nếu bạn có câu hỏi về chính sách bảo mật, vui lòng liên hệ qua{" "}
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
