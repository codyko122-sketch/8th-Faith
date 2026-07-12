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

// 위도(절댓값) 기반 대략적 기후 기본값. 실제 여행 날짜의 날씨는 Open-Meteo 예보로 덮어쓰므로
// 이 값은 예보 실패 시의 폴백/계절 기본값 용도다. (신규 도시 대량 추가를 위한 근사치)
function climate(lat: number): Pick<City, "temp" | "humidity" | "uv" | "dust" | "tag"> {
  const a = Math.abs(lat);
  if (a < 10) return { temp: 31, humidity: 80, uv: 11, dust: 45, tag: "열대" };
  if (a < 20) return { temp: 33, humidity: 74, uv: 11, dust: 48, tag: "아열대" };
  if (a < 30) return { temp: 30, humidity: 66, uv: 9, dust: 50, tag: "온난" };
  if (a < 38) return { temp: 27, humidity: 62, uv: 8, dust: 48, tag: "온난" };
  if (a < 46) return { temp: 23, humidity: 62, uv: 6, dust: 42, tag: "온대" };
  if (a < 55) return { temp: 19, humidity: 64, uv: 5, dust: 35, tag: "서늘" };
  return { temp: 15, humidity: 66, uv: 3, dust: 28, tag: "냉대" };
}

// 신규 도시 헬퍼: 이름 + 좌표만 주면 기후는 위도에서 산출. override로 개별 보정 가능.
function c(name: string, lat: number, lon: number, override?: Partial<City>): City {
  return { name, lat, lon, ...climate(lat), ...override };
}

export const COUNTRIES: Country[] = [
  // ── 대한민국(국내 여행) ──
  {
    code: "KR",
    name: "대한민국",
    flag: "🇰🇷",
    cities: [
      c("서울", 37.57, 126.98, { dust: 58 }),
      c("부산", 35.18, 129.08, { dust: 50 }),
      c("제주", 33.51, 126.52),
      c("강릉", 37.75, 128.9),
      c("경주", 35.86, 129.22),
      c("여수", 34.76, 127.66),
    ],
  },
  // ── 기존 9개국(수동 튜닝 값 유지) ──
  {
    code: "JP",
    name: "일본",
    flag: "🇯🇵",
    cities: [
      { name: "도쿄", lat: 35.68, lon: 139.69, temp: 27, humidity: 70, uv: 8, dust: 45, tag: "온난습윤" },
      { name: "오사카", lat: 34.69, lon: 135.5, temp: 28, humidity: 68, uv: 8, dust: 48, tag: "온난습윤" },
      { name: "후쿠오카", lat: 33.59, lon: 130.4, temp: 29, humidity: 72, uv: 9, dust: 50, tag: "아열대" },
      c("삿포로", 43.06, 141.35),
      c("오키나와", 26.21, 127.68),
      c("교토", 35.01, 135.77, { tag: "온난습윤" }),
    ],
  },
  {
    code: "TH",
    name: "태국",
    flag: "🇹🇭",
    cities: [
      { name: "방콕", lat: 13.76, lon: 100.5, temp: 34, humidity: 80, uv: 11, dust: 62, tag: "고온다습" },
      { name: "푸껫", lat: 7.88, lon: 98.39, temp: 32, humidity: 82, uv: 11, dust: 35, tag: "열대" },
      c("치앙마이", 18.79, 98.98),
    ],
  },
  {
    code: "VN",
    name: "베트남",
    flag: "🇻🇳",
    cities: [
      { name: "다낭", lat: 16.05, lon: 108.2, temp: 31, humidity: 78, uv: 10, dust: 45, tag: "열대몬순" },
      { name: "하노이", lat: 21.03, lon: 105.85, temp: 30, humidity: 76, uv: 9, dust: 72, tag: "아열대" },
      c("호치민", 10.82, 106.63),
      c("나트랑", 12.24, 109.19),
    ],
  },
  {
    code: "ID",
    name: "인도네시아",
    flag: "🇮🇩",
    cities: [
      { name: "발리", lat: -8.34, lon: 115.09, temp: 31, humidity: 80, uv: 11, dust: 38, tag: "열대" },
      c("자카르타", -6.21, 106.85),
    ],
  },
  {
    code: "FR",
    name: "프랑스",
    flag: "🇫🇷",
    cities: [
      { name: "파리", lat: 48.86, lon: 2.35, temp: 20, humidity: 60, uv: 5, dust: 30, tag: "서안해양" },
      { name: "니스", lat: 43.7, lon: 7.27, temp: 26, humidity: 62, uv: 8, dust: 28, tag: "지중해" },
      c("리옹", 45.76, 4.84),
    ],
  },
  {
    code: "IT",
    name: "이탈리아",
    flag: "🇮🇹",
    cities: [
      { name: "로마", lat: 41.9, lon: 12.5, temp: 28, humidity: 58, uv: 8, dust: 34, tag: "지중해" },
      c("밀라노", 45.46, 9.19),
      c("베네치아", 45.44, 12.32),
      c("피렌체", 43.77, 11.26),
    ],
  },
  {
    code: "US",
    name: "미국",
    flag: "🇺🇸",
    cities: [
      { name: "하와이", lat: 21.31, lon: -157.86, temp: 29, humidity: 70, uv: 11, dust: 20, tag: "열대" },
      { name: "뉴욕", lat: 40.71, lon: -74.01, temp: 24, humidity: 62, uv: 6, dust: 42, tag: "온대" },
      { name: "LA", lat: 34.05, lon: -118.24, temp: 27, humidity: 55, uv: 9, dust: 50, tag: "지중해성" },
      c("라스베이거스", 36.17, -115.14, { humidity: 25, tag: "사막" }),
      c("샌프란시스코", 37.77, -122.42),
    ],
  },
  {
    code: "ES",
    name: "스페인",
    flag: "🇪🇸",
    cities: [
      { name: "바르셀로나", lat: 41.39, lon: 2.17, temp: 27, humidity: 64, uv: 8, dust: 32, tag: "지중해" },
      { name: "마드리드", lat: 40.42, lon: -3.7, temp: 30, humidity: 42, uv: 9, dust: 38, tag: "대륙성" },
      c("세비야", 37.39, -5.99, { humidity: 45 }),
    ],
  },
  {
    code: "MV",
    name: "몰디브",
    flag: "🇲🇻",
    cities: [{ name: "말레", lat: 4.17, lon: 73.51, temp: 31, humidity: 80, uv: 11, dust: 15, tag: "열대" }],
  },

  // ── 아시아 ──
  { code: "TW", name: "대만", flag: "🇹🇼", cities: [c("타이베이", 25.03, 121.57), c("가오슝", 22.63, 120.3), c("타이중", 24.15, 120.68)] },
  { code: "SG", name: "싱가포르", flag: "🇸🇬", cities: [c("싱가포르", 1.35, 103.82)] },
  { code: "PH", name: "필리핀", flag: "🇵🇭", cities: [c("세부", 10.32, 123.9), c("마닐라", 14.6, 120.98), c("보라카이", 11.7, 122.36)] },
  { code: "MY", name: "말레이시아", flag: "🇲🇾", cities: [c("쿠알라룸푸르", 3.14, 101.69), c("코타키나발루", 5.98, 116.07)] },
  { code: "HK", name: "홍콩", flag: "🇭🇰", cities: [c("홍콩", 22.32, 114.17)] },
  { code: "MO", name: "마카오", flag: "🇲🇴", cities: [c("마카오", 22.2, 113.54)] },
  { code: "CN", name: "중국", flag: "🇨🇳", cities: [c("상하이", 31.23, 121.47), c("베이징", 39.9, 116.41), c("시안", 34.34, 108.94), c("칭다오", 36.07, 120.38)] },
  { code: "KH", name: "캄보디아", flag: "🇰🇭", cities: [c("씨엠립", 13.36, 103.86), c("프놈펜", 11.56, 104.92)] },
  { code: "LA", name: "라오스", flag: "🇱🇦", cities: [c("비엔티안", 17.97, 102.63), c("루앙프라방", 19.89, 102.14)] },
  { code: "IN", name: "인도", flag: "🇮🇳", cities: [c("델리", 28.61, 77.21), c("뭄바이", 19.08, 72.88), c("바라나시", 25.32, 82.97)] },
  { code: "NP", name: "네팔", flag: "🇳🇵", cities: [c("카트만두", 27.72, 85.32)] },
  { code: "LK", name: "스리랑카", flag: "🇱🇰", cities: [c("콜롬보", 6.93, 79.86)] },
  { code: "MN", name: "몽골", flag: "🇲🇳", cities: [c("울란바토르", 47.89, 106.91)] },
  { code: "UZ", name: "우즈베키스탄", flag: "🇺🇿", cities: [c("타슈켄트", 41.3, 69.24), c("사마르칸트", 39.65, 66.98)] },

  // ── 유럽 ──
  { code: "GB", name: "영국", flag: "🇬🇧", cities: [c("런던", 51.51, -0.13), c("에든버러", 55.95, -3.19), c("맨체스터", 53.48, -2.24)] },
  { code: "DE", name: "독일", flag: "🇩🇪", cities: [c("베를린", 52.52, 13.41), c("뮌헨", 48.14, 11.58), c("프랑크푸르트", 50.11, 8.68)] },
  { code: "CH", name: "스위스", flag: "🇨🇭", cities: [c("취리히", 47.38, 8.54), c("인터라켄", 46.69, 7.86), c("루체른", 47.05, 8.31), c("제네바", 46.2, 6.14)] },
  { code: "AT", name: "오스트리아", flag: "🇦🇹", cities: [c("빈", 48.21, 16.37), c("잘츠부르크", 47.81, 13.05)] },
  { code: "CZ", name: "체코", flag: "🇨🇿", cities: [c("프라하", 50.08, 14.44)] },
  { code: "NL", name: "네덜란드", flag: "🇳🇱", cities: [c("암스테르담", 52.37, 4.9)] },
  { code: "BE", name: "벨기에", flag: "🇧🇪", cities: [c("브뤼셀", 50.85, 4.35)] },
  { code: "PT", name: "포르투갈", flag: "🇵🇹", cities: [c("리스본", 38.72, -9.14), c("포르투", 41.15, -8.61)] },
  { code: "GR", name: "그리스", flag: "🇬🇷", cities: [c("아테네", 37.98, 23.73), c("산토리니", 36.39, 25.46)] },
  { code: "HU", name: "헝가리", flag: "🇭🇺", cities: [c("부다페스트", 47.5, 19.04)] },
  { code: "PL", name: "폴란드", flag: "🇵🇱", cities: [c("바르샤바", 52.23, 21.01), c("크라쿠프", 50.06, 19.94)] },
  { code: "HR", name: "크로아티아", flag: "🇭🇷", cities: [c("자그레브", 45.81, 15.98), c("두브로브니크", 42.65, 18.09)] },
  { code: "IE", name: "아일랜드", flag: "🇮🇪", cities: [c("더블린", 53.35, -6.26)] },
  { code: "DK", name: "덴마크", flag: "🇩🇰", cities: [c("코펜하겐", 55.68, 12.57)] },
  { code: "SE", name: "스웨덴", flag: "🇸🇪", cities: [c("스톡홀름", 59.33, 18.07)] },
  { code: "NO", name: "노르웨이", flag: "🇳🇴", cities: [c("오슬로", 59.91, 10.75), c("베르겐", 60.39, 5.32)] },
  { code: "FI", name: "핀란드", flag: "🇫🇮", cities: [c("헬싱키", 60.17, 24.94)] },
  { code: "IS", name: "아이슬란드", flag: "🇮🇸", cities: [c("레이캬비크", 64.15, -21.94)] },
  { code: "TR", name: "튀르키예", flag: "🇹🇷", cities: [c("이스탄불", 41.01, 28.98), c("카파도키아", 38.62, 34.71), c("안탈리아", 36.9, 30.71)] },
  { code: "RU", name: "러시아", flag: "🇷🇺", cities: [c("모스크바", 55.76, 37.62), c("블라디보스토크", 43.12, 131.89)] },

  // ── 아메리카 ──
  { code: "CA", name: "캐나다", flag: "🇨🇦", cities: [c("밴쿠버", 49.28, -123.12), c("토론토", 43.65, -79.38)] },
  { code: "MX", name: "멕시코", flag: "🇲🇽", cities: [c("칸쿤", 21.16, -86.85), c("멕시코시티", 19.43, -99.13)] },
  { code: "BR", name: "브라질", flag: "🇧🇷", cities: [c("리우데자네이루", -22.91, -43.17), c("상파울루", -23.55, -46.63)] },
  { code: "AR", name: "아르헨티나", flag: "🇦🇷", cities: [c("부에노스아이레스", -34.6, -58.38)] },
  { code: "PE", name: "페루", flag: "🇵🇪", cities: [c("리마", -12.05, -77.04), c("쿠스코", -13.53, -71.97)] },
  { code: "CL", name: "칠레", flag: "🇨🇱", cities: [c("산티아고", -33.45, -70.67)] },
  { code: "CU", name: "쿠바", flag: "🇨🇺", cities: [c("아바나", 23.11, -82.37)] },

  // ── 오세아니아 ──
  { code: "AU", name: "호주", flag: "🇦🇺", cities: [c("시드니", -33.87, 151.21), c("멜버른", -37.81, 144.96), c("브리즈번", -27.47, 153.03), c("케언스", -16.92, 145.77)] },
  { code: "NZ", name: "뉴질랜드", flag: "🇳🇿", cities: [c("오클랜드", -36.85, 174.76), c("퀸스타운", -45.03, 168.66)] },
  { code: "GU", name: "괌", flag: "🇬🇺", cities: [c("괌", 13.44, 144.79)] },
  { code: "FJ", name: "피지", flag: "🇫🇯", cities: [c("난디", -17.8, 177.42)] },

  // ── 중동 ──
  { code: "AE", name: "아랍에미리트", flag: "🇦🇪", cities: [c("두바이", 25.2, 55.27, { humidity: 55 }), c("아부다비", 24.45, 54.38, { humidity: 55 })] },
  { code: "QA", name: "카타르", flag: "🇶🇦", cities: [c("도하", 25.29, 51.53, { humidity: 55 })] },
  { code: "IL", name: "이스라엘", flag: "🇮🇱", cities: [c("텔아비브", 32.08, 34.78), c("예루살렘", 31.77, 35.21)] },
  { code: "JO", name: "요르단", flag: "🇯🇴", cities: [c("암만", 31.95, 35.93, { humidity: 40 })] },
  { code: "OM", name: "오만", flag: "🇴🇲", cities: [c("무스카트", 23.59, 58.41, { humidity: 55 })] },

  // ── 아프리카 ──
  { code: "EG", name: "이집트", flag: "🇪🇬", cities: [c("카이로", 30.04, 31.24, { humidity: 45 }), c("룩소르", 25.69, 32.64, { humidity: 30 })] },
  { code: "MA", name: "모로코", flag: "🇲🇦", cities: [c("마라케시", 31.63, -7.99, { humidity: 40 }), c("카사블랑카", 33.57, -7.59)] },
  { code: "ZA", name: "남아프리카공화국", flag: "🇿🇦", cities: [c("케이프타운", -33.92, 18.42), c("요하네스버그", -26.2, 28.05)] },
  { code: "KE", name: "케냐", flag: "🇰🇪", cities: [c("나이로비", -1.29, 36.82)] },
  { code: "TZ", name: "탄자니아", flag: "🇹🇿", cities: [c("잔지바르", -6.16, 39.2)] },
  { code: "MU", name: "모리셔스", flag: "🇲🇺", cities: [c("포트루이스", -20.16, 57.5)] },
  { code: "SC", name: "세이셸", flag: "🇸🇨", cities: [c("마헤", -4.62, 55.45)] },
];
