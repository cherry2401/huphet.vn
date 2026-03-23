"use client";

import { useState } from "react";
import styles from "./faq.module.css";

const FAQ_ITEMS = [
  {
    question: "Húp Hết là gì?",
    answer:
      "Húp Hết là nền tảng tổng hợp deal giá rẻ, mã giảm giá, xu live và hoàn tiền cashback từ Shopee. Giúp bạn mua sắm thông minh, tiết kiệm tối đa — hoàn toàn miễn phí.",
  },
  {
    question: "Húp Hết hoạt động như thế nào?",
    answer:
      "Rất đơn giản: (1) Truy cập Húp Hết, (2) Chọn deal hoặc mã giảm giá bạn muốn, (3) Nhấn vào sẽ được chuyển đến Shopee, (4) Mua sắm như bình thường, (5) Nhận hoàn tiền hoặc giá ưu đãi tự động.",
  },
  {
    question: "Húp Hết có miễn phí không?",
    answer:
      "Có! Húp Hết hoàn toàn miễn phí. Bạn không mất bất kỳ chi phí nào. Giá sản phẩm khi mua qua Húp Hết vẫn giống hệt khi mua trực tiếp trên Shopee, thậm chí còn rẻ hơn nhờ deal và mã giảm giá.",
  },
  {
    question: "Deal 1K là gì? Có thật không?",
    answer:
      "Deal 1K là các sản phẩm được Shopee giảm giá còn từ 1.000đ. Đây là chương trình chính thức của Shopee, Húp Hết chỉ tổng hợp lại để bạn dễ tìm. Số lượng có hạn nên cần nhanh tay!",
  },
  {
    question: "Xu Live là gì và cào xu như thế nào?",
    answer:
      "Xu Live là xu Shopee được phát miễn phí trong các phiên livestream. Húp Hết tổng hợp danh sách phiên live đang phát xu, bạn chỉ cần nhấn vào để tham gia cào xu trực tiếp trên app Shopee.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={styles.faq}>
      <h2 className={styles.faqTitle}>
        Câu hỏi thường gặp về <span className={styles.faqBrand}>Húp Hết</span>
      </h2>
      <div className={styles.faqList}>
        {FAQ_ITEMS.map((item, i) => (
          <div
            key={i}
            className={`${styles.faqItem} ${openIndex === i ? styles.faqItemOpen : ""}`}
          >
            <button
              className={styles.faqQuestion}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              aria-expanded={openIndex === i}
            >
              <span>{item.question}</span>
              <svg
                className={styles.faqChevron}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className={styles.faqAnswer}>
              <p>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
