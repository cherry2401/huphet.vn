import styles from "./page-loader.module.css";

export function PageLoader({ text = "Đang tải" }: { text?: string }) {
  return (
    <div className={styles.loader}>
      <div className={styles.scene}>
        <svg viewBox="0 0 260 130" width="230" height="115" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* ── Supermarket Cart ── */}
          <g className={styles.cartGroup}>
            {/* Cart basket (wire frame) */}
            <path d="M30 48 L22 82 L82 82 L76 48 Z" fill="none" stroke="#78716c" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Horizontal wires */}
            <line x1="29" y1="56" x2="77" y2="56" stroke="#a8a29e" strokeWidth="1.2" />
            <line x1="27" y1="64" x2="80" y2="64" stroke="#a8a29e" strokeWidth="1.2" />
            <line x1="25" y1="72" x2="81" y2="72" stroke="#a8a29e" strokeWidth="1.2" />
            {/* Vertical wires */}
            <line x1="40" y1="48" x2="37" y2="82" stroke="#a8a29e" strokeWidth="1.2" />
            <line x1="53" y1="48" x2="52" y2="82" stroke="#a8a29e" strokeWidth="1.2" />
            <line x1="65" y1="48" x2="67" y2="82" stroke="#a8a29e" strokeWidth="1.2" />
            {/* Cart bottom frame */}
            <line x1="22" y1="82" x2="82" y2="82" stroke="#57534e" strokeWidth="3" strokeLinecap="round" />
            {/* Child seat flap */}
            <path d="M70 48 L76 48 L78 60 L72 60 Z" fill="#78716c" opacity="0.4" />

            {/* Items poking out */}
            <rect x="32" y="38" width="14" height="18" rx="3" fill="#fbbf24" className={styles.item1} />
            <rect x="48" y="34" width="12" height="22" rx="3" fill="#34d399" className={styles.item2} />
            <rect x="62" y="40" width="11" height="16" rx="3" fill="#60a5fa" className={styles.item3} />
            {/* Sparkles */}
            <circle cx="38" cy="36" r="2" fill="#fde68a" className={styles.sparkle1} />
            <circle cx="58" cy="32" r="1.6" fill="#6ee7b7" className={styles.sparkle2} />
            <circle cx="70" cy="38" r="1.3" fill="#93c5fd" className={styles.sparkle3} />

            {/* Handle bar (long, extending to Minion) */}
            <path d="M76 50 L100 46 L118 42" stroke="#57534e" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Handle grip */}
            <rect x="115" y="38" width="8" height="8" rx="3" fill="#44403c" />

            {/* Wheels */}
            <g className={styles.wheel1}>
              <circle cx="30" cy="90" r="6" fill="#78716c" stroke="#57534e" strokeWidth="1.5" />
              <circle cx="30" cy="90" r="2.5" fill="#a8a29e" />
              <line x1="30" y1="84" x2="30" y2="96" stroke="#a8a29e" strokeWidth="0.8" />
            </g>
            <g className={styles.wheel2}>
              <circle cx="74" cy="90" r="6" fill="#78716c" stroke="#57534e" strokeWidth="1.5" />
              <circle cx="74" cy="90" r="2.5" fill="#a8a29e" />
              <line x1="74" y1="84" x2="74" y2="96" stroke="#a8a29e" strokeWidth="0.8" />
            </g>
          </g>

          {/* ── Minion (running pose, leaning forward) ── */}
          <g className={styles.minion}>
            {/* ─ Back leg (extended behind) ─ */}
            <g className={styles.legBack}>
              <path d="M148 92 L156 106" stroke="#2563eb" strokeWidth="8" strokeLinecap="round" />
              <ellipse cx="158" cy="108" rx="6" ry="3.5" fill="#1e1e1e" />
            </g>
            {/* ─ Front leg (bent forward) ─ */}
            <g className={styles.legFront}>
              <path d="M140 92 L134 106" stroke="#2563eb" strokeWidth="8" strokeLinecap="round" />
              <ellipse cx="132" cy="108" rx="6" ry="3.5" fill="#1e1e1e" />
            </g>

            {/* ─ Yellow Body (tilted forward = running) ─ */}
            <g transform="rotate(-10, 145, 70)">
              <rect x="128" y="32" width="36" height="64" rx="18" fill="url(#minionBody)" stroke="#d4a017" strokeWidth="1" />

              {/* Overalls */}
              <path d="M128 65 L164 65 L164 90 Q164 96 158 96 L134 96 Q128 96 128 90 Z" fill="#2563eb" />
              <rect x="140" y="70" width="12" height="10" rx="2" fill="#1d4ed8" />
              <text x="146" y="79" fontSize="7" fontWeight="bold" fill="#93c5fd" textAnchor="middle" fontFamily="sans-serif">H</text>
              {/* Straps */}
              <line x1="137" y1="65" x2="135" y2="54" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="155" y1="65" x2="157" y2="54" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="135" cy="53" r="2" fill="#1e1e1e" />
              <circle cx="157" cy="53" r="2" fill="#1e1e1e" />

              {/* Goggle strap — wraps from eye to back of head */}
              <rect x="126" y="40" width="30" height="3.5" rx="1.5" fill="#44403c" />

              {/* Goggle — shifted LEFT for profile view */}
              <circle cx="134" cy="42" r="12" fill="#b0b0b0" stroke="#57534e" strokeWidth="2" />
              <circle cx="134" cy="42" r="9.5" fill="white" />
              {/* Eye looking left */}
              <circle cx="131" cy="43" r="5.5" fill="#6b4423" />
              <circle cx="130" cy="43" r="3" fill="#1e1e1e" />
              <circle cx="129" cy="41" r="1.8" fill="rgba(255,255,255,0.8)" />
              <circle cx="132" cy="42.5" r="0.8" fill="rgba(255,255,255,0.5)" />

              {/* Mouth — shifted left, open grin */}
              <path d="M131 55 Q136 61 141 55" stroke="#44403c" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <rect x="133" y="55" width="2.5" height="2.5" rx="0.5" fill="white" />
              <rect x="136" y="55" width="2.5" height="2.5" rx="0.5" fill="white" />

              {/* Hair */}
              <path d="M140 28 Q138 18 142 24" stroke="#1e1e1e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M144 28 Q144 16 146 24" stroke="#1e1e1e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M148 28 Q150 18 148 24" stroke="#1e1e1e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </g>

            {/* ─ Arms grabbing handle ─ */}
            <g className={styles.arms}>
              <path d="M132 58 Q126 52 120 44" stroke="#f5c518" strokeWidth="6" strokeLinecap="round" fill="none" />
              <circle cx="120" cy="43" r="3.5" fill="#f5c518" stroke="#d4a017" strokeWidth="0.8" />
            </g>
          </g>

          {/* ── Speed lines ── */}
          <g className={styles.speedLines} opacity="0.3">
            <line x1="168" y1="50" x2="185" y2="50" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            <line x1="172" y1="60" x2="195" y2="60" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="170" y1="70" x2="190" y2="70" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            <line x1="165" y1="80" x2="180" y2="80" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* ── Ground ── */}
          <line x1="5" y1="112" x2="255" y2="112" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="4 4" />

          <defs>
            <linearGradient id="minionBody" x1="128" y1="32" x2="164" y2="96" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#f5c518" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <p className={styles.text}>
        {text}<span className={styles.dots} />
      </p>
    </div>
  );
}
