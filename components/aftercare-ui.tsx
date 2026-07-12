"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./aftercare.module.css";
import { AftercarePlaneIcon, AftercareLuggageIcon } from "./aftercare-icons";

export { styles as acStyles };

export function AcSteps({ current }: { current: number }) {
  return (
    <div className={styles.steps}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={i < current ? styles.on : undefined} />
      ))}
    </div>
  );
}

export function AcHeader({
  eyebrow,
  title,
  subtitle,
  onBack,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  onBack?: () => void;
}) {
  return (
    <div className={styles.top}>
      <div className={styles.topRow}>
        {onBack && (
          <button type="button" onClick={onBack} aria-label="이전 페이지로" className={styles.backBtn}>
            ‹
          </button>
        )}
        <div>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>
            <span>{title}</span>
            <AftercarePlaneIcon className={styles.plane} />
          </h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/passport-seal.png" alt="Beauty Passport" className={styles.logo} />
    </div>
  );
}

export function AcLabel({ en, ko }: { en: string; ko: string }) {
  return (
    <div className={styles.label}>
      <b>{en}</b>
      <small>{ko}</small>
    </div>
  );
}

export function AcOpt({ selected, onClick, children, hint }: { selected: boolean; onClick: () => void; children: ReactNode; hint: string }) {
  return (
    <button type="button" onClick={onClick} className={`${styles.opt} ${selected ? styles.sel : ""}`}>
      {children} <small>{hint}</small>
    </button>
  );
}

export function AcChip({ selected, onClick, icon, label, en }: { selected: boolean; onClick: () => void; icon: string; label: string; en: string }) {
  return (
    <button type="button" onClick={onClick} className={`${styles.chip} ${selected ? styles.sel : ""}`}>
      <span className={styles.ico}>{icon}</span>
      <span className={styles.tx}>
        <b>{label}</b>
        <small>{en}</small>
      </span>
    </button>
  );
}

export function AcBtnBar({ children }: { children: ReactNode }) {
  return <div className={styles.btnbar}>{children}</div>;
}

export function AcBtn({
  children,
  variant = "primary",
  block,
  ...rest
}: {
  children: ReactNode;
  variant?: "primary" | "ghost";
  block?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${styles.btn} ${variant === "primary" ? styles.primary : styles.ghost} ${block ? styles.block : ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function AcTripCard({ dest, dates }: { dest: string; dates: string }) {
  return (
    <div className={styles.tripcard}>
      <div>
        <div className={styles.dest}>{dest}</div>
        <div className={styles.dates}>{dates}</div>
      </div>
      <div className={styles.flag}>
        <AftercareLuggageIcon className={styles.luggage} />
      </div>
    </div>
  );
}

export function AcStampSeal() {
  return (
    <div className={styles.stampwrap}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/aftercare-stamp.png" alt="처방 완료 도장" className={styles.stampImg} />
    </div>
  );
}

export function AcProductCard({ cat, name, ing, why }: { cat: string; name: string; ing: string; why: string }) {
  return (
    <div className={styles.product}>
      <div className={styles.cat}>{cat}</div>
      <div className={styles.name}>{name}</div>
      <span className={styles.ing}>{ing}</span>
      <p className={styles.why}>{why}</p>
    </div>
  );
}

export function AcBarcode({ seedKey }: { seedKey: string }) {
  // 로그인 화면 바코드(PassportBarcode)와 동일 스펙: 균일 2px 막대, 높이만 26~44px로 변주
  const [bars] = useState(() => {
    let seed = 0;
    for (const ch of seedKey || "BP") seed = (seed * 31 + ch.charCodeAt(0)) % 100000;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    return Array.from({ length: 46 }, () => Math.round(rnd() * 18 + 26));
  });
  return (
    <div className={styles.barcode}>
      {bars.map((h, i) => (
        <i key={i} style={{ height: h }} />
      ))}
    </div>
  );
}

export function AcFooter({ code }: { code: string }) {
  return (
    <div className={styles.footer}>
      <div className={styles.cap}>BEAUTY PASSPORT</div>
      <AcBarcode seedKey={code} />
      <div className={styles.code}>{code}</div>
    </div>
  );
}

export function AcScreenChrome({
  step,
  eyebrow,
  title,
  subtitle,
  footerCode,
  onBack,
  children,
}: {
  step: number;
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  footerCode: string;
  onBack?: () => void;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const content = (
    <div className={styles.backdrop}>
      <div className={`${styles.card} ${styles.root}`}>
        <AcHeader eyebrow={eyebrow} title={title} subtitle={subtitle} onBack={onBack} />
        <AcSteps current={step} />
        <div className={styles.bodyScroll}>{children}</div>
        <AcFooter code={footerCode} />
      </div>
    </div>
  );

  // 앱 전체 프레임의 perspective 스태킹 컨텍스트를 벗어나 실제 브라우저 뷰포트를
  // aftercare(1).html 원본과 동일하게 채우기 위해 document.body로 포털.
  if (!mounted) return null;
  return createPortal(content, document.body);
}
