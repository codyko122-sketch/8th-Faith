// 해외 여행지: 나라 → 도시. 각 도시는 위/경도(날씨 API용) + 기후 프로파일 보유.
export type City = {
  name: string;
  lat: number;
  lon: number;
  temp: number; // 평균 최고기온(℃)
  humidity: number; // 습도(%)
  uv: number; // UV 지수
  dust: number; // 미세먼지 지수
  tag: string;
};

export type Country = {
  code: string;
  name: string;
  flag: string;
  cities: City[];
};

export const FALLBACK_CLIMATE = { temp: 26, humidity: 60, uv: 7, dust: 50, tag: "온대" };

export const COUNTRIES: Country[] = [
  {
    code: "JP",
    name: "일본",
    flag: "🇯🇵",
    cities: [
      { name: "도쿄", lat: 35.68, lon: 139.69, temp: 27, humidity: 70, uv: 8, dust: 45, tag: "온난습윤" },
      { name: "오사카", lat: 34.69, lon: 135.5, temp: 28, humidity: 68, uv: 8, dust: 48, tag: "온난습윤" },
      { name: "후쿠오카", lat: 33.59, lon: 130.4, temp: 29, humidity: 72, uv: 9, dust: 50, tag: "아열대" },
    ],
  },
  {
    code: "TH",
    name: "태국",
    flag: "🇹🇭",
    cities: [
      { name: "방콕", lat: 13.76, lon: 100.5, temp: 34, humidity: 80, uv: 11, dust: 62, tag: "고온다습" },
      { name: "푸껫", lat: 7.88, lon: 98.39, temp: 32, humidity: 82, uv: 11, dust: 35, tag: "열대" },
    ],
  },
  {
    code: "VN",
    name: "베트남",
    flag: "🇻🇳",
    cities: [
      { name: "다낭", lat: 16.05, lon: 108.2, temp: 31, humidity: 78, uv: 10, dust: 45, tag: "열대몬순" },
      { name: "하노이", lat: 21.03, lon: 105.85, temp: 30, humidity: 76, uv: 9, dust: 72, tag: "아열대" },
    ],
  },
  {
    code: "ID",
    name: "인도네시아",
    flag: "🇮🇩",
    cities: [{ name: "발리", lat: -8.34, lon: 115.09, temp: 31, humidity: 80, uv: 11, dust: 38, tag: "열대" }],
  },
  {
    code: "FR",
    name: "프랑스",
    flag: "🇫🇷",
    cities: [
      { name: "파리", lat: 48.86, lon: 2.35, temp: 20, humidity: 60, uv: 5, dust: 30, tag: "서안해양" },
      { name: "니스", lat: 43.7, lon: 7.27, temp: 26, humidity: 62, uv: 8, dust: 28, tag: "지중해" },
    ],
  },
  {
    code: "IT",
    name: "이탈리아",
    flag: "🇮🇹",
    cities: [{ name: "로마", lat: 41.9, lon: 12.5, temp: 28, humidity: 58, uv: 8, dust: 34, tag: "지중해" }],
  },
  {
    code: "US",
    name: "미국",
    flag: "🇺🇸",
    cities: [
      { name: "하와이", lat: 21.31, lon: -157.86, temp: 29, humidity: 70, uv: 11, dust: 20, tag: "열대" },
      { name: "뉴욕", lat: 40.71, lon: -74.01, temp: 24, humidity: 62, uv: 6, dust: 42, tag: "온대" },
      { name: "LA", lat: 34.05, lon: -118.24, temp: 27, humidity: 55, uv: 9, dust: 50, tag: "지중해성" },
    ],
  },
  {
    code: "ES",
    name: "스페인",
    flag: "🇪🇸",
    cities: [
      { name: "바르셀로나", lat: 41.39, lon: 2.17, temp: 27, humidity: 64, uv: 8, dust: 32, tag: "지중해" },
      { name: "마드리드", lat: 40.42, lon: -3.7, temp: 30, humidity: 42, uv: 9, dust: 38, tag: "대륙성" },
    ],
  },
  {
    code: "MV",
    name: "몰디브",
    flag: "🇲🇻",
    cities: [{ name: "말레", lat: 4.17, lon: 73.51, temp: 31, humidity: 80, uv: 11, dust: 15, tag: "열대" }],
  },
];
