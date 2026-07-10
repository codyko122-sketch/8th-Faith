// 화장품 반입 주의 플래그 — 핵심 매칭·판정 로직
//
// checkCosmeticCompliance() 는 "반입 가능/불가"를 절대 단정하지 않는다.
// 매칭된 대표 규제 성분에 대해 정보성 위험 수준(high_risk/caution/verify_needed/no_flag)만 반환하고,
// 항상 coverage_warning / disclaimer 를 함께 노출한다.

import restrictedRaw from "../../data/restricted-ingredients.json";
import countryRulesRaw from "../../data/country-rules.json";
import aviationRaw from "../../data/aviation-rules.json";
import type {
  RestrictedIngredient,
  CountryRule,
  ComplianceFlag,
  ComplianceResult,
  ComplianceStatus,
  ConcernType,
  FlagLevel,
} from "./types";

const RESTRICTED = restrictedRaw as RestrictedIngredient[];
const COUNTRY_RULES = countryRulesRaw as CountryRule[];
const AVIATION = aviationRaw as {
  carry_on: { liquid_container_max_ml: number; liquid_total_max_ml: number; packaging_note: string; note: string };
  flammable_prohibited: string[];
  duty_free_exemption: string;
  source: string;
  as_of_date: string;
};

// 국가 concern_flags 로 판정하는 concern_type (지역 정책이 아니라 국가별 값 사용)
const COUNTRY_FLAG_CONCERNS: ConcernType[] = ["mercury", "hydroquinone", "cbd_cannabis", "animal_derived"];

const SEVERITY: Record<ComplianceStatus, number> = {
  no_flag: 0,
  verify_needed: 1,
  caution: 2,
  high_risk: 3,
};

// 제형(액상/크림/에어로졸)으로 간주해 항공 안내를 붙일 카테고리
const LIQUID_CATEGORIES = new Set(["toner", "serum", "ampoule", "cream", "cleanser", "sunscreen", "essence", "lotion", "mist", "oil"]);

const COVERAGE_WARNING =
  "이 결과는 대표 규제 성분 목록과의 매칭 결과이며, 제품의 전체 성분을 검증한 것이 아닙니다. 매칭된 성분이 없어도 '안전' 또는 '반입 가능'을 의미하지 않습니다.";

const DISCLAIMER =
  "규정은 수시로 변경될 수 있으며, 최종 반입 가능 여부는 도착국 세관·관련 기관을 통해 확인해야 합니다. 본 안내는 법적 판정이 아닙니다.";

const PARTIAL_DATA_WARNING =
  "이 제품은 확인된 전성분 정보가 불완전합니다. 실제 반입 전 브랜드 공식 채널에서 전성분을 재확인하세요.";

// 매칭 정규화: 소문자 + 공백/하이픈/언더스코어/쉼표 제거
function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-_,·]/g, "");
}

// 부분 일치 매칭(양방향). 지나친 오매칭을 막기 위해 최소 3자 이상 토큰만 사용.
function ingredientMatches(ingredient: string, ri: RestrictedIngredient): boolean {
  const n = normalize(ingredient);
  if (n.length < 3) return false;
  const names = [ri.inci_name, ...ri.aliases];
  return names.some((name) => {
    const nm = normalize(name);
    if (nm.length < 3) return false;
    return n.includes(nm) || nm.includes(n);
  });
}

// 알 수 없는 국가용 폴백 규칙(전부 verify_needed, 지역 매칭 없음).
function fallbackRule(code: string): CountryRule {
  return {
    country_code: code || "UNKNOWN",
    country_name_ko: "선택한 여행지",
    regulatory_region: "UNKNOWN",
    concern_flags: {
      mercury: "verify_needed",
      hydroquinone: "verify_needed",
      cbd_cannabis: "verify_needed",
      animal_derived: "verify_needed",
    },
    personal_import_note: "여행지 규정을 확인할 수 없어 직접 확인이 필요합니다 (verify_needed).",
    product_class_note: "여행지 규정 확인이 필요합니다 (verify_needed).",
    source: "미등록 국가 — verify_needed",
    as_of_date: "2026-07-10",
  };
}

// concern_type + 국가에 따른 위험 수준 산출
function levelFor(ri: RestrictedIngredient, country: CountryRule): FlagLevel {
  if (COUNTRY_FLAG_CONCERNS.includes(ri.concern_type)) {
    // 국가별 concern_flags 사용 (mercury/hydroquinone/cbd_cannabis/animal_derived)
    const key = ri.concern_type as "mercury" | "hydroquinone" | "cbd_cannabis" | "animal_derived";
    return country.concern_flags[key];
  }
  // uv_filter / allergen / restricted_active / preservative → 지역 정책
  const regions = ri.flag_regions ?? [];
  if (regions.includes(country.regulatory_region)) return ri.flag_level ?? "caution";
  return ri.else_level ?? "no_flag";
}

// 사용자용 메시지 생성. 어디에도 "안전/반입 가능"을 단정하지 않는다.
function buildMessage(ri: RestrictedIngredient, country: CountryRule, level: FlagLevel): string {
  const c = country.country_name_ko;
  const ing = ri.inci_name;
  switch (ri.concern_type) {
    case "uv_filter":
      return `[${c}] '${ing}'(자외선차단 성분)을 포함합니다. ${c}에서 승인한 자외선차단 성분 목록에 없어 반입·판매가 제한될 수 있습니다. 개인 사용 목적 반입 가능 여부는 확인이 필요합니다.`;
    case "allergen":
      return `[${c}] '${ing}'을(를) 포함합니다. 반입 금지 성분이 아니라, ${c}에서 향료 알레르겐 '표시(라벨링)' 대상이 되는 성분입니다. 라벨 표기 여부 확인이 필요합니다.`;
    case "restricted_active":
      if (level === "caution")
        return `[${c}] '${ing}'을(를) 포함합니다. 반입 금지가 아니라, ${c}에서 함량 기준(예: Annex III) 규제 대상 성분으로 함량에 따라 제한될 수 있습니다. 확인이 필요합니다.`;
      return `[${c}] '${ing}'을(를) 포함합니다. 제품 내 함량 정보가 확인되지 않아, ${c} 기준 적합 여부는 직접 확인이 필요합니다.`;
    case "animal_derived":
      return `[${c}] '${ing}'(동물 유래 가능 성분)을 포함합니다. 일부 국가는 동물성 유래 원료에 대해 검역·바이오시큐리티 절차가 별도로 있을 수 있어, ${c} 규정 확인이 필요합니다.`;
    case "mercury":
      return `[${c}] '${ing}'을(를) 포함합니다. 다수 국가에서 화장품 내 사용이 금지되어 반입이 제한될 수 있습니다. 반드시 확인하세요.`;
    case "hydroquinone":
      return `[${c}] '${ing}'을(를) 포함합니다. 국가에 따라 전문의약품으로 분류되어 반입이 제한될 수 있습니다. 확인이 필요합니다.`;
    case "cbd_cannabis":
      return `[${c}] '${ing}'을(를) 포함합니다. 일부 국가는 반입을 엄격히 금지하므로 반입이 제한될 수 있습니다. 반드시 확인하세요.`;
    case "preservative":
    default:
      return `[${c}] '${ing}'을(를) 포함합니다. ${c} 기준 적합 여부는 확인이 필요합니다.`;
  }
}

function aviationNoteFor(category?: string): string | null {
  if (!category || !LIQUID_CATEGORIES.has(category)) return null;
  return (
    `기내 반입 시 개별 용기 ${AVIATION.carry_on.liquid_container_max_ml}ml 이하, ` +
    `전체 ${AVIATION.carry_on.liquid_total_max_ml}ml(1L) 지퍼백 기준을 확인하세요(일반 기준). ` +
    `인화성(고알코올·에어로졸) 제품은 별도 제한이 있을 수 있습니다.`
  );
}

export type ComplianceOptions = {
  ingredientsComplete?: boolean;
  category?: string;
  // 테스트/재현성을 위해 타임스탬프 주입 가능(미지정 시 현재 시각)
  now?: string;
};

/**
 * 제품 전성분(INCI)과 도착국 코드를 받아 반입 주의 플래그를 산출한다.
 * "반입 가능/불가"를 단정하지 않으며, 불확실하면 verify_needed 로 보존한다.
 */
export function checkCosmeticCompliance(
  productIngredients: string[],
  destinationCountry: string,
  opts: ComplianceOptions = {}
): ComplianceResult {
  const country = COUNTRY_RULES.find((c) => c.country_code === destinationCountry) ?? fallbackRule(destinationCountry);

  const flags: ComplianceFlag[] = [];
  const seen = new Set<string>();

  for (const ingredient of productIngredients) {
    for (const ri of RESTRICTED) {
      if (!ingredientMatches(ingredient, ri)) continue;
      const level = levelFor(ri, country);
      // no_flag 수준이면 플래그를 만들지 않는다(해당 국가에서 문제되지 않는 성분).
      if (level === "no_flag") continue;
      const dedupeKey = `${ri.inci_name}|${ri.concern_type}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      flags.push({
        ingredient: ri.inci_name,
        concern_type: ri.concern_type,
        level,
        message_ko: buildMessage(ri, country, level),
        source: ri.source,
        as_of_date: ri.as_of_date,
      });
    }
  }

  // 상태 = 플래그 중 최고 심각도, 없으면 no_flag
  let status: ComplianceStatus = "no_flag";
  for (const f of flags) {
    if (SEVERITY[f.level] > SEVERITY[status]) status = f.level;
  }

  const partial_data_warning = opts.ingredientsComplete === false ? PARTIAL_DATA_WARNING : null;

  return {
    status,
    flags,
    coverage_warning: COVERAGE_WARNING,
    partial_data_warning,
    aviation_note: aviationNoteFor(opts.category),
    disclaimer: DISCLAIMER,
    checked_at: opts.now ?? new Date().toISOString(),
  };
}
