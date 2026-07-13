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
  // 로그인 화면 바코드(PassportBarcode)와 동일 스펙: 균일 2.5px 막대, 높이만 32~56px로 변주
  const [bars] = useState(() => {
    let seed = 0;
    for (const ch of seedKey || "BP") seed = (seed * 31 + ch.charCodeAt(0)) % 100000;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    return Array.from({ length: 46 }, () => Math.round(rnd() * 24 + 32));
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

// 전역 상단바(메뉴 · 장바구니) — 애프터케어는 document.body로 포털돼 앱 프레임의 상단바와
// 별개 DOM이라, 문구는 page.tsx에서 이미 번역된 문자열로 넘겨받아 그대로 표시만 한다.
export type AcTopBarProps = {
  menuLabel: string;
  cartCount: number;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onOpenPassport: () => void;
  onOpenCart: () => void;
};

function AcTopBar({ menuLabel, cartCount, menuOpen, onToggleMenu, onCloseMenu, onOpenPassport, onOpenCart }: AcTopBarProps) {
  return (
    <div className="mb-3 flex h-11 flex-none items-center justify-between border-b border-[#e7e7ea]">
      <div className="relative">
        <button
          type="button"
          onClick={onToggleMenu}
          aria-label="메뉴"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#0a0a0a] transition active:scale-90 active:bg-[#f4f4f5]"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-[130]" onClick={onCloseMenu} />
            <div className="absolute left-0 top-10 z-[131] w-44 overflow-hidden rounded-2xl border border-[#e7e7ea] bg-white shadow-[0_16px_40px_rgba(20,30,50,0.18)]">
              <button
                type="button"
                onClick={onOpenPassport}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13.5px] font-bold text-[#0a0a0a] transition active:bg-[#f4f4f5]"
              >
                🛂 {menuLabel}
              </button>
            </div>
          </>
        )}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/passport-seal.png" alt="" className="h-[26px] w-auto flex-none" />

      <button
        type="button"
        onClick={onOpenCart}
        aria-label="장바구니"
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-[#0a0a0a] transition active:scale-90 active:bg-[#f4f4f5]"
      >
        <span className="text-[17px] leading-none">🧳</span>
        {cartCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ec1c24] px-1 text-[9px] font-extrabold text-white">
            {cartCount}
          </span>
        )}
      </button>
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
  topBar,
}: {
  step: number;
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  footerCode: string;
  onBack?: () => void;
  children: ReactNode;
  topBar?: AcTopBarProps;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const content = (
    <div className={styles.backdrop}>
      <div className={`${styles.card} ${styles.root}`}>
        {topBar && <AcTopBar {...topBar} />}
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
