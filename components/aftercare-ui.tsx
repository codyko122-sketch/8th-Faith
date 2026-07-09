"use client";

import type { ReactNode } from "react";
import { useState } from "react";
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

export function AcHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: ReactNode; subtitle: string }) {
  return (
    <div className={styles.top}>
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>
          <span>{title}</span>
          <AftercarePlaneIcon className={styles.plane} />
        </h1>
        <p className={styles.subtitle}>{subtitle}</p>
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

export function AcStampRect() {
  return (
    <div className={styles.stampwrap}>
      <div className={styles.stampRect}>
        <div className={styles.s1}>BEAUTY PASSPORT</div>
        <div className={styles.s2}>CLEARED</div>
        <div className={styles.s3}>CLIMATE CARE</div>
      </div>
    </div>
  );
}

export function AcStampSeal() {
  return (
    <div className={styles.stampwrap}>
      <div className={styles.stampSeal}>
        <div className={styles.st}>SKIN CLINIC</div>
        <div className={styles.rx}>℞</div>
        <div className={styles.sb}>처방 완료</div>
      </div>
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
  const [bars] = useState(() => {
    let seed = 0;
    for (const ch of seedKey || "BP") seed = (seed * 31 + ch.charCodeAt(0)) % 100000;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    return Array.from({ length: 52 }, () => ({ w: 1 + Math.floor(rnd() * 3), on: rnd() > 0.15 }));
  });
  return (
    <div className={styles.barcode}>
      {bars.map((b, i) => (
        <i key={i} style={{ width: b.w, opacity: b.on ? 1 : 0 }} />
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
  children,
}: {
  step: number;
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  footerCode: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.root}>
      <AcHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <AcSteps current={step} />
      {children}
      <AcFooter code={footerCode} />
    </div>
  );
}
