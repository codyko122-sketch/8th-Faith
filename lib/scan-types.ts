// AI 성분 스캔 — 클라이언트/서버 공용 타입.
// /api/scan 이 비전 AI(Claude)로부터 이 구조로 응답을 받아 그대로 렌더한다.

export type IngredientType = "key" | "calm" | "base" | "warn";

export type ScanIngredient = {
  name: string; // 성분명 (한글)
  role: string; // 기능 한 줄 설명
  type: IngredientType; // 핵심/진정/베이스/주의
  label: string; // 태그 라벨 (핵심·진정·보습·주의 등)
  caution: string; // 주의사항 (없으면 "")
};

export type ScanCandidate = { brand: string; name: string };

// 라벨에서 확인된 알레르기 유발 가능 성분 (EU 지정 향료 알레르겐 등)
export type ScanAllergen = {
  name: string; // 성분명 (한글)
  note: string; // 알레르기/자극 관련 한 줄 안내
};

export type ScanResult = {
  identified: boolean; // 제품을 특정했는가
  confidence: number; // 0~100 인식 신뢰도
  brand: string;
  name: string;
  category: string; // 세럼/토너/크림/선크림 등
  ingredients: ScanIngredient[];
  allergens: ScanAllergen[]; // 알레르기 유발 가능 성분 (없으면 빈 배열)
  safety: string[]; // 무향·저자극·EWG 그린 등
  summary: string; // 한 줄 요약
  caution: string; // 전반 주의 (없으면 "")
  candidates: ScanCandidate[]; // 불확실할 때 후보 제품들
  note: string; // 인식 근거 / 수동 검색 안내 등
  demo?: boolean; // API 키 미설정 시 데모 응답
};
