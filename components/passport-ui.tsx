"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";

// BEAUTY PASSPORT 로그인/회원 화면 전용 디자인 토큰 기반 공용 컴포넌트.
// 색상: bg #e4e4e7 · card #fff · ink #0a0a0a · ink-70 #3f3f46 · fill #f4f4f5
// line #e7e7ea · muted #9ca3af · sub #71717a · stamp(브랜드 레드) #ec1c24

export function PassportTopBar({ onBack }: { onBack?: () => void }) {
  return (
    <div className="mb-2.5 flex h-9 items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로 가기"
        className={`flex h-9 w-9 flex-none items-center justify-center rounded-[11px] border-[1.5px] border-[#e7e7ea] bg-white text-[#0a0a0a] transition active:scale-90 active:bg-[#f4f4f5] ${
          onBack ? "" : "invisible pointer-events-none"
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/passport-seal.png" alt="" className="h-[42px] w-auto flex-none" />
    </div>
  );
}

export function PassportEyebrow({ children }: { children: ReactNode }) {
  return <div className="font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-[#71717a]">{children}</div>;
}

export function PassportTitle({ children }: { children: ReactNode }) {
  return (
    <h1
      className="mt-3.5 text-[clamp(30px,8.4vw,37px)] font-black leading-[0.92] tracking-[-0.02em] text-[#0a0a0a]"
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      {children}
    </h1>
  );
}

export function PassportKSub({ children }: { children: ReactNode }) {
  return (
    <p className="relative mt-2.5 pt-2 font-sans text-[15px] font-bold text-[#3f3f46] before:absolute before:left-0 before:top-0 before:h-[3px] before:w-[34px] before:bg-[#0a0a0a]">
      {children}
    </p>
  );
}

type PassportFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; labelKo: string };

export function PassportField({ label, labelKo, className, ...rest }: PassportFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-[13px] font-extrabold text-[#0a0a0a]">
        {label} <span className="ml-1 font-sans text-[12px] font-medium text-[#9ca3af]">· {labelKo}</span>
      </label>
      <input
        className={`w-full rounded-[13px] border border-transparent bg-[#f4f4f5] px-4 py-[15px] font-sans text-sm text-[#0a0a0a] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0a0a0a] focus:bg-white ${className ?? ""}`}
        {...rest}
      />
    </div>
  );
}

export function PassportButton({
  children,
  variant = "primary",
  ...rest
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "muted";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`flex w-full items-center justify-center gap-2 rounded-[14px] px-4 py-[17px] font-sans text-[15px] font-extrabold transition active:scale-[0.985] disabled:cursor-not-allowed ${
        variant === "primary"
          ? "bg-[#0a0a0a] text-white disabled:bg-[#d4d4d8] disabled:text-[#fafafa]"
          : variant === "muted"
            ? "bg-[#f4f4f5] text-[#0a0a0a] active:bg-[#e7e7ea]"
            : "border-[1.5px] border-[#e7e7ea] bg-white text-[#0a0a0a] active:bg-[#f4f4f5]"
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function PassportDivider({ children }: { children: ReactNode }) {
  return (
    <div className="my-3 flex items-center gap-3 font-sans text-[11px] font-semibold tracking-[0.1em] text-[#9ca3af]">
      <span className="h-px flex-1 bg-[#e7e7ea]" />
      {children}
      <span className="h-px flex-1 bg-[#e7e7ea]" />
    </div>
  );
}

export function PassportBackLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="mt-4 w-full text-center font-sans text-[13px] text-[#71717a]">
      {children}
    </button>
  );
}

export function PassportError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="font-sans text-[13px] font-semibold text-[#ec1c24]">{children}</p>;
}

export function PassportNote({ children }: { children: ReactNode }) {
  return <div className="mt-1.5 rounded-xl bg-[#f4f4f5] px-3.5 py-2.5 font-sans text-[14.5px] leading-relaxed text-[#71717a] [&_p]:m-0 [&_p+p]:mt-0.5 [&_b]:font-extrabold [&_b]:text-[#0a0a0a]">{children}</div>;
}

export function PassportOptionCard({
  selected,
  onClick,
  icon,
  en,
  ko,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  en: string;
  ko: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl border-[1.5px] bg-white p-[18px] text-left transition active:scale-[0.99] ${
        selected ? "border-[#0a0a0a] bg-[#fafafa]" : "border-[#e7e7ea]"
      }`}
    >
      <span className={`flex h-[46px] w-[46px] flex-none items-center justify-center rounded-xl ${selected ? "bg-[#0a0a0a]" : "bg-[#f4f4f5]"}`}>{icon}</span>
      <span className="flex-1">
        <span className="block font-sans text-[11px] font-extrabold tracking-[0.14em] text-[#9ca3af]">{en}</span>
        <span className="mt-0.5 block font-sans text-[16px] font-black text-[#0a0a0a]">{ko}</span>
        <span className="mt-1 block font-sans text-[11.5px] text-[#71717a]">{desc}</span>
      </span>
      <svg className={`h-[18px] w-[18px] flex-none ${selected ? "text-[#0a0a0a]" : "text-[#9ca3af]"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}

export function PassportBarcode() {
  const [widths] = useState(() => Array.from({ length: 46 }, () => Math.round(Math.random() * 18 + 26)));
  return (
    <div className="my-3 flex h-11 items-end justify-center gap-[1.5px]">
      {widths.map((h, i) => (
        <span key={i} className="w-[2px] bg-[#0a0a0a]" style={{ height: h }} />
      ))}
    </div>
  );
}

export function PassportFooter() {
  return (
    <footer className="mt-5 border-t-[1.5px] border-dashed border-[#e7e7ea] pt-4 text-center">
      <div className="font-sans text-[11px] font-extrabold tracking-[0.32em] text-[#0a0a0a]">BEAUTY PASSPORT</div>
      <PassportBarcode />
      <div className="font-sans text-xs font-bold tracking-[0.28em] text-[#ec1c24]">BP 000 23 040 07</div>
    </footer>
  );
}

export function PassportStampChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block -rotate-[4deg] rounded-full border-[1.5px] border-[#ec1c24] px-[9px] py-1 font-sans text-[9px] font-extrabold tracking-[0.12em] text-[#ec1c24]">
      {children}
    </span>
  );
}

export function PassportTag({ children }: { children: ReactNode }) {
  return <span className="rounded-lg bg-[#f4f4f5] px-2.5 py-1.5 font-sans text-[11px] font-semibold text-[#3f3f46]">{children}</span>;
}

export function PassportPlaneIcon({ selected, className }: { selected?: boolean; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/assets/passport-plane.png"
      alt=""
      className={className ?? "w-[26px]"}
      style={selected ? { filter: "brightness(0) invert(1)" } : undefined}
    />
  );
}

export function PassportBeachIcon({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/assets/passport-beach.png" alt="" className={className ?? "w-[74px]"} />;
}

export function PassportSurveyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="#0a0a0a" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" className={className ?? "w-[66px] -rotate-[10deg]"}>
      <rect x="7" y="9" width="29" height="45" rx="6" />
      <line x1="13" y1="17" x2="24" y2="17" />
      <line x1="13" y1="24" x2="30" y2="24" />
      <line x1="13" y1="31" x2="30" y2="31" />
      <line x1="13" y1="39" x2="30" y2="39" />
      <line x1="13" y1="46" x2="26" y2="46" />
      <circle cx="43" cy="30" r="15" fill="#ffffff" />
      <circle cx="43" cy="30" r="10" />
      <line x1="53.5" y1="40.5" x2="60" y2="47" strokeWidth={5.5} />
    </svg>
  );
}
