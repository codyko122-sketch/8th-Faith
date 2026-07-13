"use client";

// 성분 기반 반입 주의 배지.
// "반입 가능/안전"을 단정하지 않는다. 오직 주의 환기 + 확인 유도.
// 배지 클릭 시 flags 상세 + source + as_of_date + disclaimer 를 펼친다.

import { useState } from "react";
import { ShieldAlert, AlertTriangle, HelpCircle, Info, FileWarning, Plane, ChevronDown } from "lucide-react";
import { checkCosmeticCompliance } from "@/lib/compliance/check";
import type { ComplianceStatus } from "@/lib/compliance/types";
import productsRaw from "@/data/products.json";
import type { ComplianceProduct } from "@/lib/compliance/types";

const PRODUCTS = productsRaw as ComplianceProduct[];

type BadgeLang = "ko" | "jp" | "en";

const STATUS_META: Record<
  ComplianceStatus,
  { label: Record<BadgeLang, string>; fg: string; bg: string; border: string; Icon: typeof ShieldAlert }
> = {
  high_risk: { label: { ko: "반입 제한 주의", jp: "持ち込み制限注意", en: "Import restriction caution" }, fg: "#c0322b", bg: "#fdecea", border: "#f3c2bd", Icon: ShieldAlert },
  caution: { label: { ko: "확인 권장", jp: "確認推奨", en: "Verification recommended" }, fg: "#8a5a00", bg: "#fdf4e3", border: "#f0dcae", Icon: AlertTriangle },
  verify_needed: { label: { ko: "직접 확인 필요", jp: "要確認", en: "Verification needed" }, fg: "#4b5563", bg: "#f3f4f6", border: "#e0e2e6", Icon: HelpCircle },
  no_flag: { label: { ko: "특이 규제 매칭 없음", jp: "該当規制なし", en: "No matching regulation" }, fg: "#6b7280", bg: "#f7f8fa", border: "#eceef1", Icon: Info },
};

const BADGE_TR = {
  ingredientsIncomplete: { ko: "성분정보 불완전", jp: "成分情報不完全", en: "Incomplete ingredient info" },
  ingredientsIncompleteTitle: { ko: "확인된 전성분 정보가 불완전한 제품입니다.", jp: "確認済みの全成分情報が不完全な製品です。", en: "This product's full ingredient data is incomplete." },
  noMatch: { ko: "대표 규제 성분 목록과 매칭된 항목이 없습니다.", jp: "代表的な規制成分リストと一致する項目はありません。", en: "No matches found against the representative list of regulated ingredients." },
  source: { ko: "출처", jp: "出典", en: "Source" },
  asOf: { ko: "기준일", jp: "基準日", en: "As of" },
  count: { ko: "건", jp: "件", en: "" },
} as const;
function bt(key: keyof typeof BADGE_TR, lang: BadgeLang): string {
  return BADGE_TR[key][lang];
}

function productByCosmeticId(cosmeticId: string): ComplianceProduct | undefined {
  return PRODUCTS.find((p) => p.cosmetic_id === cosmeticId);
}

export function ComplianceBadge({
  cosmeticId,
  destinationCountry,
  compact = false,
  lang = "ko",
}: {
  cosmeticId: string;
  destinationCountry: string | null;
  compact?: boolean;
  lang?: BadgeLang;
}) {
  const [open, setOpen] = useState(false);
  const product = productByCosmeticId(cosmeticId);
  // 규제 데이터가 없는 제품(스펙 15종 외)은 배지를 표시하지 않는다.
  if (!product) return null;

  const result = checkCosmeticCompliance(product.ingredients_inci, destinationCountry ?? "", {
    ingredientsComplete: product.ingredients_complete,
    category: product.category,
    lang,
  });

  const meta = STATUS_META[result.status];
  const { Icon } = meta;
  const flagCount = result.flags.length;

  return (
    <div className={compact ? "mt-1.5" : "mt-2"}>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-bold"
          style={{ color: meta.fg, background: meta.bg, borderColor: meta.border }}
          aria-expanded={open}
        >
          <Icon className="h-3 w-3" strokeWidth={2.4} />
          {meta.label[lang]}
          {flagCount > 0 && <span className="opacity-70">· {flagCount}{bt("count", lang)}</span>}
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2.4} />
        </button>

        {product.ingredients_complete === false && (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-[#e0e2e6] bg-[#f7f8fa] px-2 py-0.5 text-[10.5px] font-semibold text-[#6b7280]"
            title={bt("ingredientsIncompleteTitle", lang)}
          >
            <FileWarning className="h-3 w-3" strokeWidth={2.4} />
            {bt("ingredientsIncomplete", lang)}
          </span>
        )}
      </div>

      {open && (
        <div
          className="mt-1.5 rounded-xl border p-2.5 text-[11px] leading-relaxed"
          style={{ borderColor: meta.border, background: "#fff" }}
          onClick={(e) => e.stopPropagation()}
        >
          {result.flags.length > 0 ? (
            <ul className="space-y-2">
              {result.flags.map((f, i) => (
                <li key={i} className="border-b border-dashed border-[#eee] pb-2 last:border-0 last:pb-0">
                  <div className="font-bold" style={{ color: meta.fg }}>
                    {f.ingredient} <span className="text-[#9ca3af]">({f.concern_type})</span>
                  </div>
                  <div className="mt-0.5 text-[#3f3f46]">{f.message_ko}</div>
                  <div className="mt-1 text-[10px] text-[#9ca3af]">
                    {bt("source", lang)}: {f.source} · {bt("asOf", lang)} {f.as_of_date}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-[#52525b]">{bt("noMatch", lang)}</div>
          )}

          <div className="mt-2 space-y-1.5 text-[10px] text-[#71717a]">
            <p>⚠️ {result.coverage_warning}</p>
            {result.partial_data_warning && <p>🔎 {result.partial_data_warning}</p>}
            {result.aviation_note && (
              <p className="flex items-start gap-1">
                <Plane className="mt-[1px] h-3 w-3 flex-none" strokeWidth={2.2} />
                {result.aviation_note}
              </p>
            )}
            <p className="text-[#a1a1aa]">ℹ️ {result.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
}
