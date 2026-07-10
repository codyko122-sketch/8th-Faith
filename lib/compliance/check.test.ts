// 화장품 반입 주의 플래그 — 단위 테스트
//
// 의존성 없는 자체 하네스. tsx 로 실행:
//   npx tsx lib/compliance/check.test.ts
// 실패가 있으면 프로세스 종료코드 1.

import { checkCosmeticCompliance, analyzeIngredients } from "./check";
import productsRaw from "../../data/products.json";
import type { ComplianceProduct } from "./types";

const PRODUCTS = productsRaw as ComplianceProduct[];

let passed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`✗ ${name}\n    ${e instanceof Error ? e.message : String(e)}`);
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function eq<T>(actual: T, expected: T, msg: string) {
  if (actual !== expected) throw new Error(`${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function byId(id: string): ComplianceProduct {
  const p = PRODUCTS.find((x) => x.product_id === id);
  if (!p) throw new Error(`product not found: ${id}`);
  return p;
}

function run(id: string, country: string) {
  const p = byId(id);
  return checkCosmeticCompliance(p.ingredients_inci, country, {
    ingredientsComplete: p.ingredients_complete,
    category: p.category,
    now: "2026-07-10T00:00:00.000Z",
  });
}

const STATUSES = ["high_risk", "caution", "verify_needed", "no_flag"];

/* ── 대조 사례: 결과가 항상 위험으로 쏠리지 않음을 증명 ── */

test("자작나무 선크림 × 미국 = caution (UV필터 4종 미승인)", () => {
  const r = run("sunscreen_birch", "US");
  eq(r.status, "caution", "status");
  const uv = r.flags.filter((f) => f.concern_type === "uv_filter");
  assert(uv.length >= 1, `UV필터 플래그가 있어야 함 (got ${uv.length})`);
  assert(uv.every((f) => f.level === "caution"), "UV필터는 caution");
});

test("자작나무 선크림 × 한국 = no_flag (한국은 승인 성분)", () => {
  const r = run("sunscreen_birch", "KR");
  eq(r.status, "no_flag", "status");
  eq(r.flags.length, 0, "flags 없음");
});

test("자작나무 선크림 × EU = no_flag (EU 승인 성분)", () => {
  const r = run("sunscreen_birch", "EU");
  eq(r.status, "no_flag", "status");
});

test("그린 마일드 업 선 × 미국 = no_flag (징크옥사이드 단독, FDA GRASE)", () => {
  const r = run("sunscreen_green_mild_up", "US");
  eq(r.status, "no_flag", "status");
  eq(r.flags.length, 0, "flags 없음");
  assert(r.partial_data_warning !== null, "전성분 미완비 → partial_data_warning 노출");
});

test("세라마이드 모찌 토너 × EU = caution (리날룰/리모넨 라벨링)", () => {
  const r = run("toner_ceramide_mochi", "EU");
  eq(r.status, "caution", "status");
  const al = r.flags.filter((f) => f.concern_type === "allergen");
  assert(al.length === 2, `알레르겐 2종(리날룰/리모넨) (got ${al.length})`);
  assert(al.every((f) => /라벨링|표시/.test(f.message_ko)), "메시지는 라벨링 성격 명시");
  assert(al.every((f) => !/반입 금지/.test(f.message_ko) || /아니라/.test(f.message_ko)), "금지가 아님을 구분");
});

test("세라마이드 모찌 토너 × 미국 = no_flag (알레르겐 라벨링은 EU/GB만)", () => {
  const r = run("toner_ceramide_mochi", "US");
  eq(r.status, "no_flag", "status");
});

test("넘버즈인 1번 세럼 × EU = caution (레티놀 Annex III)", () => {
  const r = run("serum_numbuzin_1_signature", "EU");
  eq(r.status, "caution", "status");
  const ra = r.flags.find((f) => f.concern_type === "restricted_active");
  assert(!!ra, "restricted_active 플래그 존재");
  assert(/함량|Annex/.test(ra!.message_ko), "함량 기준 규제 성격 명시");
});

test("넘버즈인 1번 세럼 × 미국 = verify_needed (함량 미상)", () => {
  const r = run("serum_numbuzin_1_signature", "US");
  eq(r.status, "verify_needed", "status");
});

test("아누아 PDRN 세럼 × 호주 = verify_needed (동물 유래 바이오시큐리티)", () => {
  const r = run("serum_anua_pdrn", "AU");
  eq(r.status, "verify_needed", "status");
  const ad = r.flags.find((f) => f.concern_type === "animal_derived");
  assert(!!ad, "animal_derived 플래그 존재");
  assert(r.partial_data_warning !== null, "전성분 미완비 → partial_data_warning");
});

test("아누아 PDRN 세럼 × 미국 = verify_needed (동물 유래 전 국가 verify)", () => {
  const r = run("serum_anua_pdrn", "US");
  eq(r.status, "verify_needed", "status");
});

/* ── 불변식: 15개 × 여러 국가 전수 검증 ── */

test("모든 제품 × 모든 국가: status 는 허용된 4값, 항상 coverage_warning·disclaimer 포함", () => {
  const countries = ["KR", "US", "EU", "GB", "JP", "TH", "VN", "ID", "FR", "AU", "MV"];
  for (const p of PRODUCTS) {
    for (const c of countries) {
      const r = checkCosmeticCompliance(p.ingredients_inci, c, {
        ingredientsComplete: p.ingredients_complete,
        category: p.category,
        now: "2026-07-10T00:00:00.000Z",
      });
      assert(STATUSES.includes(r.status), `${p.product_id}×${c}: 잘못된 status ${r.status}`);
      assert(r.coverage_warning.length > 0, `${p.product_id}×${c}: coverage_warning 비어있음`);
      assert(r.disclaimer.length > 0, `${p.product_id}×${c}: disclaimer 비어있음`);
      // "안전/반입 가능" 단정 문구가 결과 어디에도 없어야 함
      const blob = JSON.stringify(r);
      assert(!/안전함|반입 가능합니다|반입이 가능/.test(blob), `${p.product_id}×${c}: 단정 문구 발견`);
      // 우리 15개 제품엔 mercury/hydroquinone/cbd 성분이 없어 high_risk 가 나오지 않아야 함
      eq(r.status === "high_risk", false, `${p.product_id}×${c}: 예기치 않은 high_risk`);
    }
  }
});

test("전성분 미완비 제품은 partial_data_warning, 완비 제품은 null", () => {
  for (const p of PRODUCTS) {
    const r = checkCosmeticCompliance(p.ingredients_inci, "KR", {
      ingredientsComplete: p.ingredients_complete,
      category: p.category,
    });
    if (p.ingredients_complete) eq(r.partial_data_warning, null, `${p.product_id}: 완비인데 경고 존재`);
    else assert(r.partial_data_warning !== null, `${p.product_id}: 미완비인데 경고 없음`);
  }
});

test("매칭 없는 제품도 coverage_warning 은 항상 노출(에스트라 아토베리어365 × 미국)", () => {
  const r = run("cream_atobarrier365", "US");
  eq(r.status, "no_flag", "status");
  eq(r.flags.length, 0, "flags 없음");
  assert(r.coverage_warning.length > 0, "coverage_warning 노출");
});

test("알 수 없는 국가는 폴백으로 verify_needed 성격 유지(매칭 성분 있을 때)", () => {
  const r = run("serum_anua_pdrn", "ZZ");
  eq(r.status, "verify_needed", "status");
});

/* ── analyzeIngredients: 스캔 결과 알레르기·규제 성분 교차검증(여행지 무관) ── */

test("analyzeIngredients: 리날룰/리모넨 → allergen 2건", () => {
  const r = analyzeIngredients(["정제수", "리날룰", "리모넨", "글리세린"]);
  eq(r.length, 2, "매칭 2건");
  assert(r.every((c) => c.concern_type === "allergen"), "모두 allergen");
});

test("analyzeIngredients: 소듐디엔에이(PDRN) → animal_derived", () => {
  const r = analyzeIngredients(["소듐디엔에이", "부틸렌글라이콜"]);
  eq(r.length, 1, "1건");
  eq(r[0].concern_type, "animal_derived", "animal_derived");
});

test("analyzeIngredients: 차세대 UV필터 → uv_filter", () => {
  const r = analyzeIngredients(["디에틸아미노하이드록시벤조일헥실벤조에이트"]);
  assert(r.some((c) => c.concern_type === "uv_filter"), "uv_filter 매칭");
});

test("analyzeIngredients: 순한 성분만 → 빈 배열(안전 단정 아님)", () => {
  const r = analyzeIngredients(["정제수", "글리세린", "판테놀", "부틸렌글라이콜"]);
  eq(r.length, 0, "매칭 없음");
});

test("analyzeIngredients: 중복 성분은 1건으로 dedup", () => {
  const r = analyzeIngredients(["리날룰", "리날룰"]);
  eq(r.length, 1, "dedup");
});

/* ── 요약 출력 ── */

console.log(`\ncompliance tests: ${passed} passed, ${failures.length} failed\n`);
if (failures.length) {
  console.error(failures.join("\n\n"));
  process.exit(1);
}
