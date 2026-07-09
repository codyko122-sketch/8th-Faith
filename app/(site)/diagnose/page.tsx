"use client";

import { useRef, useState } from "react";
import { SKIN_TYPES, CONCERNS, DESTINATIONS } from "@/lib/data";
import { SkinReport } from "@/components/skin-report";

type Report = { skinType: string; concerns: string[]; dest: string; days: number };

export default function DiagnosePage() {
  const [skinType, setSkinType] = useState(SKIN_TYPES[0]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [dest, setDest] = useState(Object.keys(DESTINATIONS)[0]);
  const [days, setDays] = useState(5);
  const [report, setReport] = useState<Report | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  function toggleConcern(c: string) {
    setConcerns((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setReport({ skinType, concerns, dest, days });
    setTimeout(
      () => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      80
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pb-16 pt-10">
      <h1 className="font-serif text-4xl font-bold tracking-tight">피부 진단</h1>
      <p className="mt-2 text-muted">
        피부 정보와 여행 계획을 입력하면 맞춤 루틴과 기후 리포트를 만들어 드립니다.
      </p>

      <form
        onSubmit={submit}
        className="mt-6 rounded-[var(--radius-xl)] border border-line bg-card p-6 shadow-soft sm:p-8"
      >
        {/* 피부 타입 */}
        <label className="block text-sm font-semibold">피부 타입</label>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {SKIN_TYPES.map((t) => (
            <Chip key={t} active={skinType === t} onClick={() => setSkinType(t)}>
              {t}
            </Chip>
          ))}
        </div>

        {/* 피부 고민 */}
        <label className="mt-6 block text-sm font-semibold">
          피부 고민 <span className="font-normal text-muted">(복수 선택)</span>
        </label>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {CONCERNS.map((c) => (
            <Chip key={c} active={concerns.includes(c)} onClick={() => toggleConcern(c)}>
              {c}
            </Chip>
          ))}
        </div>

        {/* 여행지 + 일수 */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold" htmlFor="dest">
              여행지
            </label>
            <div className="relative mt-2.5">
              <select
                id="dest"
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                className="w-full appearance-none rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
              >
                {Object.entries(DESTINATIONS).map(([d, v]) => (
                  <option key={d} value={d}>
                    {d} ({v.tag})
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">
                ▾
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold" htmlFor="days">
              여행 일수 <span className="font-normal text-accent-dark">{days}일</span>
            </label>
            <input
              id="days"
              type="range"
              min={1}
              max={30}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="mt-4 w-full accent-accent"
            />
            <div className="mt-1 flex justify-between text-xs text-muted">
              <span>1일</span>
              <span>30일</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="mt-8 w-full rounded-full bg-accent px-6 py-3.5 font-semibold text-white transition hover:bg-accent-dark"
        >
          맞춤 리포트 생성 →
        </button>
      </form>

      <div ref={reportRef}>
        {report && (
          <SkinReport
            key={`${report.dest}-${report.days}-${report.skinType}-${report.concerns.join(",")}`}
            skinType={report.skinType}
            concerns={report.concerns}
            dest={report.dest}
            days={report.days}
          />
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition ${
        active
          ? "border-accent bg-accent text-white"
          : "border-line bg-white text-ink hover:border-accent/50 hover:bg-accent-soft/40"
      }`}
    >
      {children}
    </button>
  );
}
