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

// Welcome back 홈 화면의 ZigZag 상단바와 동일한 디자인·메뉴 구성 — 애프터케어는
// document.body로 포털되는 별개 DOM이라, 필요한 콜백/상태를 page.tsx에서 그대로 props로 받는다.
export type AcTopBarProps = {
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onOpenPassport: () => void;
  onNewSurvey: () => void;
  onScan: () => void;
  onSwitchAccount: () => void;
  onOpenCart: () => void;
  cartCount: number;
};

function AcTopBar({ menuOpen, onToggleMenu, onCloseMenu, onOpenPassport, onNewSurvey, onScan, onSwitchAccount, onOpenCart, cartCount }: AcTopBarProps) {
  return (
    <div className="relative -mx-7 mb-3 flex items-center justify-between border-b border-[#eee] px-7 pb-3">
      <div className="font-sans text-[19px] font-black tracking-[-0.01em] text-[#0a0a0a]">BEAUTY PASSPORT</div>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          aria-label="메뉴"
          onClick={onToggleMenu}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#0a0a0a] transition active:scale-90 active:bg-[#f4f4f5]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M4 12h16M4 6h16M4 18h16" />
          </svg>
        </button>
        <a
          href="/ingredients"
          aria-label="성분 검색"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#0a0a0a] transition active:scale-90 active:bg-[#f4f4f5]"
        >
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </a>
        <button
          type="button"
          aria-label="장바구니"
          onClick={onOpenCart}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#0a0a0a] transition active:scale-90 active:bg-[#f4f4f5]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ec1c24] px-1 text-[9px] font-extrabold text-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-[130]" onClick={onCloseMenu} />
          <div className="absolute right-7 top-full z-[131] mt-1 w-56 overflow-hidden rounded-2xl border-[1.5px] border-[#e7e7ea] bg-white shadow-[0_14px_36px_rgba(20,30,50,0.14)]">
            <button
              type="button"
              onClick={() => {
                onCloseMenu();
                onOpenPassport();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition active:bg-[#f4f4f5]"
            >
              <span className="text-[15px]">🛂</span>
              <span className="font-sans text-[13.5px] font-bold text-[#0a0a0a]">내 여권 보기</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onCloseMenu();
                onNewSurvey();
              }}
              className="flex w-full items-center gap-2.5 border-t border-[#f0f0f2] px-4 py-3 text-left transition active:bg-[#f4f4f5]"
            >
              <span className="text-[15px]">📝</span>
              <span className="font-sans text-[13.5px] font-bold text-[#0a0a0a]">새 피부 설문</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onCloseMenu();
                onScan();
              }}
              className="flex w-full items-center gap-2.5 border-t border-[#f0f0f2] px-4 py-3 text-left transition active:bg-[#f4f4f5]"
            >
              <span className="text-[15px]">📷</span>
              <span className="font-sans text-[13.5px] font-bold text-[#0a0a0a]">화장품 성분 스캔</span>
            </button>
            <a
              href="/ingredients"
              className="flex w-full items-center gap-2.5 border-t border-[#f0f0f2] px-4 py-3 text-left transition active:bg-[#f4f4f5]"
            >
              <span className="text-[15px]">🔍</span>
              <span className="font-sans text-[13.5px] font-bold text-[#0a0a0a]">성분 가이드</span>
            </a>
            <a
              href="/diagnose"
              className="flex w-full items-center gap-2.5 border-t border-[#f0f0f2] px-4 py-3 text-left transition active:bg-[#f4f4f5]"
            >
              <span className="text-[15px]">🧭</span>
              <span className="font-sans text-[13.5px] font-bold text-[#0a0a0a]">여행 피부 진단</span>
            </a>
            <button
              type="button"
              onClick={() => {
                onCloseMenu();
                onSwitchAccount();
              }}
              className="flex w-full items-center gap-2.5 border-t border-[#f0f0f2] px-4 py-3 text-left transition active:bg-[#f4f4f5]"
            >
              <span className="text-[15px]">↩️</span>
              <span className="font-sans text-[13.5px] font-bold text-[#71717a]">다른 계정으로 로그인</span>
            </button>
          </div>
        </>
      )}
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
