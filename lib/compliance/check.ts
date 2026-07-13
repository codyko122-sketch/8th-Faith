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
  IngredientConcern,
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

export type ComplianceLang = "ko" | "jp" | "en";

const COVERAGE_WARNING: Record<ComplianceLang, string> = {
  ko: "이 결과는 대표 규제 성분 목록과의 매칭 결과이며, 제품의 전체 성분을 검증한 것이 아닙니다. 매칭된 성분이 없어도 '안전' 또는 '반입 가능'을 의미하지 않습니다.",
  jp: "この結果は代表的な規制成分リストとの照合結果であり、製品の全成分を検証したものではありません。該当成分がなくても「安全」または「持ち込み可能」を意味しません。",
  en: "This result is based on matching against a representative list of regulated ingredients — it is not a verification of the product's full ingredient list. No match doesn't mean 'safe' or 'importable.'",
};

const DISCLAIMER: Record<ComplianceLang, string> = {
  ko: "규정은 수시로 변경될 수 있으며, 최종 반입 가능 여부는 도착국 세관·관련 기관을 통해 확인해야 합니다. 본 안내는 법적 판정이 아닙니다.",
  jp: "規定は随時変更される可能性があり、最終的な持ち込み可否は到着国の税関・関連機関を通じて確認する必要があります。本案内は法的判断ではありません。",
  en: "Regulations can change at any time — final import eligibility should be confirmed with customs or relevant authorities at your destination. This guidance is not a legal determination.",
};

const PARTIAL_DATA_WARNING: Record<ComplianceLang, string> = {
  ko: "이 제품은 확인된 전성분 정보가 불완전합니다. 실제 반입 전 브랜드 공식 채널에서 전성분을 재확인하세요.",
  jp: "この製品は確認済みの全成分情報が不完全です。実際の持ち込み前にブランドの公式チャンネルで全成分を再確認してください。",
  en: "Full ingredient data for this product is incomplete. Please double-check the full ingredient list via the brand's official channels before you travel.",
};

// 언어 전환(KO/JP/EN) — 국가명·성분명 등 이 모듈 안에서만 쓰는 짧은 고정 어휘 번역.
const COUNTRY_NAME_TR: Record<string, { jp: string; en: string }> = {
  "한국": { jp: "韓国", en: "Korea" },
  "미국": { jp: "アメリカ", en: "United States" },
  "유럽연합": { jp: "EU", en: "European Union" },
  "영국": { jp: "イギリス", en: "United Kingdom" },
  "프랑스": { jp: "フランス", en: "France" },
  "이탈리아": { jp: "イタリア", en: "Italy" },
  "스페인": { jp: "スペイン", en: "Spain" },
  "일본": { jp: "日本", en: "Japan" },
  "태국": { jp: "タイ", en: "Thailand" },
  "베트남": { jp: "ベトナム", en: "Vietnam" },
  "인도네시아": { jp: "インドネシア", en: "Indonesia" },
  "싱가포르": { jp: "シンガポール", en: "Singapore" },
  "중국": { jp: "中国", en: "China" },
  "호주": { jp: "オーストラリア", en: "Australia" },
  "몰디브": { jp: "モルディブ", en: "Maldives" },
  "선택한 여행지": { jp: "選択した旅行先", en: "your destination" },
};
const INCI_NAME_TR: Record<string, { jp: string; en: string }> = {
  "디에틸아미노하이드록시벤조일헥실벤조에이트": { jp: "ジエチルアミノヒドロキシベンゾイルヘキシルベンゾエート", en: "Diethylamino Hydroxybenzoyl Hexyl Benzoate" },
  "비스에틸헥실옥시페놀메톡시페닐트리아진": { jp: "ビスエチルヘキシルオキシフェノールメトキシフェニルトリアジン", en: "Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine" },
  "메칠렌비스벤조트리아졸릴테트라메칠부틸페놀": { jp: "メチレンビスベンゾトリアゾリルテトラメチルブチルフェノール", en: "Methylene Bis-Benzotriazolyl Tetramethylbutylphenol" },
  "디에틸헥실부타미도트리아존": { jp: "ジエチルヘキシルブタミドトリアゾン", en: "Diethylhexyl Butamido Triazone" },
  "리날룰": { jp: "リナロール", en: "Linalool" },
  "리모넨": { jp: "リモネン", en: "Limonene" },
  "레티놀": { jp: "レチノール", en: "Retinol" },
  "소듐디엔에이": { jp: "ソジウムDNA", en: "Sodium DNA" },
  "머큐리": { jp: "マーキュリー（水銀）", en: "Mercury" },
  "하이드로퀴논": { jp: "ハイドロキノン", en: "Hydroquinone" },
  "칸나비디올": { jp: "カンナビジオール（CBD）", en: "Cannabidiol (CBD)" },
};
function trCountry(name: string, lang: ComplianceLang): string {
  if (lang === "ko") return name;
  return COUNTRY_NAME_TR[name]?.[lang] ?? name;
}
function trInci(name: string, lang: ComplianceLang): string {
  if (lang === "ko") return name;
  return INCI_NAME_TR[name]?.[lang] ?? name;
}

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
function buildMessage(ri: RestrictedIngredient, country: CountryRule, level: FlagLevel, lang: ComplianceLang): string {
  const c = trCountry(country.country_name_ko, lang);
  const ing = trInci(ri.inci_name, lang);
  if (lang === "jp") {
    switch (ri.concern_type) {
      case "uv_filter":
        return `[${c}] '${ing}'（紫外線防止成分）を含みます。${c}が承認した紫外線防止成分リストにないため、持ち込み・販売が制限される場合があります。個人使用目的での持ち込み可否は確認が必要です。`;
      case "allergen":
        return `[${c}] '${ing}'を含みます。持ち込み禁止成分ではなく、${c}で香料アレルゲンの「表示（ラベリング）」対象となる成分です。ラベル表記の確認が必要です。`;
      case "restricted_active":
        if (level === "caution")
          return `[${c}] '${ing}'を含みます。持ち込み禁止ではなく、${c}で含有量基準（例: Annex III）の規制対象成分のため、含有量によっては制限される場合があります。確認が必要です。`;
        return `[${c}] '${ing}'を含みます。製品内の含有量情報が確認できないため、${c}基準への適合可否は直接確認が必要です。`;
      case "animal_derived":
        return `[${c}] '${ing}'（動物由来の可能性がある成分）を含みます。一部の国では動物性由来原料に対して検疫・バイオセキュリティ手続きが別途あることがあり、${c}の規定確認が必要です。`;
      case "mercury":
        return `[${c}] '${ing}'を含みます。多くの国で化粧品への使用が禁止されており、持ち込みが制限される場合があります。必ず確認してください。`;
      case "hydroquinone":
        return `[${c}] '${ing}'を含みます。国によっては医薬品に分類され、持ち込みが制限される場合があります。確認が必要です。`;
      case "cbd_cannabis":
        return `[${c}] '${ing}'を含みます。一部の国では持ち込みを厳しく禁止しているため、制限される場合があります。必ず確認してください。`;
      case "preservative":
      default:
        return `[${c}] '${ing}'を含みます。${c}基準への適合可否は確認が必要です。`;
    }
  }
  if (lang === "en") {
    switch (ri.concern_type) {
      case "uv_filter":
        return `[${c}] Contains '${ing}' (a UV filter). It's not on ${c}'s approved UV filter list, so import/sale may be restricted. Check whether personal-use import is allowed.`;
      case "allergen":
        return `[${c}] Contains '${ing}'. This isn't a banned ingredient — it's a fragrance allergen subject to labeling requirements in ${c}. Check whether it's disclosed on the label.`;
      case "restricted_active":
        if (level === "caution")
          return `[${c}] Contains '${ing}'. Not banned, but it's regulated by concentration limits (e.g. Annex III) in ${c} and may be restricted depending on the amount used. Verification needed.`;
        return `[${c}] Contains '${ing}'. The concentration in this product isn't confirmed, so compliance with ${c}'s standards needs to be checked directly.`;
      case "animal_derived":
        return `[${c}] Contains '${ing}' (a possibly animal-derived ingredient). Some countries have separate quarantine/biosecurity procedures for animal-derived materials — check ${c}'s regulations.`;
      case "mercury":
        return `[${c}] Contains '${ing}'. Banned in cosmetics in many countries, so import may be restricted. Please be sure to check.`;
      case "hydroquinone":
        return `[${c}] Contains '${ing}'. Classified as a prescription drug in some countries, so import may be restricted. Verification needed.`;
      case "cbd_cannabis":
        return `[${c}] Contains '${ing}'. Some countries strictly prohibit import, so it may be restricted. Please be sure to check.`;
      case "preservative":
      default:
        return `[${c}] Contains '${ing}'. Compliance with ${c}'s standards needs to be checked.`;
    }
  }
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

function aviationNoteFor(category: string | undefined, lang: ComplianceLang): string | null {
  if (!category || !LIQUID_CATEGORIES.has(category)) return null;
  if (lang === "jp") {
    return (
      `機内持ち込み時は個別容器${AVIATION.carry_on.liquid_container_max_ml}ml以下、` +
      `合計${AVIATION.carry_on.liquid_total_max_ml}ml（1L）ジップ袋基準を確認してください（一般基準）。` +
      `引火性（高濃度アルコール・エアゾール）製品は別途制限がある場合があります。`
    );
  }
  if (lang === "en") {
    return (
      `For carry-on, check that each container is under ${AVIATION.carry_on.liquid_container_max_ml}ml, ` +
      `with a total of ${AVIATION.carry_on.liquid_total_max_ml}ml (1L) in a zip bag (general rule). ` +
      `Flammable items (high-alcohol, aerosol) may have separate restrictions.`
    );
  }
  return (
    `기내 반입 시 개별 용기 ${AVIATION.carry_on.liquid_container_max_ml}ml 이하, ` +
    `전체 ${AVIATION.carry_on.liquid_total_max_ml}ml(1L) 지퍼백 기준을 확인하세요(일반 기준). ` +
    `인화성(고알코올·에어로졸) 제품은 별도 제한이 있을 수 있습니다.`
  );
}

export type ComplianceOptions = {
  ingredientsComplete?: boolean;
  category?: string;
  lang?: ComplianceLang;
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
  const lang = opts.lang ?? "ko";

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
        ingredient: trInci(ri.inci_name, lang),
        concern_type: ri.concern_type,
        level,
        message_ko: buildMessage(ri, country, level, lang),
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

  const partial_data_warning = opts.ingredientsComplete === false ? PARTIAL_DATA_WARNING[lang] : null;

  return {
    status,
    flags,
    coverage_warning: COVERAGE_WARNING[lang],
    partial_data_warning,
    aviation_note: aviationNoteFor(opts.category, lang),
    disclaimer: DISCLAIMER[lang],
    checked_at: opts.now ?? new Date().toISOString(),
  };
}

// concern_type 별 여행지 무관 일반 안내(정보성). "안전/반입 가능"을 단정하지 않는다.
const CONCERN_GENERIC_NOTE: Record<ConcernType, string> = {
  allergen: "향료 알레르겐 계열 성분입니다. EU/영국 등에서 라벨 표시 대상이며, 민감성 피부는 자극·알레르기 반응 가능성이 있어 확인이 필요합니다.",
  uv_filter: "자외선차단 성분입니다. 국가에 따라(예: 미국) 미승인 성분일 수 있어 반입 시 확인이 필요합니다.",
  restricted_active: "활성 성분입니다. 국가에 따라 함량 기준 규제 대상일 수 있어 확인이 필요합니다.",
  animal_derived: "동물 유래 가능 성분입니다. 국가에 따라 검역·반입 절차가 있을 수 있어 확인이 필요합니다.",
  mercury: "수은/중금속 성분입니다. 다수 국가에서 화장품 사용이 금지되어 있어 확인이 필요합니다.",
  hydroquinone: "미백 활성 성분입니다. 국가에 따라 전문의약품으로 분류될 수 있어 확인이 필요합니다.",
  cbd_cannabis: "대마 유래 성분입니다. 일부 국가는 반입을 엄격히 금지하므로 확인이 필요합니다.",
  preservative: "보존 성분입니다. 국가에 따라 사용 기준이 다를 수 있어 확인이 필요합니다.",
};

/**
 * 성분명 목록을 대표 규제 성분 DB와 교차검증한다(여행지 무관, 정보성).
 * 스캔 결과의 알레르기·규제 성분 표시에 사용. "안전"을 단정하지 않으며 매칭이 없어도 안전을 의미하지 않는다.
 */
export function analyzeIngredients(ingredientNames: string[]): IngredientConcern[] {
  const out: IngredientConcern[] = [];
  const seen = new Set<string>();
  for (const name of ingredientNames) {
    for (const ri of RESTRICTED) {
      if (!ingredientMatches(name, ri)) continue;
      if (seen.has(ri.inci_name)) continue;
      seen.add(ri.inci_name);
      out.push({
        inci_name: ri.inci_name,
        matched_as: name,
        concern_type: ri.concern_type,
        note: CONCERN_GENERIC_NOTE[ri.concern_type],
        source: ri.source,
        as_of_date: ri.as_of_date,
      });
    }
  }
  return out;
}
