// 화해 리뷰 랭킹 기반 실제 제품 데이터 (별점은 참고용 근사값).
// fullMl/price 는 카테고리 기준 근사값(수정 가능), oliveYoungUrl 은 제품명 검색 링크.
// image: 실제 제품 이미지 URL을 넣으면 노출, 비어 있으면 브랜드 컬러 플레이스홀더로 폴백.

import { allergyRiskForProduct } from "./allergens-data";

export type Cosmetic = {
  id: string;
  brand: string;
  name: string;
  category: string; // 세럼/크림/토너/앰플/클렌징/선크림
  ingredients: string[];
  forTypes: string[]; // 건성/지성/복합/중성/민감
  concerns: string[]; // 주름/기미/수분/트러블
  rating: number;
  feel: string; // 산뜻/보습/진정/촉촉
  desc: string;
  fullMl: number; // 정품 용량
  price: number; // 정가(원, 근사·참고용)
  safety: string[]; // 약산성/무향/저자극/무기자차 등
  oliveYoungUrl: string;
  linkType: "direct" | "search"; // direct=개별 상품페이지, search=검색 폴백
  image?: string;
};

// 올리브영 실제 판매 제품 기반 큐레이션 (실시간 연동 아님). 정가는 근사·참고용.
export const COSMETICS: Cosmetic[] = [
  { id: "toriden-divein", brand: "토리든", name: "다이브인 저분자 히알루론산 세럼", category: "세럼", ingredients: ["히알루론산"], forTypes: ["건성", "민감", "복합"], concerns: ["수분"], rating: 4.6, feel: "산뜻", desc: "저분자 히알루론산으로 속보습을 빠르게 채워주는 스테디셀러", fullMl: 50, price: 22000, safety: ["약산성", "저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000128643", linkType: "direct" },
  { id: "estra-atobarrier", brand: "에스트라", name: "아토베리어365 크림", category: "크림", ingredients: ["세라마이드"], forTypes: ["건성", "민감"], concerns: ["수분"], rating: 4.68, feel: "보습", desc: "세라마이드로 피부장벽을 강화하는 고보습 진정 크림", fullMl: 80, price: 32000, safety: ["무향", "저자극테스트"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000198320", linkType: "direct" },
  { id: "anua-pdrn", brand: "아누아", name: "PDRN 히알루론산 캡슐 100 세럼", category: "세럼", ingredients: ["PDRN", "히알루론산"], forTypes: ["건성", "복합", "중성"], concerns: ["수분", "주름"], rating: 4.6, feel: "촉촉", desc: "PDRN+히알루론산으로 탄력·보습을 함께 잡는 세럼", fullMl: 30, price: 26000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000231894", linkType: "direct" },
  { id: "esnature-aqua-toner", brand: "에스네이처", name: "아쿠아 오아시스 토너", category: "토너", ingredients: ["히알루론산"], forTypes: ["건성", "중성", "복합"], concerns: ["수분"], rating: 4.74, feel: "산뜻", desc: "가볍게 수분을 채워주는 데일리 수분 토너", fullMl: 300, price: 21000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000158369", linkType: "direct" },
  { id: "wellage-blue-ampoule", brand: "웰라쥬", name: "리얼 히알루로닉 블루 100 앰플", category: "앰플", ingredients: ["히알루론산"], forTypes: ["건성", "복합", "민감"], concerns: ["수분"], rating: 4.66, feel: "촉촉", desc: "히알루론산 앰플로 집중 수분 공급", fullMl: 100, price: 30000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000147809", linkType: "direct" },
  { id: "roundlab-birch-sun", brand: "라운드랩", name: "자작나무 수분 선크림 SPF50+", category: "선크림", ingredients: ["자작나무수액"], forTypes: ["건성", "중성", "복합", "민감"], concerns: ["수분"], rating: 4.6, feel: "촉촉", desc: "촉촉하게 발리는 데일리 수분 선크림", fullMl: 50, price: 19000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000149135", linkType: "direct" },
  { id: "roundlab-dokdo-toner", brand: "라운드랩", name: "1025 독도 토너", category: "토너", ingredients: ["미네랄", "진정"], forTypes: ["지성", "복합", "민감"], concerns: ["트러블"], rating: 4.6, feel: "산뜻", desc: "자극 없이 결을 정돈하는 진정 토너", fullMl: 200, price: 20000, safety: ["저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000132162", linkType: "direct" },
  { id: "beplain-mungbean", brand: "비플레인", name: "녹두 약산성 클렌징폼", category: "클렌징", ingredients: ["약산성", "녹두"], forTypes: ["지성", "복합", "민감"], concerns: ["트러블"], rating: 4.63, feel: "산뜻", desc: "피지·모공 관리에 좋은 약산성 클렌징", fullMl: 80, price: 12000, safety: ["약산성"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000142520", linkType: "direct" },
  { id: "toriden-divein-cleansing", brand: "토리든", name: "다이브인 저분자 히알루론산 클렌징 폼", category: "클렌징", ingredients: ["히알루론산", "저분자"], forTypes: ["건성", "민감", "복합"], concerns: ["수분"], rating: 4.7, feel: "촉촉", desc: "세안 후에도 당기지 않게 속보습을 남기는 저자극 폼", fullMl: 150, price: 16000, safety: ["약산성", "저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("토리든 다이브인 저분자 히알루론산 클렌징 폼"), linkType: "search" },
  { id: "esnature-aqua-rice-cleansing", brand: "에스네이처", name: "아쿠아 라이스 약산성 클렌징 폼", category: "클렌징", ingredients: ["쌀추출물", "약산성"], forTypes: ["건성", "중성", "복합"], concerns: ["수분"], rating: 4.7, feel: "산뜻", desc: "쌀 성분으로 순하게 씻어내는 약산성 데일리 폼", fullMl: 150, price: 15000, safety: ["약산성"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("에스네이처 아쿠아 라이스 약산성 클렌징 폼"), linkType: "search" },
  { id: "shenli-kelp-cleansing", brand: "션리", name: "다시마 앰플 클렌징폼", category: "클렌징", ingredients: ["다시마", "미네랄"], forTypes: ["지성", "복합", "중성"], concerns: ["수분", "트러블"], rating: 4.5, feel: "촉촉", desc: "다시마 앰플 성분으로 세안 후에도 속당김 없이 촉촉하게", fullMl: 120, price: 15000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("션리 다시마 앰플 클렌징폼"), linkType: "search" },
  { id: "suiskin-sprout-cleansing", brand: "수이스킨", name: "어린새싹 딥 클렌징 폼", category: "클렌징", ingredients: ["새싹추출물"], forTypes: ["지성", "복합"], concerns: ["트러블"], rating: 4.6, feel: "산뜻", desc: "모공 속 노폐물까지 개운하게 씻어내는 딥 클렌징 폼", fullMl: 120, price: 14000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("수이스킨 어린새싹 딥 클렌징 폼"), linkType: "search" },
  { id: "illiyoon-ceramide-wash", brand: "일리윤", name: "세라마이드 아토 6.0 탑투토 워시", category: "클렌징", ingredients: ["세라마이드"], forTypes: ["건성", "민감"], concerns: ["수분"], rating: 4.7, feel: "보습", desc: "얼굴부터 몸까지, 순하게 세안하며 장벽을 지키는 약산성 워시", fullMl: 500, price: 17000, safety: ["약산성", "저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("일리윤 세라마이드 아토 6.0 탑투토 워시"), linkType: "search" },
  { id: "goodal-vitac", brand: "구달", name: "청귤 비타C 잡티케어 세럼", category: "세럼", ingredients: ["비타민C"], forTypes: ["중성", "복합", "지성"], concerns: ["기미"], rating: 4.5, feel: "산뜻", desc: "비타민C로 잡티·톤 케어하는 브라이트닝 세럼", fullMl: 30, price: 27000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000162325", linkType: "direct" },
  { id: "drg-red-blemish", brand: "닥터지", name: "레드 블레미쉬 클리어 수딩 크림", category: "크림", ingredients: ["센텔라", "시카"], forTypes: ["민감", "복합", "지성"], concerns: ["트러블"], rating: 4.5, feel: "진정", desc: "붉은기·민감을 진정시키는 수딩크림", fullMl: 70, price: 30000, safety: ["진정", "저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000164615", linkType: "direct" },
  { id: "layerlab-panthenol", brand: "레이어랩", name: "니오좀 판테놀 5% 세럼", category: "세럼", ingredients: ["판테놀"], forTypes: ["민감", "건성"], concerns: ["수분", "트러블"], rating: 4.6, feel: "진정", desc: "판테놀 고함량으로 예민해진 피부를 진정시키는 세럼", fullMl: 40, price: 34000, safety: ["진정"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("레이어랩 니오좀 판테놀 5% 세럼"), linkType: "search" },
  { id: "esnature-squalane", brand: "에스네이처", name: "아쿠아 스쿠알란 수분크림", category: "크림", ingredients: ["스쿠알란"], forTypes: ["건성", "중성"], concerns: ["수분"], rating: 4.58, feel: "보습", desc: "스쿠알란으로 유수분 밸런스를 맞추는 수분크림", fullMl: 60, price: 27000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("에스네이처 아쿠아 스쿠알란 수분크림"), linkType: "search" },
  { id: "wellage-soothing", brand: "웰라쥬", name: "리얼 히알루로닉 수딩크림", category: "크림", ingredients: ["히알루론산"], forTypes: ["민감", "건성"], concerns: ["수분", "트러블"], rating: 4.6, feel: "진정", desc: "진정+보습을 동시에 주는 수딩크림", fullMl: 80, price: 28000, safety: ["진정"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("웰라쥬 리얼 히알루로닉 수딩크림"), linkType: "search" },
  { id: "tonymoly-ceramide", brand: "토니모리", name: "세라마이드 모찌 토너", category: "토너", ingredients: ["세라마이드"], forTypes: ["건성", "민감"], concerns: ["수분"], rating: 4.69, feel: "보습", desc: "세라마이드로 장벽을 채워주는 촉촉 토너", fullMl: 300, price: 13000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("토니모리 세라마이드 모찌 토너"), linkType: "search" },
  { id: "innisfree-retinol-cica", brand: "이니스프리", name: "레티놀 시카 흔적 앰플", category: "앰플", ingredients: ["레티놀", "시카"], forTypes: ["복합", "지성", "중성"], concerns: ["주름", "트러블"], rating: 4.5, feel: "진정", desc: "레티놀+시카로 탄력·흔적 케어", fullMl: 30, price: 33000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("이니스프리 레티놀 시카 흔적 앰플"), linkType: "search" },
  { id: "drg-green-sun", brand: "닥터지", name: "그린 마일드 업 선 플러스 SPF50+", category: "선크림", ingredients: ["무기자차", "시카"], forTypes: ["민감", "지성", "복합"], concerns: ["트러블"], rating: 4.5, feel: "산뜻", desc: "민감·지성도 편한 순한 무기자차 선크림", fullMl: 50, price: 26000, safety: ["무기자차", "저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("닥터지 그린 마일드 업 선"), linkType: "search" },
  { id: "clio-noscarnine", brand: "클리오", name: "노스카나인 트러블 세럼", category: "세럼", ingredients: ["노스카나인", "BHA"], forTypes: ["지성", "복합"], concerns: ["트러블"], rating: 4.4, feel: "산뜻", desc: "트러블·피지 집중 케어 세럼", fullMl: 20, price: 20000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("클리오 노스카나인 트러블 세럼"), linkType: "search" },
  { id: "numbuzin-no1", brand: "넘버즈인", name: "1번 시그니처 세럼", category: "세럼", ingredients: ["나이아신아마이드"], forTypes: ["지성", "복합", "중성"], concerns: ["기미", "트러블"], rating: 4.4, feel: "산뜻", desc: "나이아신아마이드로 피지·톤을 정돈", fullMl: 30, price: 20000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("넘버즈인 1번 시그니처 세럼"), linkType: "search" },
  { id: "ahc-herb-rose-toner", brand: "AHC", name: "허브솔루션 로즈 토너", category: "토너", ingredients: ["다마스크장미꽃수"], forTypes: ["건성", "중성", "복합"], concerns: ["수분"], rating: 4.5, feel: "촉촉", desc: "다마스크 장미꽃수로 산뜻하게 결을 정돈하는 대용량 토너", fullMl: 500, price: 13800, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000165364", linkType: "direct" },
  { id: "numbuzin-no3-toner", brand: "넘버즈인", name: "3번 보들보들 퍼스트 결부스팅 토너", category: "토너", ingredients: ["나이아신아마이드", "세라마이드", "판테놀"], forTypes: ["지성", "복합", "중성"], concerns: ["수분", "트러블"], rating: 4.5, feel: "산뜻", desc: "나이아신아마이드로 피부결을 정돈하는 자극 없는 데일리 토너", fullMl: 200, price: 24000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000250711", linkType: "direct" },
  { id: "abib-heartleaf-toner", brand: "아비브", name: "어성초 카밍 토너 스킨 부스터", category: "토너", ingredients: ["어성초추출물", "히알루론산"], forTypes: ["지성", "복합", "민감"], concerns: ["트러블", "수분"], rating: 4.7, feel: "진정", desc: "지리산 어성초 추출물로 열감을 식혀주는 쿨링 진정 토너", fullMl: 200, price: 23000, safety: ["저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000155253", linkType: "direct" },
  { id: "drg-aclear-toner", brand: "닥터지", name: "에이클리어 밸런싱 토너", category: "토너", ingredients: ["살리실산", "마데카소사이드"], forTypes: ["지성", "복합"], concerns: ["트러블"], rating: 4.52, feel: "산뜻", desc: "과잉 피지와 각질을 정돈하는 약산성 저자극 토너", fullMl: 200, price: 25000, safety: ["약산성", "저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000165710", linkType: "direct" },
  { id: "ahc-herb-witchhazel-toner", brand: "AHC", name: "허브솔루션 위치하젤 토너", category: "토너", ingredients: ["위치하젤"], forTypes: ["지성", "복합"], concerns: ["트러블"], rating: 4.2, feel: "산뜻", desc: "위치하젤로 모공과 피지를 산뜻하게 정돈하는 토너", fullMl: 500, price: 15000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000165355", linkType: "direct" },
  { id: "blancdoux-oligo-toner", brand: "더랩바이블랑두", name: "올리고 히알루론산 저분자 딥 토너", category: "토너", ingredients: ["올리고히알루론산", "히알루론산"], forTypes: ["건성", "민감"], concerns: ["수분"], rating: 4.7, feel: "촉촉", desc: "저분자 히알루론산이 각질층까지 빠르게 채우는 딥 토너", fullMl: 200, price: 15100, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("더랩바이블랑두 올리고 히알루론산 저분자 딥 토너"), linkType: "search" },
  { id: "bringgreen-teatree-toner", brand: "브링그린", name: "티트리 시카 수딩 토너", category: "토너", ingredients: ["티트리추출물", "병풀"], forTypes: ["지성", "민감", "복합"], concerns: ["트러블"], rating: 4.53, feel: "진정", desc: "티트리와 시카로 트러블 피부를 순하게 진정시키는 토너", fullMl: 500, price: 27000, safety: ["무알코올", "무향"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000189181", linkType: "direct" },
  { id: "manyo-pantheto-toner", brand: "마녀공장", name: "판테토인 에센스 토너", category: "토너", ingredients: ["판테토인", "병풀"], forTypes: ["건성", "복합", "민감"], concerns: ["수분"], rating: 4.68, feel: "촉촉", desc: "판테토인 성분으로 빠르고 깊은 속보습을 채우는 에센스 토너", fullMl: 200, price: 32000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000199405", linkType: "direct" },
  { id: "easydew-melatoning-toner", brand: "이지듀", name: "멜라토닝 울트라카밍 토너 시카알로에", category: "토너", ingredients: ["시카", "알로에"], forTypes: ["민감", "복합"], concerns: ["트러블", "기미"], rating: 4.4, feel: "진정", desc: "시카·알로에가 피부 열감과 자극을 빠르게 진정시키는 토너", fullMl: 130, price: 31800, safety: ["저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("이지듀 멜라토닝 울트라카밍 토너 시카알로에"), linkType: "search" },
  { id: "roundlab-birch-toner", brand: "라운드랩", name: "자작나무 수분 토너", category: "토너", ingredients: ["자작나무수액", "히알루론산"], forTypes: ["건성", "중성", "복합"], concerns: ["수분"], rating: 4.39, feel: "촉촉", desc: "자작나무 수액이 촉촉하게 채워주는 수분 앰플 토너", fullMl: 300, price: 23800, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000148252", linkType: "direct" },
  { id: "fation-noscarnine-toner", brand: "파티온", name: "노스카나인 트러블 클리어 토너", category: "토너", ingredients: ["노스카나인", "알란토인"], forTypes: ["지성", "민감"], concerns: ["트러블"], rating: 4.4, feel: "산뜻", desc: "살리실산 유도체로 트러블 피부를 진정시키는 약산성 토너", fullMl: 200, price: 19900, safety: ["약산성"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000182787", linkType: "direct" },
  { id: "ahc-herb-lemon-toner", brand: "AHC", name: "허브솔루션 레몬 토너", category: "토너", ingredients: ["레몬추출물"], forTypes: ["지성", "복합"], concerns: ["트러블"], rating: 4.2, feel: "산뜻", desc: "상큼한 레몬 향으로 피지와 유분을 산뜻하게 정돈하는 토너", fullMl: 500, price: 15000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000165366", linkType: "direct" },
  { id: "scinic-hyaluronic-skin", brand: "싸이닉", name: "히아루론산 앰플 스킨", category: "토너", ingredients: ["히알루론산", "마데카소사이드"], forTypes: ["건성", "민감", "복합"], concerns: ["수분"], rating: 4.4, feel: "촉촉", desc: "5중 히알루론산이 촘촘하게 채우는 순한 수분 앰플 스킨", fullMl: 150, price: 18000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("싸이닉 히아루론산 앰플 스킨"), linkType: "search" },
  { id: "numbuzin-no5-glutathione", brand: "넘버즈인", name: "5번 글루타치온C 흔적 앰플", category: "앰플", ingredients: ["글루타치온", "비타민C", "트라넥삼산", "나이아신아마이드"], forTypes: ["건성", "지성", "복합", "중성", "민감"], concerns: ["기미"], rating: 4.6, feel: "산뜻", desc: "글루타치온·비타민C·트라넥삼산으로 흔적·잡티를 밝혀주는 브라이트닝 앰플", fullMl: 30, price: 28000, safety: ["저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("넘버즈인 5번 글루타치온C 흔적 앰플"), linkType: "search" },
  { id: "missha-vitac-plus-ampoule", brand: "미샤", name: "비타씨플러스 잡티씨 탄력 앰플", category: "앰플", ingredients: ["비타민C", "나이아신아마이드", "아데노신", "프로폴리스"], forTypes: ["건성", "지성", "복합", "중성"], concerns: ["기미", "주름"], rating: 4.6, feel: "산뜻", desc: "비타민C·나이아신아마이드로 잡티를 밝히고 탄력까지 잡는 이중기능성 앰플", fullMl: 40, price: 28000, safety: ["저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("미샤 비타씨플러스 잡티씨 탄력 앰플"), linkType: "search" },
  { id: "missha-time-revolution-night-repair", brand: "미샤", name: "타임 레볼루션 나이트 리페어 보랏빛 앰플 5X", category: "앰플", ingredients: ["비피다발효용해물", "나이아신아마이드", "아데노신", "히알루론산"], forTypes: ["건성", "지성", "복합", "중성", "민감"], concerns: ["주름", "수분", "기미"], rating: 4.7, feel: "촉촉", desc: "비피다 발효 성분으로 밤사이 피부를 재생·보습하는 나이트 리페어 앰플", fullMl: 70, price: 42000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("미샤 타임 레볼루션 나이트 리페어 보랏빛 앰플 5X"), linkType: "search" },
  { id: "missha-bee-pollen-ampouler", brand: "미샤", name: "비폴렌 리뉴 앰풀러", category: "앰플", ingredients: ["화분추출물", "프로폴리스", "꿀추출물", "판테놀"], forTypes: ["건성", "복합", "민감"], concerns: ["수분", "트러블", "주름"], rating: 4.6, feel: "진정", desc: "비폴렌·프로폴리스로 피부를 진정하고 밀도를 채우는 항산화 앰플", fullMl: 40, price: 28000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("미샤 비폴렌 리뉴 앰풀러"), linkType: "search" },
  { id: "goodal-vitac15-ampoule", brand: "구달", name: "청귤 비타C 15 잡티 케어 앰플", category: "앰플", ingredients: ["비타민C", "청귤추출물", "나이아신아마이드", "글루타치온"], forTypes: ["건성", "지성", "복합", "중성"], concerns: ["기미"], rating: 4.4, feel: "산뜻", desc: "순수 비타민C 15%·청귤추출물로 기미·잡티를 집중 케어하는 브라이트닝 앰플", fullMl: 16, price: 32000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("구달 청귤 비타C 15 잡티 케어 앰플"), linkType: "search" },
  { id: "manyo-bifida-biome-ampoule", brand: "마녀공장", name: "비피다 바이옴 콤플렉스 앰플", category: "앰플", ingredients: ["비피다발효용해물", "나이아신아마이드", "히알루론산", "아데노신"], forTypes: ["건성", "복합", "중성", "민감"], concerns: ["수분", "주름", "기미"], rating: 4.7, feel: "촉촉", desc: "비피다 발효 성분으로 장벽을 강화하고 미백·주름까지 돕는 촉촉한 앰플", fullMl: 30, price: 32000, safety: ["저자극테스트"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("마녀공장 비피다 바이옴 콤플렉스 앰플"), linkType: "search" },
  { id: "easydew-egf-melatoning-ampoule", brand: "이지듀", name: "DW-EGF 멜라토닝 원데이 앰플", category: "앰플", ingredients: ["EGF", "나이아신아마이드", "글루타치온", "아스코르빌글루코사이드"], forTypes: ["건성", "복합", "중성", "민감"], concerns: ["기미", "주름"], rating: 4.5, feel: "촉촉", desc: "DW-EGF와 나이아신아마이드·글루타치온으로 미백·탄력을 케어하는 더마 앰플", fullMl: 30, price: 90000, safety: ["저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("이지듀 DW-EGF 멜라토닝 원데이 앰플"), linkType: "search" },
  { id: "centellian24-madeca-power-ampoule", brand: "센텔리안24", name: "마데카 파워 앰플", category: "앰플", ingredients: ["병풀추출물", "마데카소사이드", "나이아신아마이드", "아데노신"], forTypes: ["건성", "복합", "중성", "민감"], concerns: ["주름", "기미", "트러블"], rating: 4.5, feel: "진정", desc: "병풀 유효성분에 나이아신아마이드·아데노신을 더해 진정과 미백·주름을 잡는 이중기능성 앰플", fullMl: 30, price: 29800, safety: ["저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("센텔리안24 마데카 파워 앰플"), linkType: "search" },
  { id: "mediheal-madecassoside-serum", brand: "메디힐", name: "마데카소사이드 흔적 리페어 세럼", category: "세럼", ingredients: ["마데카소사이드", "병풀추출물", "판테놀", "히알루론산"], forTypes: ["건성", "지성", "복합", "중성", "민감"], concerns: ["트러블", "수분", "기미"], rating: 4.3, feel: "진정", desc: "마데카소사이드가 붉은 흔적을 진정시키고 수분을 채워 결·톤을 정돈하는 세럼", fullMl: 40, price: 22000, safety: ["저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("메디힐 마데카소사이드 흔적 리페어 세럼"), linkType: "search" },
  { id: "drg-red-blemish-hyalcica-serum", brand: "닥터지", name: "레드 블레미쉬 클리어 히알 시카 수딩 세럼", category: "세럼", ingredients: ["병풀추출물", "히알루론산", "판테놀", "마데카소사이드", "알란토인"], forTypes: ["건성", "복합", "민감"], concerns: ["수분", "트러블"], rating: 4.7, feel: "진정", desc: "'히알시카'로 민감 피부에 수분을 채우고 자극·흔적을 진정시키는 수분 진정 세럼", fullMl: 50, price: 33000, safety: ["저자극", "무향"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("닥터지 레드 블레미쉬 클리어 히알 시카 수딩 세럼"), linkType: "search" },
  { id: "drg-brightening-up-sun", brand: "닥터지", name: "브라이트닝 업 선 플러스", category: "선크림", ingredients: ["징크옥사이드", "티타늄디옥사이드", "나이아신아마이드"], forTypes: ["건성", "복합", "중성"], concerns: ["기미", "수분"], rating: 4.5, feel: "산뜻", desc: "SPF50+ 피치베이지 톤업 선크림, 화사한 톤보정과 파데프리 마무리", fullMl: 50, price: 32000, safety: ["미백기능성"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("닥터지 브라이트닝 업 선 플러스"), linkType: "search" },
  { id: "mediheal-madecassoside-sun-serum", brand: "메디힐", name: "마데카소사이드 수분 선세럼 흔적 리페어", category: "선크림", ingredients: ["나이아신아마이드", "마데카소사이드", "병풀추출물", "히알루론산"], forTypes: ["건성", "민감", "복합"], concerns: ["트러블", "수분", "기미"], rating: 4.6, feel: "촉촉", desc: "SPF50+ 세럼형 선케어, 마데카소사이드로 진정·흔적 케어와 수분을 동시에", fullMl: 50, price: 22000, safety: ["저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("메디힐 마데카소사이드 수분 선세럼 흔적 리페어"), linkType: "search" },
  { id: "athe-vegan-relief-sun", brand: "아떼", name: "비건 릴리프 무기자차 선크림", category: "선크림", ingredients: ["징크옥사이드", "티타늄디옥사이드", "병풀추출물", "판테놀"], forTypes: ["민감", "건성", "복합"], concerns: ["트러블", "수분"], rating: 4.5, feel: "진정", desc: "SPF50+ 비건 무기자차 선크림, 민감 피부 진정과 자연스러운 톤보정", fullMl: 50, price: 21000, safety: ["무기자차", "비건", "저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("아떼 비건 릴리프 무기자차 선크림"), linkType: "search" },
  { id: "daeffect-hydro-sunscreen", brand: "디에이이펙트", name: "하이드로 선스크린", category: "선크림", ingredients: ["병풀추출물", "세라마이드", "나이아신아마이드", "판테놀"], forTypes: ["민감", "건성", "복합"], concerns: ["트러블", "수분", "주름"], rating: 4.6, feel: "촉촉", desc: "SPF50+ 더마 선크림, 시술 후에도 순한 진정·보습과 백탁 없는 밀착 마무리", fullMl: 30, price: 39000, safety: ["저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("디에이이펙트 하이드로 선스크린"), linkType: "search" },
  { id: "biozin-albumin-mela-toneup-sun", brand: "비오진", name: "알부민 멜라 리셋 톤업 선크림", category: "선크림", ingredients: ["티타늄디옥사이드", "나이아신아마이드", "트라넥삼산", "알부민추출물"], forTypes: ["복합", "건성", "중성"], concerns: ["기미", "수분"], rating: 4.5, feel: "촉촉", desc: "SPF50+ 톤업 선크림, 알부민·트라넥삼산으로 멜라닌 케어와 화사한 톤업", fullMl: 50, price: 35000, safety: ["미백기능성"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("비오진 알부민 멜라 리셋 톤업 선크림"), linkType: "search" },
  { id: "hiuh-vita-waterful-sun-essence", brand: "히읗", name: "NEW 비타 워터풀 선에센스", category: "선크림", ingredients: ["나이아신아마이드", "비타민C유도체", "히알루론산", "판테놀"], forTypes: ["건성", "복합", "중성"], concerns: ["기미", "수분"], rating: 4.5, feel: "촉촉", desc: "SPF50+ 에센스형 선케어, 비타민·수분으로 산뜻하게 톤 브라이트닝", fullMl: 50, price: 25000, safety: ["저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("히읗 비타 워터풀 선에센스"), linkType: "search" },
  { id: "scinic-enjoy-mild-sun-essence", brand: "싸이닉", name: "엔조이 슈퍼 마일드 수분 선에센스", category: "선크림", ingredients: ["에칠헥실메톡시신나메이트", "나이아신아마이드", "아데노신", "히알루론산"], forTypes: ["건성", "복합", "민감"], concerns: ["수분"], rating: 4.5, feel: "촉촉", desc: "SPF50+ 유기자차 선에센스, 수분 에센스처럼 촉촉하게 흡수되는 데일리 자차", fullMl: 50, price: 15000, safety: ["저자극테스트", "비건"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("싸이닉 엔조이 슈퍼 마일드 수분 선에센스"), linkType: "search" },
  { id: "ahc-masters-toneup-sun-serum", brand: "AHC", name: "마스터즈 톤업 선세럼", category: "선크림", ingredients: ["티타늄디옥사이드", "나이아신아마이드", "아데노신", "히알루론산"], forTypes: ["건성", "복합", "중성"], concerns: ["기미", "수분"], rating: 4.5, feel: "촉촉", desc: "SPF50+ 세럼형 톤업 선크림, 백탁 없이 자연스러운 데일리 톤업", fullMl: 50, price: 33000, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("AHC 마스터즈 톤업 선세럼"), linkType: "search" },
  { id: "shingmulnara-watery-sun-gel", brand: "식물나라", name: "가벼운 수분 선 젤", category: "선크림", ingredients: ["나이아신아마이드", "알로에베라잎추출물", "히알루론산", "아데노신"], forTypes: ["지성", "복합"], concerns: ["수분"], rating: 4.4, feel: "산뜻", desc: "SPF50+ 수분 젤 선크림, 백탁 없이 산뜻하게 발리는 가벼운 데일리 자차", fullMl: 60, price: 14800, safety: [], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("식물나라 가벼운 수분 선 젤 선크림"), linkType: "search" },
  { id: "cellfusionc-spot-toning-sunscreen", brand: "셀퓨전씨", name: "잡티 토닝 썬스크린", category: "선크림", ingredients: ["티타늄디옥사이드", "징크옥사이드", "나이아신아마이드", "아데노신"], forTypes: ["지성", "복합", "민감"], concerns: ["기미"], rating: 4.5, feel: "산뜻", desc: "SPF50+ 무기자차 톤업 선크림, 잡티 케어까지 챙기는 미백·주름 기능성", fullMl: 50, price: 27900, safety: ["무기자차", "저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("셀퓨전씨 잡티 토닝 썬스크린"), linkType: "search" },
  { id: "goodal-houttuynia-calming-sun", brand: "구달", name: "맑은 어성초 진정 무기자차 선크림", category: "선크림", ingredients: ["어성초추출물", "징크옥사이드", "티타늄디옥사이드", "판테놀"], forTypes: ["민감", "지성", "복합"], concerns: ["트러블", "수분"], rating: 4.5, feel: "진정", desc: "SPF50+ 어성초 진정 무기자차 선크림, 백탁 적고 자극받은 피부를 진정", fullMl: 50, price: 20000, safety: ["무기자차", "비건", "저자극"], oliveYoungUrl: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + encodeURIComponent("구달 맑은 어성초 진정 무기자차 선크림"), linkType: "search" },
];

export type WxProfile = { temp: number; humidity: number; uv: number; dust: number };
export type Recommendation = { p: Cosmetic; reason: string };

function normType(t: string) {
  return t.replace("복합성", "복합").replace("민감성", "민감");
}

export function recommendCosmetics(
  skinTypeForRec: string,
  sensitivity: string,
  concerns: string[],
  wx: WxProfile,
  userAllergies: string[] = []
): { summary: string; items: Recommendation[] } {
  const skin = normType(skinTypeForRec);
  const dry = wx.humidity <= 45;
  const hotHumid = wx.temp >= 30 && wx.humidity >= 70;
  const hiUV = wx.uv >= 8;
  const hiDust = wx.dust >= 80;

  const scored = COSMETICS.map((p) => {
    let s = 0;
    if (p.forTypes.includes(skin)) s += 3;
    const matched = concerns.filter((c) => p.concerns.includes(c));
    s += matched.length * 2;
    s += (p.rating - 4.3) * 4;
    if (sensitivity === "민감") {
      if (p.forTypes.includes("민감")) s += 1.5;
      if (p.feel === "진정") s += 1;
    }
    if (dry && p.concerns.includes("수분")) s += 2;
    if (hotHumid) {
      if (p.feel === "산뜻") s += 1.5;
      if (["클렌징", "토너", "선크림"].includes(p.category)) s += 0.6;
    }
    if (hiUV) {
      if (p.category === "선크림") s += 2.5;
      if (p.concerns.includes("기미")) s += 1;
    }
    if (hiDust && (p.concerns.includes("트러블") || p.category === "클렌징")) s += 1;
    // 등록된 알러지 성분과 겹치는 제품은 완전히 배제하지 않고 순위만 낮춰서, 대안이 없을 때도
    // "⚠️ 주의" 표시와 함께 여전히 확인할 수 있게 한다(오탐 가능성이 있는 로컬 매칭이라 강제 제외는 과함).
    const allergyRisk = allergyRiskForProduct(userAllergies, p.ingredients, p.safety);
    if (allergyRisk.length) s -= 3;
    return { p, s, matched, allergyRisk };
  });

  scored.sort((a, b) => b.s - a.s || b.p.rating - a.p.rating);

  // 카테고리별로 가장 점수가 높은 제품 1개만 후보로 남긴다 — "카테고리별 대표" 추천이라는
  // 취지대로, 같은 카테고리(예: 토너 2개)가 중복으로 추천되지 않게 하고 클렌징폼처럼
  // 전체 경쟁에서 밀리기 쉬운 카테고리도 항상 하나는 포함되게 한다.
  const seenCategory = new Set<string>();
  const top = scored.filter(({ p }) => {
    if (seenCategory.has(p.category)) return false;
    seenCategory.add(p.category);
    return true;
  });

  const items: Recommendation[] = top.map(({ p, matched, allergyRisk }) => {
    const bits: string[] = [];
    if (allergyRisk.length) bits.push(`⚠️ ${allergyRisk.join("·")} 주의`);
    if (p.forTypes.includes(skin)) bits.push(`${skinTypeForRec} 피부 적합`);
    if (p.ingredients[0]) bits.push(`${p.ingredients[0]} 함유`);
    if (hiUV && p.category === "선크림") bits.push("강한 자외선 차단");
    else if (hiDust && p.category === "클렌징") bits.push("미세먼지 많은 날 클렌징 케어");
    else if (dry && p.concerns.includes("수분")) bits.push("건조한 기후 속보습");
    else if (hotHumid && p.feel === "산뜻") bits.push("습한 날 산뜻하게");
    else if (matched[0]) bits.push(`'${matched[0]}' 고민 케어`);
    return { p, reason: bits.slice(0, 3).join(" · ") };
  });

  const driver = hiUV ? "강한 자외선" : dry ? "건조한 공기" : hotHumid ? "고온다습" : hiDust ? "높은 미세먼지" : "쾌적한 날씨";
  const approach =
    sensitivity === "민감"
      ? "진정 성분(센텔라·판테놀)"
      : skin === "건성"
        ? "고보습(히알루론산·세라마이드)"
        : skin === "지성"
          ? "피지 케어(BHA·나이아신)"
          : "수분·톤 밸런스";
  const sun = hiUV ? " + 무기자차 선크림" : "";
  const summary = `${skinTypeForRec} + ${driver} → ${approach}${sun} → 아래 추천`;

  return { summary, items };
}

/* ── [5-4] 소용량 샘플 로직 ── */
export const SAMPLE_TIERS = [10, 20, 30, 50, 75];
const DAILY_USAGE: Record<string, number> = { 토너: 2.0, 세럼: 1.0, 앰플: 1.0, 크림: 1.5, 선크림: 2.0, 클렌징: 2.0 };
const MOIST_CATS = ["토너", "크림", "앰플", "세럼"];

export function dailyUsage(category: string) {
  return DAILY_USAGE[category] ?? 1.5;
}

// 여행 일수 + 기후로 추천 용량 티어 산출
export function recommendVolume(category: string, days: number, dryHigh: boolean, uvHigh: boolean) {
  const need = dailyUsage(category) * days * 1.2;
  let idx = SAMPLE_TIERS.findIndex((t) => t >= need);
  if (idx === -1) idx = SAMPLE_TIERS.length - 1;
  if (dryHigh && MOIST_CATS.includes(category)) idx = Math.min(SAMPLE_TIERS.length - 1, idx + 1);
  if (uvHigh && category === "선크림") idx = Math.min(SAMPLE_TIERS.length - 1, idx + 1);
  const ml = SAMPLE_TIERS[idx];
  const qty = ml >= 75 && need > 75 ? Math.ceil(need / 75) : 1;
  return { ml, qty, need: Math.round(need) };
}

// ml당 단가 기준 소용량 금액 (100원 반올림)
export function samplePrice(price: number, fullMl: number, ml: number) {
  const per = price / fullMl;
  return Math.round((per * ml) / 100) * 100;
}
