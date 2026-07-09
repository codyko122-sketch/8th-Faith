// 여행지 기후 프로파일 + 소용량 제품 카탈로그
// 실제 서비스에서는 기후 데이터를 실시간 날씨/미세먼지 API 연동으로 교체합니다.

export type Destination = {
  temp: number; // 평균 최고기온(℃)
  humidity: number; // 평균 습도(%)
  uv: number; // UV 지수(0~11+)
  dust: number; // 미세먼지 지수(0~150+)
  tag: string;
};

export const DESTINATIONS: Record<string, Destination> = {
  서울: { temp: 22, humidity: 60, uv: 6, dust: 78, tag: "온대" },
  도쿄: { temp: 24, humidity: 68, uv: 7, dust: 45, tag: "온난습윤" },
  방콕: { temp: 34, humidity: 82, uv: 11, dust: 60, tag: "고온다습" },
  싱가포르: { temp: 32, humidity: 84, uv: 11, dust: 40, tag: "열대" },
  파리: { temp: 19, humidity: 55, uv: 5, dust: 30, tag: "서안해양" },
  두바이: { temp: 40, humidity: 45, uv: 11, dust: 95, tag: "사막" },
  뉴욕: { temp: 21, humidity: 58, uv: 6, dust: 42, tag: "온대" },
  제주: { temp: 23, humidity: 72, uv: 7, dust: 35, tag: "해양성" },
  베이징: { temp: 26, humidity: 50, uv: 7, dust: 120, tag: "건조/황사" },
  발리: { temp: 31, humidity: 80, uv: 11, dust: 38, tag: "열대" },
};

export type Product = {
  id: string;
  name: string;
  step: string;
  ingredients: string[];
  forTypes: string[];
  forConcerns: string[];
  desc: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "cleanser-mild",
    name: "저자극 젤 클렌저 (30ml)",
    step: "클렌징",
    ingredients: ["코카미도프로필베타인", "판테놀", "알로에베라추출물"],
    forTypes: ["건성", "민감성", "복합성"],
    forConcerns: ["건조", "홍조", "민감"],
    desc: "약산성 세정 성분으로 여행 중 수분 손실을 최소화합니다.",
  },
  {
    id: "cleanser-clay",
    name: "클레이 딥클렌저 (30ml)",
    step: "클렌징",
    ingredients: ["카올린", "살리실산", "티트리오일"],
    forTypes: ["지성", "복합성"],
    forConcerns: ["여드름", "피지", "모공"],
    desc: "고온다습 환경의 과잉 피지와 미세먼지를 흡착 세정합니다.",
  },
  {
    id: "toner-hydra",
    name: "히알루론 수분 토너 (30ml)",
    step: "토너",
    ingredients: ["히알루론산", "베타글루칸", "글리세린"],
    forTypes: ["건성", "복합성", "민감성"],
    forConcerns: ["건조", "민감"],
    desc: "건조한 기내·사막 기후에서 각질층 수분을 즉시 보충합니다.",
  },
  {
    id: "serum-cica",
    name: "시카 진정 세럼 (15ml)",
    step: "세럼",
    ingredients: ["센텔라아시아티카추출물", "마데카소사이드", "판테놀"],
    forTypes: ["민감성", "건성", "복합성"],
    forConcerns: ["홍조", "민감", "트러블"],
    desc: "환경 변화로 인한 붉은기와 자극을 빠르게 가라앉힙니다.",
  },
  {
    id: "serum-niacin",
    name: "나이아신 브라이트 세럼 (15ml)",
    step: "세럼",
    ingredients: ["나이아신아마이드", "아연", "비타민C유도체"],
    forTypes: ["지성", "복합성", "건성"],
    forConcerns: ["색소침착", "피지", "모공"],
    desc: "강한 자외선 지역의 색소 침착과 톤 불균형을 케어합니다.",
  },
  {
    id: "cream-barrier",
    name: "세라마이드 배리어 크림 (20ml)",
    step: "크림",
    ingredients: ["세라마이드", "스쿠알란", "시어버터"],
    forTypes: ["건성", "민감성", "복합성"],
    forConcerns: ["건조", "민감"],
    desc: "피부 장벽을 재건해 기후 스트레스에 대한 저항력을 높입니다.",
  },
  {
    id: "cream-gel",
    name: "오일프리 수분 젤크림 (20ml)",
    step: "크림",
    ingredients: ["히알루론산", "판테놀", "알란토인"],
    forTypes: ["지성", "복합성"],
    forConcerns: ["피지", "여드름"],
    desc: "습한 기후에서 끈적임 없이 가볍게 수분을 잡아줍니다.",
  },
  {
    id: "spf-daily",
    name: "데일리 선크림 SPF50+ (15ml)",
    step: "자외선차단",
    ingredients: ["징크옥사이드", "타이타늄다이옥사이드", "나이아신아마이드"],
    forTypes: ["건성", "지성", "복합성", "민감성"],
    forConcerns: ["색소침착", "민감"],
    desc: "UV 지수가 높은 여행지 필수 아이템. 무기자차 베이스.",
  },
];

export const SKIN_TYPES = ["건성", "지성", "복합성", "민감성"];
export const CONCERNS = ["여드름", "홍조", "건조", "색소침착", "피지", "모공", "민감", "트러블"];
