# 화장품 반입 주의 플래그 모듈 (Compliance)

성분(INCI) 기반으로 여행지(도착국)의 규제 성분과 매칭해, 추천 제품 카드에 "반입 주의" 배지를 노출하는 모듈입니다.

> ⚠️ **이 모듈은 법적 판정이 아닙니다.** "반입 가능/불가"를 단정하지 않고, 오직 **주의 환기 + 확인 유도**만 합니다.
> 최종 반입 가능 여부는 반드시 도착국 세관·관련 기관을 통해 확인해야 합니다.
> 데이터는 **2026년 7월 기준**으로 정리된 것이며 정기적으로 검증·교체가 필요합니다.

## 설계 원칙 (반드시 준수)

1. **판정 금지** — 상태값은 `high_risk | caution | verify_needed | no_flag` 4가지뿐입니다. `safe`·`allowed` 같은 단정적 값은 만들지 않습니다.
2. **불확실성 보존** — 원본이 "확인 필요/미확정"이면 자동 판정하지 않고 `verify_needed`로 분류해 사용자에게 직접 확인을 유도합니다.
3. **출처·시점 필수** — 모든 규칙 데이터에 `source`, `as_of_date`, `disclaimer`를 두고 결과 객체에 항상 포함해 UI로 노출합니다.
4. **범위 한계 명시** — 성분 DB에 없는 성분은 "안전"이 아니라 "미확인"입니다. 매칭이 없어도 `coverage_warning`을 **항상** 노출합니다.
5. **갱신 가능** — 규제 데이터는 코드에 하드코딩하지 않고 `data/*.json`으로 분리해 주기적 교체가 가능합니다.

## 파일 구성

```
data/
  products.json              15개 제품 마스터(전성분 INCI, ingredients_complete 플래그)
  restricted-ingredients.json 대표 규제 성분 목록(INCI/aliases/concern_type/출처)
  country-rules.json          국가별 concern_flags + 개인반입/제형 참고 + regulatory_region
  aviation-rules.json         기내/위탁 용량·인화성 공통 규정(일반 기준)
lib/compliance/
  types.ts                    모든 타입 정의
  check.ts                    checkCosmeticCompliance() 매칭·판정 로직
  check.test.ts               단위 테스트(15개 × 다국가)
components/
  compliance-badge.tsx        <ComplianceBadge /> UI (제품 카드/상세에 부착)
```

## 핵심 로직

```ts
checkCosmeticCompliance(
  productIngredients: string[],
  destinationCountry: string,           // ISO 코드 (US, EU, KR, JP, AU, TH ...)
  opts?: { ingredientsComplete?: boolean; category?: string; now?: string }
): ComplianceResult
```

동작:
1. `productIngredients`를 `restricted-ingredients.json`의 `inci_name`/`aliases`와 대소문자·공백 무시하고 부분 일치 매칭(최소 3자).
2. 매칭 성분의 `concern_type`을 도착국 규칙과 결합해 위험 수준 산출:
   - `mercury` / `hydroquinone` / `cbd_cannabis` / `animal_derived` → 국가 `concern_flags` 값 사용.
   - `uv_filter` / `allergen` / `restricted_active` → 성분의 `flag_regions`(규제 지역)와 국가 `regulatory_region`을 비교해 `flag_level`(해당 지역) 또는 `else_level`(그 외) 적용.
3. 매칭 성분이 없으면 `status="no_flag"`, 단 `coverage_warning`을 반드시 포함.
4. 미확정 값이 관여하면 해당 항목은 `verify_needed`로 유지.
5. 제형(액상/크림)이면 항공(용량·인화성) 안내를 `aviation_note`로 함께 제공.
6. `ingredients_complete=false` 제품은 `partial_data_warning`을 추가.

`ComplianceResult`:

```ts
{
  status: "high_risk" | "caution" | "verify_needed" | "no_flag",
  flags: { ingredient, concern_type, level, message_ko, source, as_of_date }[],
  coverage_warning: string,          // 항상 포함
  partial_data_warning: string | null,
  aviation_note: string | null,
  disclaimer: string,                // 항상 포함
  checked_at: string
}
```

## UI

- 추천 제품 카드·상세에 `<ComplianceBadge cosmeticId={..} destinationCountry={countryCode} />` 부착.
- `high_risk`=빨강, `caution`=노랑, `verify_needed`=회색, `no_flag`=표시 최소화.
- `ingredients_complete=false`이면 "성분정보 불완전" 배지를 추가로 노출.
- 배지 클릭 시 `flags` 상세 + `source` + `as_of_date` + `coverage_warning` + `disclaimer`를 펼쳐 보여줍니다.
- 문구는 항상 "제한될 수 있음 / 확인 필요" 형태이며 "반입 가능 / 안전" 단정 문구는 쓰지 않습니다.

## 테스트

```bash
npx tsx lib/compliance/check.test.ts
```

의존성 없는 자체 하네스(실패 시 종료코드 1)로 대조 사례와 불변식(모든 제품 × 다국가에서 상태값이 4종 이내, `coverage_warning`/`disclaimer` 항상 포함, 단정 문구 부재)을 검증합니다.

## 데이터 갱신 방법

1. 성분 규칙 변경 → `data/restricted-ingredients.json` 항목 수정(반드시 `source`, `as_of_date` 갱신).
2. 국가 규정 변경 → `data/country-rules.json`의 `concern_flags` / `regulatory_region` 수정.
3. 제품 성분 변경(리뉴얼) → `data/products.json`의 `ingredients_inci`, `as_of_date` 갱신.
4. 코드 수정 불필요 — 로직은 JSON을 읽어 동작합니다.

> **⚠️ 데이터 재확인 필요:** `data/products.json`의 전성분은 실제 유통 제품 성분표를 기반으로 재구성한 **근사 데이터**입니다.
> 특히 `ingredients_complete: false`인 4개 제품(그린 마일드 업 선, 청귤 비타C 세럼, PDRN 세럼, 다이브인 세럼)은
> **실제 서비스 반영 전 반드시 브랜드 공식 채널에서 전성분을 재확인**해야 합니다.

## 예상 결과 (15개 제품 × 주요 국가)

아래는 `checkCosmeticCompliance()`를 실제 실행한 결과입니다(2026-07-10 기준).
결과가 항상 `high_risk`/`caution`으로 쏠리지 않고, 성분·국가 조합에 따라 다르게 나오는 것을 보여줍니다.
(⚠️ = 전성분 정보 불완전 제품)

| 제품 | 미국(US) | EU | 한국(KR) | 일본(JP) | 호주(AU) |
|---|---|---|---|---|---|
| 자작나무 수분 선크림 SPF50+ | caution (uv_filter) | no_flag | no_flag | no_flag | no_flag |
| 니오좀 판테놀 5% 세럼 | no_flag | no_flag | no_flag | no_flag | no_flag |
| 리얼 히알루로닉 수딩크림 | no_flag | no_flag | no_flag | no_flag | no_flag |
| 세라마이드 모찌 토너 | no_flag | caution (allergen) | no_flag | no_flag | no_flag |
| 아토베리어365 크림 | no_flag | no_flag | no_flag | no_flag | no_flag |
| 레드 블레미쉬 클리어 수딩 크림 | no_flag | no_flag | no_flag | no_flag | no_flag |
| 녹두 약산성 클렌징폼 | no_flag | no_flag | no_flag | no_flag | no_flag |
| 1025 독도 토너 | no_flag | no_flag | no_flag | no_flag | no_flag |
| 그린 마일드 업 선 플러스 SPF50+ ⚠️ | no_flag | no_flag | no_flag | no_flag | no_flag |
| 1번 시그니처 세럼 | verify_needed (restricted_active) | caution (restricted_active) | verify_needed (restricted_active) | verify_needed (restricted_active) | verify_needed (restricted_active) |
| 청귤 비타C 잡티케어 세럼 ⚠️ | no_flag | no_flag | no_flag | no_flag | no_flag |
| 리얼 히알루로닉 블루 100 앰플 | no_flag | no_flag | no_flag | no_flag | no_flag |
| PDRN 히알루론산 캡슐 100 세럼 ⚠️ | verify_needed (animal_derived) | verify_needed (animal_derived) | verify_needed (animal_derived) | verify_needed (animal_derived) | verify_needed (animal_derived) |
| 아쿠아 오아시스 토너 | no_flag | no_flag | no_flag | no_flag | no_flag |
| 다이브인 저분자 히알루론산 세럼 ⚠️ | no_flag | no_flag | no_flag | no_flag | no_flag |

### 대표 대조 사례

- **자작나무 선크림 × 미국 = `caution`** — 차세대 유기 자외선차단 성분 4종(DHHB 등)이 미국 FDA 승인 목록에 없어 caution. EU·한국에서는 승인 성분이라 `no_flag`.
- **그린 마일드 업 선 × 미국 = `no_flag`** — 자외선차단 성분이 징크옥사이드(Zinc Oxide) 단독(FDA GRASE)이라, 같은 선크림이라도 caution 대상이 아님. → 결과가 자외선차단제라고 무조건 걸리지 않음을 보여주는 대조 사례.
- **세라마이드 모찌 토너 × EU = `caution`** — 리날룰/리모넨이 EU 향료 알레르겐 **라벨링** 대상(반입 금지가 아님).
- **넘버즈인 1번 세럼 × EU = `caution` / 그 외 = `verify_needed`** — 레티놀이 EU Annex III 함량 규제 대상(금지가 아니라 함량 기준). 함량 미상 지역은 verify_needed.
- **PDRN 세럼 × 호주 = `verify_needed`** — 동물(어류) 유래 원료로, 국가별 검역·바이오시큐리티 규정이 케이스별로 다르므로 verify_needed.
