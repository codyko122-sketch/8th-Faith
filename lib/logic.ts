import { DESTINATIONS, PRODUCTS, type Product } from "./data";

const FALLBACK = { temp: 24, humidity: 60, uv: 6, dust: 50, tag: "온대" };

// 안정적인 시드 기반 의사난수 (mulberry32) — 같은 입력이면 항상 같은 캘린더
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type CalendarDay = {
  date: string;
  weekday: string;
  temp: number;
  humidity: number;
  uv: number;
  dust: number;
  emojis: { icon: string; label: string }[];
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// WMO 날씨 코드 → 날씨 상태 이모지 (맑음/구름/비/눈 등)
export function weatherEmoji(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: "☀️", label: "맑음" };
  if (code === 1) return { icon: "🌤️", label: "대체로 맑음" };
  if (code === 2) return { icon: "⛅", label: "구름 조금" };
  if (code === 3) return { icon: "☁️", label: "흐림" };
  if (code === 45 || code === 48) return { icon: "🌫️", label: "안개" };
  if (code >= 51 && code <= 57) return { icon: "🌦️", label: "이슬비" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { icon: "🌧️", label: "비" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { icon: "🌨️", label: "눈" };
  if (code >= 95) return { icon: "🌩️", label: "뇌우" };
  return { icon: "🌤️", label: "대체로 맑음" };
}

// 실측 코드가 없을 때(계절 기본값) 습도·기온으로 그럴듯한 날씨를 합성. r: 시드 난수(0~1) → 결정적.
function syntheticWeatherCode(r: number, temp: number, humidity: number): number {
  if (temp <= 0) return r < 0.5 ? 71 : 3; // 영하: 눈/흐림
  if (humidity >= 82) {
    if (r < 0.45) return 61; // 비
    if (r < 0.7) return 3; // 흐림
    if (r < 0.9) return 80; // 소나기
    return 95; // 뇌우
  }
  if (humidity >= 68) {
    if (r < 0.35) return 3; // 흐림
    if (r < 0.6) return 2; // 구름 조금
    if (r < 0.8) return 51; // 이슬비
    return 1;
  }
  if (humidity <= 42) return r < 0.75 ? 0 : 1; // 건조: 맑음 위주
  if (r < 0.4) return 1;
  if (r < 0.7) return 2;
  if (r < 0.9) return 3;
  return 0;
}

export function buildCalendar(dest: string, days: number): CalendarDay[] {
  const p = DESTINATIONS[dest] ?? FALLBACK;
  let seed = 0;
  for (const ch of dest) seed += ch.charCodeAt(0);
  const rand = mulberry32(seed * 1000 + days);
  const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

  const cal: CalendarDay[] = [];
  const start = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const temp = p.temp + randInt(-3, 3);
    const humidity = Math.min(100, Math.max(10, p.humidity + randInt(-8, 8)));
    const uv = Math.max(0, Math.min(12, p.uv + randInt(-2, 2)));
    const dust = Math.max(0, p.dust + randInt(-20, 20));

    // 날씨 상태 이모지(맑음/구름/비 등). 실측 코드가 없어 습도·기온으로 결정적 합성.
    const emojis = [weatherEmoji(syntheticWeatherCode(rand(), temp, humidity))];

    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    cal.push({
      date: `${mm}/${dd}`,
      weekday: WEEKDAYS[d.getDay()],
      temp,
      humidity,
      uv,
      dust,
      emojis,
    });
  }
  return cal;
}

export type IssueLevel = "낮음" | "보통" | "높음";

export type SkinIssueResult = {
  score: number;
  level: IssueLevel;
  color: string;
  notes: string[];
};

export function skinIssueIndex(
  dest: string,
  skinType: string,
  concerns: string[]
): SkinIssueResult {
  const p = DESTINATIONS[dest] ?? FALLBACK;
  let score = 20;
  const notes: string[] = [];

  if (p.humidity >= 75) {
    if (skinType === "지성" || skinType === "복합성") {
      score += 25;
      notes.push("높은 습도 + 지성/복합성 → 피지·트러블 주의");
    } else {
      score += 8;
    }
  }
  if (p.humidity <= 40) {
    if (skinType === "건성" || skinType === "민감성") {
      score += 25;
      notes.push("건조한 기후 + 건성/민감성 → 수분 장벽 손상 주의");
    } else {
      score += 10;
    }
  }
  if (p.uv >= 9) {
    score += 20;
    notes.push(`UV 지수 ${p.uv} → 색소 침착·광노화 위험 높음`);
  }
  if (p.dust >= 100) {
    score += 20;
    notes.push(`미세먼지 지수 ${p.dust} → 모공 막힘·자극 주의`);
  } else if (p.dust >= 60) {
    score += 10;
  }

  if (concerns.includes("여드름") || concerns.includes("트러블")) score += 8;
  if (concerns.includes("홍조") || concerns.includes("민감")) score += 6;

  score = Math.min(100, score);

  let level: IssueLevel;
  let color: string;
  if (score >= 70) {
    level = "높음";
    color = "#e5484d";
  } else if (score >= 45) {
    level = "보통";
    color = "#f2a20b";
  } else {
    level = "낮음";
    color = "#30a46c";
  }

  if (notes.length === 0) notes.push("전반적으로 피부에 우호적인 환경입니다.");
  return { score, level, color, notes };
}

export function recommendProducts(skinType: string, concerns: string[]): Product[] {
  const scored: { s: number; p: Product }[] = [];
  for (const p of PRODUCTS) {
    let s = 0;
    if (p.forTypes.includes(skinType)) s += 2;
    s += concerns.filter((c) => p.forConcerns.includes(c)).length;
    if (s > 0) scored.push({ s, p });
  }
  scored.sort((a, b) => b.s - a.s);

  const stepOrder = ["클렌징", "토너", "세럼", "크림", "자외선차단"];
  const routine: Product[] = [];
  const used = new Set<string>();
  for (const step of stepOrder) {
    for (const { p } of scored) {
      if (p.step === step && !used.has(p.id)) {
        routine.push(p);
        used.add(p.id);
        break;
      }
    }
  }
  return routine;
}

/* ── 기후 프로파일(도시 등)을 직접 받는 버전 ── */
export type ClimateProfile = { temp: number; humidity: number; uv: number; dust: number; tag?: string };

export function skinIssueIndexP(p: ClimateProfile, skinType: string, concerns: string[]): SkinIssueResult {
  let score = 20;
  const notes: string[] = [];
  if (p.humidity >= 75) {
    if (skinType === "지성" || skinType === "복합성") {
      score += 25;
      notes.push("높은 습도 + 지성/복합성 → 피지·트러블 주의");
    } else score += 8;
  }
  if (p.humidity <= 40) {
    if (skinType === "건성" || skinType === "민감성") {
      score += 25;
      notes.push("건조한 기후 + 건성/민감성 → 수분 장벽 손상 주의");
    } else score += 10;
  }
  if (p.uv >= 9) {
    score += 20;
    notes.push(`UV 지수 ${p.uv} → 색소 침착·광노화 위험 높음`);
  }
  if (p.dust >= 100) {
    score += 20;
    notes.push(`미세먼지 지수 ${p.dust} → 모공 막힘·자극 주의`);
  } else if (p.dust >= 60) score += 10;
  if (concerns.includes("여드름") || concerns.includes("트러블")) score += 8;
  if (concerns.includes("홍조") || concerns.includes("민감")) score += 6;
  score = Math.min(100, score);
  let level: IssueLevel;
  let color: string;
  if (score >= 70) { level = "높음"; color = "#e5484d"; }
  else if (score >= 45) { level = "보통"; color = "#f2a20b"; }
  else { level = "낮음"; color = "#30a46c"; }
  if (notes.length === 0) notes.push("전반적으로 피부에 우호적인 환경입니다.");
  return { score, level, color, notes };
}

export function buildCalendarP(p: ClimateProfile, seed: number, days: number, start: Date): CalendarDay[] {
  const rand = mulberry32(seed);
  const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
  const cal: CalendarDay[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const temp = p.temp + randInt(-3, 3);
    const humidity = Math.min(100, Math.max(10, p.humidity + randInt(-8, 8)));
    const uv = Math.max(0, Math.min(12, p.uv + randInt(-2, 2)));
    const dust = Math.max(0, p.dust + randInt(-20, 20));
    const emojis = [weatherEmoji(syntheticWeatherCode(rand(), temp, humidity))];
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    cal.push({ date: `${mm}/${dd}`, weekday: WEEKDAYS[d.getDay()], temp, humidity, uv, dust, emojis });
  }
  return cal;
}

// 실제 일별 예보(Open-Meteo) → 캘린더
export function buildCalendarFromDaily(
  daily: { dateISO: string; temp: number; humidity: number; uv: number; dust: number; code?: number }[]
): CalendarDay[] {
  return daily.slice(0, 30).map((day) => {
    const d = new Date(day.dateISO);
    const { temp, humidity, uv, dust } = day;
    // 실측 WMO 날씨 코드가 있으면 그대로, 없으면 습도·기온으로 합성.
    const code = day.code != null ? day.code : syntheticWeatherCode(0.5, temp, humidity);
    const emojis = [weatherEmoji(code)];
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return { date: `${mm}/${dd}`, weekday: WEEKDAYS[d.getDay()], temp, humidity, uv, dust, emojis };
  });
}
