"use client";

// 스캔 결과의 "알레르기·규제 성분 체크" 섹션.
// - AI가 라벨에서 읽어낸 알레르기 유발 가능 성분(allergens)
// - 규제 성분 DB 교차검증 결과(analyzeIngredients)
// 어디에도 "안전/반입 가능"을 단정하지 않고 "확인 필요/주의"로만 표기한다.

import { useMemo } from "react";
import { ShieldAlert, AlertTriangle, HelpCircle } from "lucide-react";
import { analyzeIngredients } from "@/lib/compliance/check";
import type { ConcernType } from "@/lib/compliance/types";
import type { ScanAllergen } from "@/lib/scan-types";

const CONCERN_LABEL: Record<ConcernType, string> = {
  allergen: "알레르기 주의",
  uv_filter: "자외선차단 성분",
  restricted_active: "활성 성분 규제",
  animal_derived: "동물 유래",
  mercury: "수은/중금속",
  hydroquinone: "미백 활성",
  cbd_cannabis: "대마 유래",
  preservative: "보존 성분",
};

// 심각도 색상: 강함(빨강) / 중간(노랑) / 정보(회색)
const CONCERN_TONE: Record<ConcernType, "high" | "mid" | "info"> = {
  mercury: "high",
  cbd_cannabis: "high",
  hydroquinone: "mid",
  restricted_active: "mid",
  uv_filter: "mid",
  allergen: "mid",
  animal_derived: "info",
  preservative: "info",
};

const TONE_STYLE: Record<"high" | "mid" | "info", { fg: string; bg: string; border: string }> = {
  high: { fg: "#c0322b", bg: "#fdecea", border: "#f3c2bd" },
  mid: { fg: "#8a5a00", bg: "#fdf4e3", border: "#f0dcae" },
  info: { fg: "#4b5563", bg: "#f3f4f6", border: "#e0e2e6" },
};

export function IngredientSafety({ ingredients, allergens }: { ingredients: string[]; allergens: ScanAllergen[] }) {
  const concerns = useMemo(() => analyzeIngredients(ingredients), [ingredients]);
  const hasAny = allergens.length > 0 || concerns.length > 0;

  return (
    <div className="mt-5">
      <div className="flex items-baseline gap-2">
        <span className="font-sans text-[14px] font-black text-[#0a0a0a]">알레르기 · 규제 성분 체크</span>
        <span className="font-sans text-[11px] font-bold tracking-[0.06em] text-[#9ca3af]">SAFETY</span>
      </div>

      {!hasAny ? (
        <div className="mt-2.5 rounded-xl border border-[#e7e7ea] bg-[#f7f8fa] px-3.5 py-3 font-sans text-[12px] leading-relaxed text-[#71717a]">
          <HelpCircle className="mb-1 h-3.5 w-3.5 text-[#9ca3af]" strokeWidth={2.4} />
          이 사진에서 확인된 주요 성분 중 알레르기·규제 주의 성분은 발견되지 않았어요. 다만 전성분 전체를 검증한 것은 아니므로 민감성 피부라면 라벨 확인이 필요해요.
        </div>
      ) : (
        <div className="mt-2.5 flex flex-col gap-2">
          {/* AI가 라벨에서 읽어낸 알레르기 유발 가능 성분 */}
          {allergens.map((a, i) => {
            const t = TONE_STYLE.mid;
            return (
              <div
                key={`al-${i}`}
                className="flex items-start gap-3 rounded-xl border px-3 py-2.5"
                style={{ borderColor: t.border, background: t.bg }}
              >
                <AlertTriangle className="mt-[2px] h-4 w-4 flex-none" style={{ color: t.fg }} strokeWidth={2.4} />
                <div className="min-w-0 flex-1">
                  <div className="font-sans text-[13.5px] font-extrabold" style={{ color: t.fg }}>
                    {a.name}
                  </div>
                  <div className="font-sans text-[11.5px] leading-relaxed text-[#71717a]">{a.note || "알레르기 유발 가능 성분입니다. 확인이 필요해요."}</div>
                </div>
                <span className="flex-none rounded-full px-2 py-0.5 font-sans text-[10px] font-extrabold" style={{ color: t.fg, background: "#fff" }}>
                  알레르겐
                </span>
              </div>
            );
          })}

          {/* 규제 성분 DB 교차검증 결과 */}
          {concerns.map((c, i) => {
            const tone = CONCERN_TONE[c.concern_type];
            const t = TONE_STYLE[tone];
            const Icon = tone === "high" ? ShieldAlert : tone === "mid" ? AlertTriangle : HelpCircle;
            return (
              <div
                key={`cc-${i}`}
                className="flex items-start gap-3 rounded-xl border px-3 py-2.5"
                style={{ borderColor: t.border, background: t.bg }}
              >
                <Icon className="mt-[2px] h-4 w-4 flex-none" style={{ color: t.fg }} strokeWidth={2.4} />
                <div className="min-w-0 flex-1">
                  <div className="font-sans text-[13.5px] font-extrabold" style={{ color: t.fg }}>
                    {c.inci_name}
                  </div>
                  <div className="font-sans text-[11.5px] leading-relaxed text-[#71717a]">{c.note}</div>
                  <div className="mt-1 font-sans text-[10px] text-[#9ca3af]">출처: {c.source} · 기준일 {c.as_of_date}</div>
                </div>
                <span className="flex-none rounded-full px-2 py-0.5 font-sans text-[10px] font-extrabold" style={{ color: t.fg, background: "#fff" }}>
                  {CONCERN_LABEL[c.concern_type]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-2 font-sans text-[10.5px] leading-relaxed text-[#a1a1aa]">
        ℹ️ 규제·알레르기 정보는 대표 성분 기준의 참고용이며, 안전을 보증하지 않습니다. 최종 확인은 제품 라벨·제조사·도착국 규정을 통해 하세요.
      </p>
    </div>
  );
}
