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

    const emojis: { icon: string; label: string }[] = [];
    if (temp >= 30) emojis.push({ icon: "🔥", label: "더운 날" });
    else if (temp <= 15) emojis.push({ icon: "❄️", label: "쌀쌀함" });
    else emojis.push({ icon: "☀️", label: "온화함" });
    if (humidity >= 75) emojis.push({ icon: "💧", label: "습한 날" });
    else if (humidity <= 35) emojis.push({ icon: "🌵", label: "건조함" });
    if (dust >= 100) emojis.push({ icon: "😷", label: "미세먼지 나쁨" });
    else if (dust >= 60) emojis.push({ icon: "🌫️", label: "미세먼지 보통" });

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
    const emojis: { icon: string; label: string }[] = [];
    if (temp >= 30) emojis.push({ icon: "🔥", label: "더운 날" });
    else if (temp <= 15) emojis.push({ icon: "❄️", label: "쌀쌀함" });
    else emojis.push({ icon: "☀️", label: "온화함" });
    if (humidity >= 75) emojis.push({ icon: "💧", label: "습한 날" });
    else if (humidity <= 35) emojis.push({ icon: "🌵", label: "건조함" });
    if (dust >= 100) emojis.push({ icon: "😷", label: "미세먼지 나쁨" });
    else if (dust >= 60) emojis.push({ icon: "🌫️", label: "미세먼지 보통" });
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    cal.push({ date: `${mm}/${dd}`, weekday: WEEKDAYS[d.getDay()], temp, humidity, uv, dust, emojis });
  }
  return cal;
}

// 실제 일별 예보(Open-Meteo) → 캘린더
export function buildCalendarFromDaily(
  daily: { dateISO: string; temp: number; humidity: number; uv: number; dust: number }[]
): CalendarDay[] {
  return daily.slice(0, 30).map((day) => {
    const d = new Date(day.dateISO);
    const { temp, humidity, uv, dust } = day;
    const emojis: { icon: string; label: string }[] = [];
    if (temp >= 30) emojis.push({ icon: "🔥", label: "더운 날" });
    else if (temp <= 15) emojis.push({ icon: "❄️", label: "쌀쌀함" });
    else emojis.push({ icon: "☀️", label: "온화함" });
    if (humidity >= 75) emojis.push({ icon: "💧", label: "습한 날" });
    else if (humidity <= 35) emojis.push({ icon: "🌵", label: "건조함" });
    if (dust >= 100) emojis.push({ icon: "😷", label: "미세먼지 나쁨" });
    else if (dust >= 60) emojis.push({ icon: "🌫️", label: "미세먼지 보통" });
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return { date: `${mm}/${dd}`, weekday: WEEKDAYS[d.getDay()], temp, humidity, uv, dust, emojis };
  });
}
