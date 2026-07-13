# Beauty Passport

여행지 맞춤 스킨케어 프로토타입 — 시나리오 2 Global Beauty (신뢰 8조)

내 피부 데이터와 여행지 기후를 결합해 피부 이슈 지수, 날씨 캘린더, 소용량 맞춤 루틴,
성분 검색을 제공하는 웹 앱입니다.

## 기술 스택

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Framer Motion** (애니메이션) · **lucide-react** (아이콘)

## 로컬 실행

```bash
npm install
npm run dev        # http://localhost:3000
```

프로덕션 빌드 확인:

```bash
npm run build
npm run start
```

## 배포 (Vercel)

1. [vercel.com](https://vercel.com) 로그인 후 **Add New → Project**
2. GitHub 저장소 `8th-Faith` 선택 → Import
3. 프레임워크는 **Next.js** 로 자동 인식됩니다. 별도 설정 없이 **Deploy**
4. 이후 `main` 브랜치에 push하면 자동 재배포됩니다.

## 구조

```
app/
  layout.tsx          공통 레이아웃 · 폰트 · 내비게이션
  page.tsx            홈(랜딩)
  ingredients/page.tsx 성분 검색
components/
  site-nav.tsx        상단 내비게이션
  kit-form.tsx        소용량 키트 신청 폼
lib/
  data.ts             기후 프로파일 · 제품 카탈로그
  logic.ts            피부 이슈 지수 · 캘린더 · 제품 추천 로직
  compliance/         성분 기반 반입 주의 플래그(types · check · test)
data/                 규제 데이터(products · restricted-ingredients · country-rules · aviation-rules)
```

## 반입 주의 플래그 (Compliance)

추천 제품의 전성분을 여행지 규제 성분과 매칭해 "반입 주의" 배지를 노출합니다.
"반입 가능/불가"를 단정하지 않고 주의 환기 + 확인 유도만 합니다(법적 판정 아님).
설계 원칙·데이터 갱신 방법·국가별 예상 결과표는 [COMPLIANCE.md](COMPLIANCE.md) 참고.

테스트: `npx tsx lib/compliance/check.test.ts`
