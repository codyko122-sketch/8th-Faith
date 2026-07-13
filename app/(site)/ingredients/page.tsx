"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, AlertTriangle } from "lucide-react";
import { INGREDIENT_CATEGORIES, searchIngredients } from "@/lib/ingredients-data";

export default function IngredientsPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("전체");
  const searchRef = useRef<HTMLInputElement>(null);

  const matched = useMemo(() => searchIngredients(q, category), [q, category]);
  const categories = ["전체", ...INGREDIENT_CATEGORIES];

  // 페이지 진입 시 검색창에 바로 포커스(다른 페이지에서 '성분 검색' 클릭 후 도착 포함)
  useEffect(() => {
    searchRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="mx-auto max-w-[480px] px-6 pb-16 pt-8">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="이전 페이지로"
          className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-[#e7e7ea] bg-white text-[#0a0a0a] transition active:bg-[#f4f4f5]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="mt-4 font-sans text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#9ca3af]">Ingredients</div>
        <h1 className="mt-1.5 text-[30px] font-black tracking-[-0.02em] text-[#0a0a0a]" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
          성분 검색
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#71717a]">
          화장품 성분을 검색해 효능과 주의사항을 확인하세요.
          <br />
          (예: 나이아신아마이드, 레티놀, BHA)
        </p>

        {/* 검색창 */}
        <div className="mt-5 flex items-center gap-2.5 rounded-2xl border-[1.5px] border-[#e7e7ea] bg-[#f4f4f5] px-4 py-3 transition focus-within:border-[#0a0a0a] focus-within:bg-white">
          <Search className="h-[18px] w-[18px] flex-none text-[#9ca3af]" />
          <input
            ref={searchRef}
            id="ingredient-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="성분명·영문(INCI)·효능 키워드"
            className="w-full bg-transparent text-[14px] text-[#0a0a0a] outline-none placeholder:text-[#b0b0b8]"
          />
        </div>

        {/* 카테고리 필터 */}
        <div className="scroll-x mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {categories.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`flex-none rounded-full border-[1.5px] px-3.5 py-1.5 text-[13px] font-bold transition ${
                  active ? "border-[#0a0a0a] bg-[#0a0a0a] text-white" : "border-[#e7e7ea] bg-white text-[#3f3f46]"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-[12px] font-bold text-[#9ca3af]">{matched.length}개 성분</p>

        {matched.length === 0 ? (
          <div className="mt-2 rounded-2xl border-[1.5px] border-dashed border-[#e0e2e6] bg-[#fafafa] p-10 text-center text-[13px] text-[#9ca3af]">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-2.5">
            {matched.map((ing, i) => (
              <motion.div
                key={ing.name}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.3 }}
                className="rounded-2xl border-[1.5px] border-[#e7e7ea] bg-white p-[15px]"
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <h3 className="text-[16px] font-black text-[#0a0a0a]">{ing.name}</h3>
                  <span className="text-[12px] text-[#9ca3af]">{ing.inci}</span>
                  <span className="ml-auto flex-none rounded-full bg-[#f4f4f5] px-2.5 py-0.5 text-[11px] font-bold text-[#71717a]">{ing.category}</span>
                </div>

                <p className="mt-2 text-[13.5px] leading-relaxed text-[#3f3f46]">{ing.effect}</p>

                {ing.goodFor.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {ing.goodFor.map((g) => (
                      <span key={g} className="rounded-full bg-[#f4f4f5] px-2.5 py-1 text-[11px] font-semibold text-[#3f3f46]">
                        #{g}
                      </span>
                    ))}
                  </div>
                )}

                {ing.caution && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-xl border-l-[3px] border-[#e5a400] bg-[#fdf6e3] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#8a6100]">
                    <AlertTriangle className="mt-[1px] h-4 w-4 flex-none" strokeWidth={2.2} />
                    <span>{ing.caution}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        <p className="mt-6 text-[11px] leading-relaxed text-[#a1a1aa]">
          ※ 성분 정보는 일반적인 참고용이며 의학적 판정이 아닙니다. 실제 효과·자극은 제품의 전성분·농도·개인 피부에 따라 달라질 수 있어요.
        </p>
      </div>
    </div>
  );
}
