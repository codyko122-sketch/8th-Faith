// 나라별 대표 메이크업 스타일노트. countryCode는 lib/places.ts의 Country.code와 매칭.
// 사진은 public/assets/makeup/<countryCode 소문자>/ 에 있음.
export type MakeupCover = {
  caption: string;
  image: string;
};

export type MakeupPoint = {
  label: string;
  title: string;
  tagline: string;
  tip: string;
  image: string;
};

export type MakeupStyleNote = {
  id: string;
  flag: string;
  countryCode: string;
  country: string;
  city: string;
  /** 카드 썸네일 대표 사진. 없으면 flag 이모지로 대체. */
  thumb?: string;
  intro: string;
  covers: MakeupCover[];
  points: MakeupPoint[];
};

export const MAKEUP_STYLE_NOTES: MakeupStyleNote[] = [
  {
    id: "jp",
    flag: "🇯🇵",
    countryCode: "JP",
    country: "일본",
    city: "오사카 · 도쿄",
    thumb: "/assets/makeup/jp/card.jpg",
    intro:
      "화이트에 가까운 맑고 촉촉한 피부 표현이 기본이에요. 여기에 볼 중앙을 덮는 오렌지·코랄 블러셔와 진한 언더라인으로 순하면서도 발그레한 인상을 만드는 게 도쿄·오사카 스타일의 핵심이에요.",
    covers: [
      { caption: "룩 1", image: "/assets/makeup/jp/2.jpg" },
      { caption: "룩 2", image: "/assets/makeup/jp/4.jpg" },
    ],
    points: [
      {
        label: "blush",
        title: "치크",
        tagline: "볼 중앙에 크게 얹는 오렌지 블러셔",
        tip: "광대뼈보다 볼 중앙, 눈 밑까지 둥글게 크게 발라주세요. 색은 오렌지·코랄 계열로, 자연스럽게 홍조가 오른 듯한 건강한 인상을 만드는 게 포인트예요.",
        image: "/assets/makeup/jp/1.jpg",
      },
      {
        label: "eyeliner",
        title: "아이라인",
        tagline: "속눈썹 사이를 메우는 언더라인",
        tip: "아이라인은 눈매 교정보다 속눈썹 뿌리와 언더라인을 촘촘히 메우는 데 집중해주세요. 눈이 또렷하면서도 순한 인상이 완성돼요.",
        image: "/assets/makeup/jp/3.jpg",
      },
    ],
  },
  {
    id: "th",
    flag: "🇹🇭",
    countryCode: "TH",
    country: "태국",
    city: "방콕",
    thumb: "/assets/makeup/th/card.jpg",
    intro:
      "고온다습한 날씨 특성상 유분과 광은 살리되 무너지지 않는 게 관건이에요. 코와 이마에 강하게 올리는 글로우 하이라이팅과, 땀에도 잘 버티는 워터프루프 아이 메이크업이 방콕 스타일의 특징이에요.",
    covers: [
      { caption: "룩 1", image: "/assets/makeup/th/2.jpg" },
      { caption: "룩 2", image: "/assets/makeup/th/3.jpg" },
    ],
    points: [
      {
        label: "highlight",
        title: "하이라이터",
        tagline: "코와 이마에 강하게 올리는 글로우",
        tip: "코 라인과 이마, 광대 위쪽에 리퀴드 하이라이터를 진하게 올려주세요. 습한 날씨에도 번들거림이 아닌 '건강한 윤광'으로 보이게 하는 게 핵심이에요.",
        image: "/assets/makeup/th/1.jpg",
      },
      {
        label: "base",
        title: "베이스",
        tagline: "가벼운 픽싱으로 무너짐 방지",
        tip: "파운데이션은 얇게, T존은 픽싱 파우더나 미스트로 마무리해서 습도에도 오래가게 잡아주세요.",
        image: "/assets/makeup/th/4.jpg",
      },
    ],
  },
  {
    id: "vn",
    flag: "🇻🇳",
    countryCode: "VN",
    country: "베트남",
    city: "다낭 · 호치민",
    thumb: "/assets/makeup/vn/card.jpg",
    intro:
      "촉촉한 수분 베이스 위에 자연스러운 눈썹, 은은한 코랄 립을 더하는 데일리 룩이 특징이에요. 진하게 그리기보다 결을 살리는 방식이 다낭·호치민 스타일에 잘 어울려요.",
    covers: [
      { caption: "룩 1", image: "/assets/makeup/vn/1.jpg" },
      { caption: "룩 2", image: "/assets/makeup/vn/3.jpg" },
    ],
    points: [
      {
        label: "base",
        title: "베이스",
        tagline: "촉촉한 수분 베이스",
        tip: "고온다습한 환경이라 매트한 풀커버보다는 수분 크림 위주로 얇게 발라 피부 본연의 결을 살려주세요. 자외선 차단은 필수예요.",
        image: "/assets/makeup/vn/2.jpg",
      },
      {
        label: "lip",
        title: "립",
        tagline: "은은한 코랄·MLBB 립",
        tip: "선명한 레드보다는 입술 본연의 색과 비슷한 코랄·누드 톤을 얇게 발라 자연스러운 인상을 만들어주세요.",
        image: "/assets/makeup/vn/4.jpg",
      },
    ],
  },
  {
    id: "id",
    flag: "🇮🇩",
    countryCode: "ID",
    country: "인도네시아",
    city: "발리",
    thumb: "/assets/makeup/id/card.jpg",
    intro: "태닝된 피부와 잘 어우러지는 브론즈 톤 하이라이팅이 발리 스타일의 핵심이에요. 자외선이 강한 만큼 워터프루프 제품 위주로 구성하는 게 좋아요.",
    covers: [
      { caption: "룩 1", image: "/assets/makeup/id/1.jpg" },
      { caption: "룩 2", image: "/assets/makeup/id/4.jpg" },
    ],
    points: [
      {
        label: "highlight",
        title: "하이라이터",
        tagline: "태닝된 피부에 어울리는 브론즈 글로우",
        tip: "골드·브론즈 톤 하이라이터를 광대 윗부분과 콧대에 얹어 그을린 피부와 자연스럽게 어우러지는 윤기를 살려주세요.",
        image: "/assets/makeup/id/2.jpg",
      },
      {
        label: "waterproof",
        title: "아이 메이크업",
        tagline: "땀·물에 강한 방수 제품",
        tip: "해변 일정이 많은 만큼 마스카라와 아이라이너는 워터프루프 제품으로 준비해서 물놀이 후에도 번지지 않게 해주세요.",
        image: "/assets/makeup/id/3.jpg",
      },
    ],
  },
  {
    id: "fr",
    flag: "🇫🇷",
    countryCode: "FR",
    country: "프랑스",
    city: "파리",
    thumb: "/assets/makeup/fr/card.jpg",
    intro:
      "'애써 꾸미지 않은 듯' 보이는 노메이크업 메이크업이 파리지엔 스타일의 정수예요. 피부결을 그대로 드러내는 세미매트 베이스에 무광 레드나 베어 톤 립으로 포인트를 주는 게 특징이에요.",
    covers: [
      { caption: "룩 1", image: "/assets/makeup/fr/1.jpg" },
      { caption: "룩 2", image: "/assets/makeup/fr/4.jpg" },
    ],
    points: [
      {
        label: "base",
        title: "베이스",
        tagline: "피부결을 살리는 세미매트 베이스",
        tip: "커버력보다 피부 톤을 고르게 정돈하는 데 집중해주세요. 모공이나 잡티를 완전히 가리기보다 살짝 비치는 정도로 얇게 발라야 파리지엔 특유의 자연스러움이 살아요.",
        image: "/assets/makeup/fr/2.jpg",
      },
      {
        label: "lip",
        title: "립",
        tagline: "무광 레드 or 베어 립",
        tip: "다른 부위는 최소한으로 정돈하고, 립만 매트한 레드나 베어 톤으로 확실하게 발라 시선을 모아주세요.",
        image: "/assets/makeup/fr/3.jpg",
      },
    ],
  },
  {
    id: "it",
    flag: "🇮🇹",
    countryCode: "IT",
    country: "이탈리아",
    city: "로마 · 밀라노",
    thumb: "/assets/makeup/it/card.jpg",
    intro: "따뜻한 테라코타 톤의 립과 치크로 이탈리아 특유의 화사하고 생기 있는 인상을 만드는 게 핵심이에요. 골드 하이라이터로 은은한 태닝 광을 더하면 완성도가 올라가요.",
    covers: [
      { caption: "룩 1", image: "/assets/makeup/it/1.jpg" },
      { caption: "룩 2", image: "/assets/makeup/it/2.jpg" },
    ],
    points: [
      {
        label: "lip",
        title: "립&치크",
        tagline: "테라코타 톤으로 통일",
        tip: "립과 치크를 같은 테라코타·브릭 톤으로 맞춰주면 자연스럽게 얼굴에 생기가 돌아요. 립은 살짝 촉촉한 제형으로 발라 건조해 보이지 않게 해주세요.",
        image: "/assets/makeup/it/4.jpg",
      },
      {
        label: "highlight",
        title: "하이라이터",
        tagline: "은은한 골드 톤 글로우",
        tip: "골드 펄이 도는 하이라이터를 광대 윗부분에 살짝 올려 햇살 아래 자연스럽게 태닝된 듯한 윤기를 더해주세요.",
        image: "/assets/makeup/it/3.jpg",
      },
    ],
  },
  {
    id: "us",
    flag: "🇺🇸",
    countryCode: "US",
    country: "미국",
    city: "LA · 뉴욕",
    thumb: "/assets/makeup/us/card.jpg",
    intro: "또렷한 이목구비를 강조하는 컨투어링과 풀커버리지 베이스가 특징이에요. 눈썹도 힘 있게 그려 전체적으로 선명하고 완성도 높은 인상을 만드는 스타일이에요.",
    covers: [
      { caption: "룩 1", image: "/assets/makeup/us/1.jpg" },
      { caption: "룩 2", image: "/assets/makeup/us/3.jpg" },
    ],
    points: [
      {
        label: "contour",
        title: "컨투어",
        tagline: "또렷한 이목구비 셰이딩",
        tip: "광대뼈 아래, 콧대 옆, 턱선을 따라 셰이딩을 넣고 하이라이터로 T존을 살려 입체감을 확실하게 표현해주세요.",
        image: "/assets/makeup/us/4.jpg",
      },
      {
        label: "brow",
        title: "브로우",
        tagline: "힘 있게 채우는 눈썹",
        tip: "눈썹은 결대로 자연스럽게 채우되, 숱과 각을 또렷하게 살려 전체 얼굴 윤곽을 잡아주는 역할을 하게 해주세요.",
        image: "/assets/makeup/us/2.jpg",
      },
    ],
  },
  {
    id: "es",
    flag: "🇪🇸",
    countryCode: "ES",
    country: "스페인",
    city: "바르셀로나",
    intro: "태닝된 피부 위에 올리는 코랄 치크와 또렷한 윙 아이라이너가 바르셀로나 스타일의 포인트예요. 전반적으로 화사하면서도 시원한 인상을 강조해요.",
    covers: [
      { caption: "룩 1", image: "/assets/makeup/es/1.jpg" },
      { caption: "룩 2", image: "/assets/makeup/es/4.jpg" },
    ],
    points: [
      {
        label: "blush",
        title: "치크",
        tagline: "태닝 피부 위 코랄 치크",
        tip: "코랄이나 살구 톤 치크를 광대 바깥쪽부터 관자놀이 방향으로 길게 발라주면 태닝된 피부와 자연스럽게 어우러지는 화사함이 살아나요.",
        image: "/assets/makeup/es/2.jpg",
      },
      {
        label: "eyeliner",
        title: "아이라인",
        tagline: "또렷한 윙 아이라이너",
        tip: "눈꼬리를 살짝 길게 빼는 윙 아이라인으로 눈매를 시원하게 강조해주세요. 아이섀도는 심플하게, 라인으로 포인트를 주는 방식이에요.",
        image: "/assets/makeup/es/3.jpg",
      },
    ],
  },
  {
    id: "mv",
    flag: "🇲🇻",
    countryCode: "MV",
    country: "몰디브",
    city: "말레",
    thumb: "/assets/makeup/mv/card.jpg",
    intro: "물놀이와 강한 자외선이 일상인 만큼, 미니멀한 베이스에 방수력 높은 포인트 메이크업으로 구성하는 게 몰디브 스타일의 핵심이에요.",
    covers: [
      { caption: "룩 1", image: "/assets/makeup/mv/1.jpg" },
      { caption: "룩 2", image: "/assets/makeup/mv/2.jpg" },
    ],
    points: [
      {
        label: "sunproof",
        title: "워터프루프 포인트",
        tagline: "땀·물에 강한 방수 메이크업",
        tip: "마스카라, 아이라이너, 립은 반드시 워터프루프·틴트 제형으로 준비해주세요. 물놀이 후에도 최소한의 정돈만으로 다시 예쁘게 보일 수 있어요.",
        image: "/assets/makeup/mv/3.jpg",
      },
      {
        label: "base",
        title: "베이스",
        tagline: "덜어내는 미니멀 베이스",
        tip: "파운데이션보다는 선크림 + 살짝의 톤업크림 정도로 가볍게 정돈해주세요. 두꺼운 베이스는 물놀이와 강한 햇빛 아래 오히려 뜨기 쉬워요.",
        image: "/assets/makeup/mv/4.jpg",
      },
    ],
  },
];
