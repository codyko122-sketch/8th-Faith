// 여행지 AI 써머리 — 클라이언트/서버 공용 타입.
// /api/ai-summary 가 실측 날씨·미세먼지 + 목적지 수질 지식 + 바우만 피부타입을 근거로
// 이 구조로 응답을 받아 그대로 렌더한다.

export type AiSummaryInput = {
  placeLabel: string; // "국가 · 도시" 형태 표시용 여행지명
  days: number;
  profile: { temp: number; humidity: number; uv: number; dust: number; tag?: string };
  // 국가별로 저장해둔 수질 정보(lib/water-quality-data.ts) — AI가 추측하지 않고 그대로 신뢰해서 쓴다.
  waterQuality: { level: string; note: string };
  skin: { code: string; base: string; sensitivity: string; skinTypeForRec: string; displayConcerns: string[] };
  // 회원가입 때 등록한 알러지·기피 성분 (사람이 읽을 라벨 문자열) — 있으면 조언에 반영
  allergyIngredients?: string[];
  name?: string;
  age?: string;
  gender?: string;
};

export type AiSummaryResult = {
  summary: string; // 날씨·미세먼지·수질을 종합해 이 피부타입에 미치는 영향을 설명하는 2~4문장
  tips: string[]; // 실행 가능한 케어 팁 2~3개 (이모지로 시작)
  demo?: boolean; // API 키 미설정 시 데모 응답
};
