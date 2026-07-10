// 화장품 반입 주의 플래그 — 타입 정의
//
// 설계 원칙(반드시 준수):
//  - 이 모듈은 "반입 가능/불가"를 단정하지 않는다. 정보성 위험 수준만 반환한다.
//  - "safe" / "allowed" 같은 단정적 상태값은 존재하지 않는다.
//  - 불확실하면 verify_needed 로 보존한다.
//  - 모든 결과에 source / as_of_date / disclaimer / coverage_warning 을 노출한다.

export type ConcernType =
  | "mercury"
  | "hydroquinone"
  | "cbd_cannabis"
  | "restricted_active"
  | "allergen"
  | "preservative"
  | "uv_filter"
  | "animal_derived";

// 결과/플래그 수준. "safe"·"allowed" 는 의도적으로 없음.
export type FlagLevel = "high_risk" | "caution" | "verify_needed" | "no_flag";

// 국가 concern_flags 는 no_flag 를 두지 않는다(해당 우려가 관여하면 최소 verify_needed).
export type CountryFlagLevel = "high_risk" | "caution" | "verify_needed";

// data/restricted-ingredients.json 한 항목
export type RestrictedIngredient = {
  inci_name: string;
  cas: string | null;
  concern_type: ConcernType;
  aliases: string[];
  notes: string;
  source: string;
  as_of_date: string;
  // 국가 concern_flags 에 없는 concern_type(uv_filter/allergen/restricted_active/preservative)의
  // 규제 지역(regulatory_region)별 정책. 지정 지역이면 flag_level, 아니면 else_level 을 적용.
  flag_regions?: string[];
  flag_level?: FlagLevel;
  else_level?: FlagLevel;
};

// data/country-rules.json 한 항목
export type CountryRule = {
  country_code: string;
  country_name_ko: string;
  regulatory_region: string;
  concern_flags: {
    mercury: CountryFlagLevel;
    hydroquinone: CountryFlagLevel;
    cbd_cannabis: CountryFlagLevel;
    animal_derived: CountryFlagLevel;
  };
  personal_import_note: string;
  product_class_note: string;
  source: string;
  as_of_date: string;
};

export type ComplianceFlag = {
  ingredient: string;
  concern_type: ConcernType;
  level: FlagLevel;
  message_ko: string;
  source: string;
  as_of_date: string;
};

export type ComplianceStatus = FlagLevel;

export type ComplianceResult = {
  status: ComplianceStatus;
  flags: ComplianceFlag[];
  // 항상 포함: 대표 규제 성분 목록 기준이며 전 성분을 검증한 것이 아님을 명시.
  coverage_warning: string;
  // 제품 전성분 데이터가 불완전할 때만 채워짐(그 외 null).
  partial_data_warning: string | null;
  // 제형/성분 힌트가 있을 때 항공(용량·인화성) 안내. 없으면 null.
  aviation_note: string | null;
  // 항상 포함: 법적 판정이 아니며 최종 확인은 도착국 세관.
  disclaimer: string;
  checked_at: string;
};

// 여행지 무관, 성분명 목록을 규제 성분 DB와 교차검증한 결과(정보성).
export type IngredientConcern = {
  inci_name: string; // DB 상 대표 성분명
  matched_as: string; // 입력에서 매칭된 성분 텍스트
  concern_type: ConcernType;
  note: string; // 여행지 무관 일반 안내(확인 필요 성격)
  source: string;
  as_of_date: string;
};

// data/products.json 한 항목
export type ComplianceProduct = {
  product_id: string;
  cosmetic_id: string;
  display_name: string;
  display_brand: string;
  category: string;
  ingredients_complete: boolean;
  ingredients_inci: string[];
  note?: string;
  source_note: string;
  as_of_date: string;
};
