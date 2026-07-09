// 애프터케어(여행 후) 플로우 데이터. aftercare.html 원본 데이터를 그대로 포팅.
export type AftercareProduct = {
  cat: string;
  name: string;
  ing: string;
  why: string;
};

export type ClimateKey = "tropical" | "beach" | "arid" | "cold" | "temperate";

export const CLIMATE_BY_COUNTRY: Record<string, ClimateKey> = {
  태국: "tropical", 베트남: "tropical", 인도네시아: "tropical", 필리핀: "tropical", 싱가포르: "tropical", 말레이시아: "tropical", 캄보디아: "tropical",
  몰디브: "beach", 하와이: "beach", 발리: "beach", 괌: "beach", 세부: "beach", 호주: "beach", 사이판: "beach",
  이집트: "arid", 두바이: "arid", 아랍에미리트: "arid", UAE: "arid", 모로코: "arid", 요르단: "arid",
  아이슬란드: "cold", 노르웨이: "cold", 스위스: "cold", 핀란드: "cold", 러시아: "cold", 캐나다: "cold",
  일본: "temperate", 프랑스: "temperate", 이탈리아: "temperate", 영국: "temperate", 미국: "temperate", 독일: "temperate", 스페인: "temperate", 대만: "temperate",
};

export const CLIMATE_PROFILE: Record<ClimateKey, { label: string; focus: string; products: AftercareProduct[] }> = {
  tropical: {
    label: "고온다습 지역",
    focus: "땀과 피지, 습한 공기로 트러블이 생기기 쉬워요. 산뜻한 유분 조절과 진정에 집중하세요.",
    products: [
      { cat: "Cleanser", name: "약산성 살리실산 클렌저", ing: "BHA(살리실산)", why: "모공 속 노폐물과 과잉 피지를 부드럽게 정돈해요." },
      { cat: "Serum", name: "오일프리 수분 젤 세럼", ing: "히알루론산", why: "번들거림 없이 속당김만 잡아주는 가벼운 수분." },
      { cat: "Soothing", name: "시카 진정 앰플", ing: "센텔라아시아티카", why: "열감과 좁쌀 트러블을 가라앉혀요." },
    ],
  },
  beach: {
    label: "강한 자외선 · 휴양지",
    focus: "강한 햇빛에 노출된 피부는 착색과 손상 회복이 핵심이에요.",
    products: [
      { cat: "Serum", name: "비타민C 브라이트닝 세럼", ing: "순수 비타민C 15%", why: "햇빛으로 짙어진 톤과 착색을 밝게 케어." },
      { cat: "Recovery", name: "애프터선 진정 젤", ing: "알로에·판테놀", why: "자극받은 피부의 열을 식히고 진정." },
      { cat: "Protect", name: "데일리 선크림 SPF50+", ing: "무기자차", why: "회복 중인 피부에 추가 손상을 막아줘요." },
    ],
  },
  arid: {
    label: "고온건조 지역",
    focus: "건조한 공기로 수분이 빠르게 증발해요. 강력한 보습과 장벽 강화가 필요해요.",
    products: [
      { cat: "Serum", name: "5중 히알루론산 세럼", ing: "저·고분자 히알루론산", why: "층층이 수분을 채워 속건조를 방지." },
      { cat: "Cream", name: "세라마이드 배리어 크림", ing: "세라마이드 NP", why: "수분이 날아가지 않도록 피부 장벽을 밀봉." },
      { cat: "Mask", name: "판테놀 수분 슬리핑 마스크", ing: "판테놀 5%", why: "자는 동안 손상된 장벽을 집중 회복." },
    ],
  },
  cold: {
    label: "저온건조 지역",
    focus: "차고 건조한 바람에 장벽이 약해지기 쉬워요. 고보습과 진정에 집중하세요.",
    products: [
      { cat: "Cream", name: "세라마이드 배리어 크림", ing: "세라마이드 NP", why: "약해진 장벽을 채우고 수분 손실을 막아요." },
      { cat: "Ampoule", name: "판테놀 배리어 앰플", ing: "판테놀 5%", why: "당김과 각질을 완화하고 진정." },
      { cat: "Balm", name: "멀티 밤(입술·손)", ing: "시어버터", why: "트고 갈라지기 쉬운 부위를 보호." },
    ],
  },
  temperate: {
    label: "온화한 도시 여행",
    focus: "큰 변화는 없지만, 여행 피로와 미세먼지로 지친 피부의 밸런스를 맞춰줘요.",
    products: [
      { cat: "Cleanser", name: "딥클린 젤 클렌저", ing: "아미노산 계면활성제", why: "도시 먼지와 노폐물을 순하게 제거." },
      { cat: "Serum", name: "수분 밸런싱 세럼", ing: "히알루론산·판테놀", why: "유수분 균형을 맞춰 컨디션 회복." },
      { cat: "Protect", name: "데일리 선크림 SPF50+", ing: "혼합자차", why: "일상 자외선 방어로 톤 유지." },
    ],
  },
};

export type Concern = {
  id: string;
  ico: string;
  label: string;
  en: string;
  focus: string;
  products: AftercareProduct[];
};

export const CONCERNS: Concern[] = [
  {
    id: "wrinkle", ico: "〰️", label: "주름", en: "Wrinkles",
    focus: "탄력 저하와 잔주름을 케어하는 항산화·리뉴얼 루틴이에요.",
    products: [
      { cat: "Night Serum", name: "레티놀 나이트 세럼", ing: "레티놀 0.3%", why: "턴오버를 도와 잔주름을 부드럽게 개선. 밤에만, 자외선차단 필수." },
      { cat: "Cream", name: "펩타이드 탄력 크림", ing: "시그널 펩타이드", why: "처진 탄력을 끌어올려 매끈하게." },
      { cat: "Ampoule", name: "콜라겐 부스트 앰플", ing: "아데노신", why: "주름 개선 기능성 성분으로 집중 케어." },
    ],
  },
  {
    id: "pore", ico: "◌", label: "모공", en: "Pores",
    focus: "늘어난 모공과 피지를 조이는 진정·정돈 루틴이에요.",
    products: [
      { cat: "Serum", name: "나이아신아마이드 세럼", ing: "나이아신아마이드 10%", why: "피지 조절과 모공 탄력 관리에." },
      { cat: "Toner", name: "BHA 모공 토너", ing: "살리실산 2%", why: "모공 속 각질과 노폐물을 부드럽게 정리." },
      { cat: "Mask", name: "클레이 워시오프 마스크", ing: "카올린", why: "주 1~2회 피지 흡착으로 모공 리셋." },
    ],
  },
  {
    id: "pigment", ico: "◑", label: "피부착색", en: "Pigmentation",
    focus: "여행지 햇빛으로 생긴 착색과 톤 불균형을 밝히는 루틴이에요.",
    products: [
      { cat: "Serum", name: "비타민C 브라이트닝 세럼", ing: "순수 비타민C 15%", why: "멜라닌 생성을 억제해 밝고 균일한 톤으로." },
      { cat: "Essence", name: "트라넥삼산 스팟 에센스", ing: "트라넥삼산", why: "국소 색소침착을 집중 케어." },
      { cat: "Protect", name: "데일리 선크림 SPF50+", ing: "무기자차", why: "추가 착색을 막는 미백 케어의 기본." },
    ],
  },
  {
    id: "acne", ico: "⦿", label: "여드름", en: "Acne",
    focus: "트러블과 진정, 흔적 케어를 병행하는 루틴이에요.",
    products: [
      { cat: "Cleanser", name: "살리실산 클렌저", ing: "BHA(살리실산)", why: "막힌 모공과 피지를 정돈해 트러블 완화." },
      { cat: "Spot", name: "시카 진정 스팟", ing: "센텔라·티트리", why: "올라온 트러블을 빠르게 진정." },
      { cat: "Serum", name: "아젤라익 세럼", ing: "아젤라익애씨드 10%", why: "트러블과 흔적, 붉은기를 함께 케어." },
    ],
  },
  {
    id: "redness", ico: "◍", label: "홍조", en: "Redness",
    focus: "자극받아 붉어진 피부를 가라앉히는 저자극 진정 루틴이에요.",
    products: [
      { cat: "Cream", name: "시카 진정 크림", ing: "센텔라아시아티카", why: "열감과 붉은기를 진정시켜요." },
      { cat: "Ampoule", name: "판테놀 배리어 앰플", ing: "판테놀 5%", why: "약해진 장벽을 강화해 예민함을 줄여요." },
      { cat: "Toner", name: "저자극 진정 토너", ing: "마데카소사이드", why: "자극 없이 수분과 진정을 동시에." },
    ],
  },
  {
    id: "hydration", ico: "💧", label: "수분", en: "Hydration",
    focus: "여행으로 빠져나간 수분을 다시 채우는 고보습 루틴이에요.",
    products: [
      { cat: "Serum", name: "히알루론산 수분 세럼", ing: "5중 히알루론산", why: "속부터 겉까지 수분을 층층이 채워요." },
      { cat: "Cream", name: "세라마이드 배리어 크림", ing: "세라마이드 NP", why: "채운 수분이 날아가지 않도록 잠금." },
      { cat: "Mask", name: "판테놀 수분 마스크", ing: "판테놀", why: "주 2~3회 집중 수분 충전." },
    ],
  },
];
