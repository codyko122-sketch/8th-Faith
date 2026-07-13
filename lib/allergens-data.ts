// 화장품 알러지·기피 성분 목록 — 회원가입 설문에서 선택하고, 이후 제품 추천·카메라 스캔·
// AI 써머리 전반에서 이 값을 그대로 신뢰해서 참고한다 (자주 바뀌지 않는 개인 정보이므로).

export type AllergenOption = {
  id: string;
  label: string; // 설문 칩·경고 문구에 쓰이는 한글 표기
  hint?: string; // 칩 아래 보여줄 짧은 설명
  matchIngredients?: string[]; // lib/products.ts Cosmetic.ingredients 태그 중 이 문자열을 포함하는 태그가 있으면 위험으로 판단(부분 일치)
  fragranceProxy?: boolean; // true면 제품 safety 배열에 "무향"이 없을 때 위험으로 판단(향료 프록시)
};

export const ALLERGEN_OPTIONS: AllergenOption[] = [
  { id: "fragrance", label: "향료(인공향)", hint: "무향 표기 없는 제품 주의", fragranceProxy: true },
  { id: "alcohol", label: "알코올(에탄올)" },
  { id: "paraben", label: "파라벤" },
  { id: "retinol", label: "레티놀", matchIngredients: ["레티놀"] },
  { id: "bha", label: "BHA·살리실산", matchIngredients: ["BHA"] },
  { id: "aha", label: "AHA·각질제거산" },
  { id: "vitaminc", label: "고농도 비타민C", matchIngredients: ["비타민C"] },
  { id: "niacinamide", label: "나이아신아마이드", matchIngredients: ["나이아신아마이드"] },
  { id: "essential_oil", label: "에센셜오일·시트러스" },
];

// 아이디(예: "retinol")든 자유 입력 텍스트(예: "티트리")든 사람이 읽을 표기로 변환
export function allergenLabel(idOrText: string): string {
  return ALLERGEN_OPTIONS.find((a) => a.id === idOrText)?.label ?? idOrText;
}

// 등록된 알러지 목록(아이디 또는 자유 입력) 중 이 제품에 있을 수 있는 항목을 찾아 라벨로 반환.
// matchIngredients/향료 프록시로 못 잡는 자유 입력 텍스트는 성분 태그 문자열에 직접 포함되는지로 대조하며,
// 전성분표(fullIngredients, data/products.json)가 있으면 그것까지 함께 대조한다 — 사전 정의된 알러지
// 항목(matchIngredients/fragranceProxy)은 짧은 마케팅 태그만 보고, 전성분 대조는 자유 입력 텍스트에 한정한다.
export function allergyRiskForProduct(
  userAllergies: string[],
  ingredients: string[],
  safety: string[],
  fullIngredients?: string[]
): string[] {
  const risks: string[] = [];
  const ingredientsText = ingredients.join(" ");
  const fullIngredientsText = fullIngredients?.join(" ") ?? "";
  for (const a of userAllergies) {
    const opt = ALLERGEN_OPTIONS.find((o) => o.id === a);
    if (opt) {
      // 부분 일치로 대조 — 예: "BHA"는 제품 태그 "살리실산(BHA)"에도 걸려야 한다(정확히 같은 문자열일 때만 잡던 버그 수정).
      if (opt.matchIngredients?.some((m) => ingredients.some((ing) => ing.includes(m)))) risks.push(opt.label);
      else if (opt.fragranceProxy && !safety.includes("무향")) risks.push(opt.label);
    } else if (a.trim() && (ingredientsText.includes(a.trim()) || fullIngredientsText.includes(a.trim()))) {
      risks.push(a.trim());
    }
  }
  return Array.from(new Set(risks));
}
