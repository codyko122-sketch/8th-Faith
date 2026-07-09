"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { PRODUCTS } from "@/lib/data";

export default function IngredientsPage() {
  const [q, setQ] = useState("");

  const matched = useMemo(() => {
    const query = q.trim();
    if (!query) return PRODUCTS;
    return PRODUCTS.filter(
      (p) =>
        p.name.includes(query) ||
        p.ingredients.some((ing) => ing.includes(query)) ||
        p.forConcerns.some((c) => c.includes(query))
    );
  }, [q]);

  return (
    <div className="mx-auto max-w-3xl px-6 pb-16 pt-10">
      <h1 className="font-serif text-4xl font-bold tracking-tight">성분 검색</h1>
      <p className="mt-2 text-muted">
        제품명·성분명·고민 키워드로 검색해 보세요. (예: 나이아신, 여드름, 세라마이드)
      </p>

      <div className="mt-6 flex items-center gap-3 rounded-full border border-line bg-card px-5 py-3 shadow-soft focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--color-accent-soft)]">
        <Search className="h-5 w-5 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="성분 또는 고민 키워드"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
        />
      </div>

      <p className="mt-5 text-sm text-muted">{matched.length}개 제품</p>

      {matched.length === 0 ? (
        <div className="mt-3 rounded-[var(--radius-xl)] border border-line bg-card p-10 text-center text-muted">
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {matched.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
              className="rounded-[var(--radius-xl)] border border-line bg-card p-5 shadow-soft sm:p-6"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-lg font-semibold">{p.name}</h3>
                <span className="rounded-full bg-cream-deep px-2.5 py-0.5 text-xs text-muted">
                  {p.step}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{p.desc}</p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-accent-dark">🧪 주요 성분</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {p.ingredients.map((ing) => (
                      <span
                        key={ing}
                        className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-accent-dark"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-accent-dark">🎯 추천 고민</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {p.forConcerns.map((c) => (
                      <span
                        key={c}
                        className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
