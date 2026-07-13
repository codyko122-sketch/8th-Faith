// 화장품 성분 사전 — 성분 검색 화면(app/(site)/ingredients)에서 사용.
// 대표적인 K-뷰티 성분의 효능·적합 고민·주의사항을 한 줄로 정리한 참고용 데이터.
// (의학적 판정이 아니며, 실제 제품은 전성분·농도에 따라 다를 수 있음.)

export type IngredientInfo = {
  name: string; // 한글 성분명
  inci: string; // 영문 INCI 표기
  category: string; // 카테고리(아래 CATEGORIES)
  effect: string; // 한 줄 효능
  goodFor: string[]; // 적합한 피부타입·고민 키워드
  caution?: string; // 주의사항(있을 때만)
  aliases?: string[]; // 검색용 이명
};

export const INGREDIENT_CATEGORIES = [
  "보습",
  "진정",
  "각질·필링",
  "미백·톤",
  "주름·탄력",
  "자외선차단",
  "피지·트러블",
  "보존·기타",
  "향료",
] as const;

export const INGREDIENTS: IngredientInfo[] = [
  // ── 보습 ──
  { name: "히알루론산", inci: "Sodium Hyaluronate", category: "보습", effect: "물을 끌어당겨 각질층에 수분을 채우는 대표 보습 성분", goodFor: ["건성", "수분", "민감"], aliases: ["하이알루로닉애씨드", "hyaluronic", "히알루론"] },
  { name: "글리세린", inci: "Glycerin", category: "보습", effect: "수분을 붙잡아 피부를 촉촉하게 유지하는 기본 습윤제", goodFor: ["건성", "수분"], aliases: ["glycerin"] },
  { name: "세라마이드", inci: "Ceramide NP", category: "보습", effect: "피부 장벽의 지질을 채워 수분 손실을 막아주는 성분", goodFor: ["건성", "민감", "장벽"], aliases: ["세라마이드엔피", "ceramide"] },
  { name: "스쿠알란", inci: "Squalane", category: "보습", effect: "가벼운 유분막을 만들어 수분 증발을 막는 에몰리언트", goodFor: ["건성", "중성"], aliases: ["squalane"] },
  { name: "베타인", inci: "Betaine", category: "보습", effect: "수분을 보유하고 자극을 완화하는 컨디셔닝 성분", goodFor: ["민감", "수분"], aliases: ["betaine"] },
  { name: "트레할로스", inci: "Trehalose", category: "보습", effect: "수분을 오래 잡아주는 당류 보습 성분", goodFor: ["건성", "수분"], aliases: ["trehalose"] },
  { name: "콜라겐", inci: "Collagen", category: "보습", effect: "보습과 탄력 케어를 보조하는 단백질 성분", goodFor: ["건성", "탄력"], aliases: ["collagen"] },

  // ── 진정 ──
  { name: "판테놀", inci: "Panthenol", category: "진정", effect: "프로비타민 B5, 진정·장벽 강화·보습을 돕는 성분", goodFor: ["민감", "트러블", "수분"], aliases: ["panthenol", "판테올"] },
  { name: "센텔라아시아티카", inci: "Centella Asiatica Extract", category: "진정", effect: "병풀 추출물, 붉은기·자극 진정과 회복 도움", goodFor: ["민감", "트러블", "홍조"], aliases: ["시카", "병풀", "centella", "cica"] },
  { name: "마데카소사이드", inci: "Madecassoside", category: "진정", effect: "병풀 유래 성분으로 진정과 피부 재생을 도움", goodFor: ["민감", "트러블"], aliases: ["madecassoside"] },
  { name: "알란토인", inci: "Allantoin", category: "진정", effect: "자극 완화와 각질 정돈을 돕는 순한 성분", goodFor: ["민감"], aliases: ["allantoin"] },
  { name: "베타글루칸", inci: "Beta-Glucan", category: "진정", effect: "귀리·효모 유래, 진정과 수분·탄력 케어", goodFor: ["민감", "수분"], aliases: ["beta glucan", "베타-글루칸"] },
  { name: "알로에베라", inci: "Aloe Barbadensis Leaf Extract", category: "진정", effect: "수분 공급과 자극 진정에 쓰이는 식물 추출물", goodFor: ["민감", "수분"], aliases: ["알로에", "aloe"] },
  { name: "녹차추출물", inci: "Green Tea Extract", category: "진정", effect: "항산화와 진정을 돕는 식물 추출물", goodFor: ["민감", "지성"], aliases: ["green tea", "카멜리아시넨시스"] },

  // ── 각질·필링 ──
  { name: "살리실산(BHA)", inci: "Salicylic Acid", category: "각질·필링", effect: "모공 속 피지·각질을 녹이는 지용성 각질제거 성분", goodFor: ["지성", "트러블", "모공"], caution: "자극·건조를 유발할 수 있어 자외선 차단을 병행하세요.", aliases: ["BHA", "salicylic", "살리실릭"] },
  { name: "글라이콜릭애씨드(AHA)", inci: "Glycolic Acid", category: "각질·필링", effect: "표면 각질을 정돈하는 수용성 각질제거 성분", goodFor: ["각질", "톤"], caution: "햇빛 민감성이 올라가 자외선 차단이 필수예요.", aliases: ["AHA", "글리콜릭", "glycolic"] },
  { name: "락틱애씨드", inci: "Lactic Acid", category: "각질·필링", effect: "비교적 순한 AHA로 각질 정돈과 보습을 함께", goodFor: ["각질", "건성"], caution: "자외선 차단을 병행하세요.", aliases: ["lactic", "젖산"] },
  { name: "글루코노락톤(PHA)", inci: "Gluconolactone", category: "각질·필링", effect: "저자극 PHA로 순하게 각질을 정돈하고 보습", goodFor: ["민감", "각질"], aliases: ["PHA", "gluconolactone"] },

  // ── 미백·톤 ──
  { name: "나이아신아마이드", inci: "Niacinamide", category: "미백·톤", effect: "비타민 B3, 미백·피지·장벽을 두루 돕는 다기능 성분", goodFor: ["색소침착", "지성", "모공"], caution: "고농도는 예민한 피부에서 홍조를 일으킬 수 있어요.", aliases: ["나이아신", "niacinamide"] },
  { name: "비타민C", inci: "Ascorbic Acid", category: "미백·톤", effect: "항산화와 미백·톤 개선을 돕는 대표 성분", goodFor: ["색소침착", "톤"], caution: "산화가 빠르고 고농도는 자극이 있을 수 있어요.", aliases: ["vitamin c", "아스코빅애씨드", "비타C"] },
  { name: "알부틴", inci: "Arbutin", category: "미백·톤", effect: "멜라닌 생성을 억제해 톤을 케어하는 성분", goodFor: ["색소침착"], aliases: ["arbutin"] },
  { name: "트라넥삼산", inci: "Tranexamic Acid", category: "미백·톤", effect: "기미·잡티 등 색소 침착 케어에 쓰이는 성분", goodFor: ["색소침착", "기미"], aliases: ["tranexamic"] },

  // ── 주름·탄력 ──
  { name: "레티놀", inci: "Retinol", category: "주름·탄력", effect: "비타민 A, 주름·탄력·턴오버 개선의 대표 성분", goodFor: ["주름", "탄력"], caution: "자극·각질이 생길 수 있고 자외선 차단이 필수, 임신 중 사용은 전문가 상담. EU는 농도 규제 대상.", aliases: ["retinol", "레틴올"] },
  { name: "아데노신", inci: "Adenosine", category: "주름·탄력", effect: "주름 개선에 쓰이는 기능성 성분", goodFor: ["주름"], aliases: ["adenosine"] },
  { name: "펩타이드", inci: "Peptides", category: "주름·탄력", effect: "콜라겐 생성 신호를 도와 탄력을 케어", goodFor: ["주름", "탄력"], aliases: ["peptide", "펩타이드"] },
  { name: "PDRN", inci: "Polydeoxyribonucleotide", category: "주름·탄력", effect: "연어 등 유래, 재생·탄력 케어에 쓰이는 성분", goodFor: ["주름", "탄력"], caution: "동물(어류) 유래 성분으로 일부 국가 반입 시 확인이 필요할 수 있어요.", aliases: ["소듐디엔에이", "sodium dna", "폴리데옥시리보뉴클레오타이드"] },

  // ── 자외선차단 ──
  { name: "징크옥사이드", inci: "Zinc Oxide", category: "자외선차단", effect: "무기(물리) 자외선 차단제로 넓은 파장을 저자극으로 차단", goodFor: ["민감", "자외선"], aliases: ["zinc oxide"] },
  { name: "티타늄디옥사이드", inci: "Titanium Dioxide", category: "자외선차단", effect: "무기 자외선 차단제, 순한 편의 물리 차단 성분", goodFor: ["민감", "자외선"], aliases: ["titanium dioxide", "타이타늄"] },
  { name: "DHHB", inci: "Diethylamino Hydroxybenzoyl Hexyl Benzoate", category: "자외선차단", effect: "차세대 유기 UVA 차단 성분", goodFor: ["자외선"], caution: "미국 FDA 승인 목록에 없어 미국 반입·판매 시 확인이 필요해요.", aliases: ["디에틸아미노하이드록시벤조일헥실벤조에이트", "uvinul a plus"] },
  { name: "옥토크릴렌", inci: "Octocrylene", category: "자외선차단", effect: "유기 자외선 차단 성분", goodFor: ["자외선"], aliases: ["octocrylene"] },

  // ── 피지·트러블 ──
  { name: "티트리오일", inci: "Tea Tree Oil", category: "피지·트러블", effect: "피지·트러블 진정에 쓰이는 에센셜 오일", goodFor: ["지성", "트러블"], caution: "고농도는 자극이 있을 수 있고 향 알레르겐에 주의하세요.", aliases: ["tea tree", "티트리"] },
  { name: "아연(징크PCA)", inci: "Zinc PCA", category: "피지·트러블", effect: "피지 조절과 진정을 돕는 성분", goodFor: ["지성", "트러블"], aliases: ["아연", "zinc pca"] },

  // ── 보존·기타 ──
  { name: "1,2-헥산다이올", inci: "1,2-Hexanediol", category: "보존·기타", effect: "보습을 도우며 보존 역할도 겸하는 성분", goodFor: ["보존"], aliases: ["hexanediol", "헥산다이올"] },
  { name: "페녹시에탄올", inci: "Phenoxyethanol", category: "보존·기타", effect: "널리 쓰이는 화장품 보존제", goodFor: ["보존"], caution: "드물게 자극이 있을 수 있어요.", aliases: ["phenoxyethanol"] },
  { name: "카보머", inci: "Carbomer", category: "보존·기타", effect: "제형의 점도를 잡아주는 점증제", goodFor: ["제형"], aliases: ["carbomer"] },
  { name: "다이소듐이디티에이", inci: "Disodium EDTA", category: "보존·기타", effect: "금속이온을 봉쇄해 제형을 안정시키는 성분", goodFor: ["제형"], aliases: ["disodium edta", "edta"] },

  // ── 향료 ──
  { name: "향료", inci: "Fragrance (Parfum)", category: "향료", effect: "제품에 향을 더하는 성분, 민감성은 무향을 권장", goodFor: ["민감"], caution: "알레르기·자극을 유발할 수 있어요.", aliases: ["fragrance", "parfum", "향"] },
  { name: "리날룰", inci: "Linalool", category: "향료", effect: "은은한 향을 내는 향료 성분", goodFor: ["민감"], caution: "EU·영국에서 라벨 표시 대상인 향료 알레르겐이에요.", aliases: ["linalool"] },
  { name: "리모넨", inci: "Limonene", category: "향료", effect: "감귤 계열 향을 내는 향료 성분", goodFor: ["민감"], caution: "EU·영국에서 라벨 표시 대상인 향료 알레르겐이에요.", aliases: ["limonene"] },
];

// 성분 검색: 카테고리 필터 + 키워드(성분명/영문/이명/효능/고민) 매칭
export function searchIngredients(q: string, category: string): IngredientInfo[] {
  const query = q.trim().toLowerCase();
  return INGREDIENTS.filter((ing) => {
    if (category !== "전체" && ing.category !== category) return false;
    if (!query) return true;
    const hay = [ing.name, ing.inci, ing.category, ing.effect, ...(ing.aliases ?? []), ...ing.goodFor].join(" ").toLowerCase();
    return hay.includes(query);
  });
}
