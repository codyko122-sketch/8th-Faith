"use client";

import { motion } from "framer-motion";
import { DESTINATIONS } from "@/lib/data";
import { buildCalendar, skinIssueIndex, recommendProducts } from "@/lib/logic";
import { KitForm } from "@/components/kit-form";

const section = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function Reveal({ i, children }: { i: number; children: React.ReactNode }) {
  return (
    <motion.section
      custom={i}
      variants={section}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.section>
  );
}

export function SkinReport({
  skinType,
  concerns,
  dest,
  days,
}: {
  skinType: string;
  concerns: string[];
  dest: string;
  days: number;
}) {
  const p = DESTINATIONS[dest] ?? DESTINATIONS["서울"];
  const idx = skinIssueIndex(dest, skinType, concerns);
  const cal = buildCalendar(dest, days);
  const routine = recommendProducts(skinType, concerns);
  const concTxt = concerns.length ? concerns.join(", ") : "없음";

  const summary =
    `${dest}은(는) ${p.tag} 기후로 평균 최고 ${p.temp}℃, 습도 ${p.humidity}%, ` +
    `UV ${p.uv}, 미세먼지 ${p.dust} 수준입니다. ${skinType} 피부` +
    (concerns.length ? `·${concerns.join("/")} 고민` : "") +
    `을(를) 고려할 때 ${days}일 여행 동안 피부 이슈 발생 가능성은 '${idx.level}'으로 예상됩니다.`;

  const metrics = [
    { icon: "🌡️", label: "평균기온", value: `${p.temp}℃` },
    { icon: "💧", label: "습도", value: `${p.humidity}%` },
    { icon: "☀️", label: "UV 지수", value: `${p.uv}` },
    { icon: "😷", label: "미세먼지", value: `${p.dust}` },
  ];

  return (
    <div className="mt-10 space-y-5">
      <Reveal i={0}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-serif text-3xl font-bold tracking-tight">
            {dest} 피부 리포트
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted">
          {skinType} · 고민: {concTxt} · {days}일 일정
        </p>
      </Reveal>

      {/* 기후 AI 서머리 */}
      <Reveal i={1}>
        <div className="rounded-[var(--radius-xl)] border border-line bg-card p-6 shadow-soft sm:p-7">
          <h3 className="font-serif text-xl font-semibold">🌦️ 기후 AI 서머리</h3>
          <p className="mt-2 text-[15px] leading-relaxed">{summary}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-2xl bg-cream-deep/60 px-4 py-3.5 text-center"
              >
                <div className="text-lg">{m.icon}</div>
                <div className="mt-0.5 text-xs text-muted">{m.label}</div>
                <div className="font-serif text-xl font-semibold">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* 피부 이슈 지수 */}
      <Reveal i={2}>
        <div className="rounded-[var(--radius-xl)] border border-line bg-card p-6 shadow-soft sm:p-7">
          <h3 className="font-serif text-xl font-semibold">📊 피부 이슈 지수</h3>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="font-serif text-5xl font-extrabold" style={{ color: idx.color }}>
              {idx.score}
            </span>
            <span className="font-semibold" style={{ color: idx.color }}>
              {idx.level}
            </span>
            <span className="text-sm text-muted">/ 100</span>
          </div>
          <div className="mt-3 h-3.5 overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full"
              style={{ background: idx.color }}
              initial={{ width: 0 }}
              animate={{ width: `${idx.score}%` }}
              transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <ul className="mt-4 space-y-1.5">
            {idx.notes.map((n, k) => (
              <li key={k} className="flex gap-2 text-sm text-muted">
                <span style={{ color: idx.color }}>•</span>
                {n}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      {/* 날씨 캘린더 */}
      <Reveal i={3}>
        <div className="rounded-[var(--radius-xl)] border border-line bg-card p-6 shadow-soft sm:p-7">
          <h3 className="font-serif text-xl font-semibold">📅 여행 날씨 캘린더</h3>
          <p className="mt-1 text-xs text-muted">
            ☀️맑음 🌤️대체로맑음 ⛅구름조금 ☁️흐림 🌫️안개 🌦️이슬비 🌧️비 🌨️눈 🌩️뇌우
          </p>
          <div className="scroll-x mt-4 flex gap-2.5 overflow-x-auto pb-2">
            {cal.map((c, k) => (
              <motion.div
                key={k}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + k * 0.03, duration: 0.3 }}
                className="flex min-w-[92px] flex-col items-center rounded-2xl border border-line bg-cream/40 px-3 py-3 text-center"
              >
                <div className="text-[13px] font-bold">
                  {c.date}
                  <span className="text-muted">({c.weekday})</span>
                </div>
                <div className="my-1.5 text-2xl leading-none">
                  {c.emojis.map((e) => e.icon).join("")}
                </div>
                <div className="text-[11px] text-muted">
                  {c.temp}℃ · 습도{c.humidity}%
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* 맞춤 루틴 */}
      <Reveal i={4}>
        <div className="rounded-[var(--radius-xl)] border border-line bg-card p-6 shadow-soft sm:p-7">
          <h3 className="font-serif text-xl font-semibold">🧴 맞춤 스킨케어 루틴</h3>
          {routine.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              선택하신 조건에 맞는 추천 제품이 없습니다. 피부 고민을 추가해 보세요.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-line">
              {routine.map((prod, k) => (
                <div key={prod.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent font-bold text-white">
                    {k + 1}
                  </div>
                  <div>
                    <b>
                      {prod.step} · {prod.name}
                    </b>
                    <p className="mt-0.5 text-sm text-muted">{prod.desc}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {prod.ingredients.map((ing) => (
                        <span
                          key={ing}
                          className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-accent-dark"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      {/* 키트 신청 */}
      <Reveal i={5}>
        <KitForm dest={dest} days={days} routine={routine} />
      </Reveal>
    </div>
  );
}
