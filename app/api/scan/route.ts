import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { ScanResult } from "@/lib/scan-types";

// 비전 AI 호출은 서버에서만 (API 키 노출 금지). Node 런타임 필요.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 모델: 라벨(한글) 판독에 강한 고해상 비전 모델. 비용을 낮추려면
// "claude-sonnet-5" 또는 "claude-haiku-4-5" 로 교체 가능.
const MODEL = "claude-opus-4-8";

// 구조화 출력 스키마 — 응답이 이 형태의 JSON으로 보장된다.
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    identified: { type: "boolean" },
    confidence: { type: "integer" },
    brand: { type: "string" },
    name: { type: "string" },
    category: { type: "string" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          role: { type: "string" },
          type: { type: "string", enum: ["key", "calm", "base", "warn"] },
          label: { type: "string" },
          caution: { type: "string" },
        },
        required: ["name", "role", "type", "label", "caution"],
      },
    },
    allergens: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          note: { type: "string" },
        },
        required: ["name", "note"],
      },
    },
    safety: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
    caution: { type: "string" },
    candidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { brand: { type: "string" }, name: { type: "string" } },
        required: ["brand", "name"],
      },
    },
    note: { type: "string" },
  },
  required: ["identified", "confidence", "brand", "name", "category", "ingredients", "allergens", "safety", "summary", "caution", "candidates", "note"],
};

const SYSTEM_PROMPT = `당신은 한국 화장품 성분 분석 전문가입니다. 사용자가 찍은 화장품 사진을 보고 분석합니다.

원칙(반드시 지킬 것):
- 사진 속에서 실제로 읽히거나 특정 가능한 정보만 사용하세요. 라벨의 브랜드·제품명·전성분 텍스트를 우선 판독합니다.
- 사진만으로 제품을 확신할 수 없으면 절대 지어내지 마세요. 이때는 identified=false 로 두고, 가능한 후보 제품을 candidates 에 최대 3개 제시하거나, 후보도 어렵다면 빈 배열과 함께 note 에 "라벨이 더 잘 보이게 다시 촬영하거나 수동 검색을 이용하세요" 같은 안내를 담으세요.
- 제품이 특정되면(identified=true) 그 제품의 전성분을 조회해 ingredients 에 담습니다. 사진에 전성분이 보이면 그것을 우선하고, 안 보이면 알려진 정품 성분 정보를 사용합니다. 불확실한 성분은 넣지 마세요.
- 화장품이 아니거나 아무것도 식별 불가하면 identified=false, confidence 낮게, note 에 이유를 적으세요.
- 사용자 메시지에 "등록된 알러지·기피 성분" 목록이 함께 오면, 라벨/전성분에서 그 성분(또는 동일 계열 성분)이 발견되는지 반드시 확인하세요. 발견되면 allergens 배열에 그 성분을 포함시키고 note를 "⚠️ 회원님이 등록한 알러지 성분이에요"로 시작해서 강조하세요. 목록에 없는 성분을 임의로 알러지로 단정하지는 마세요.

각 필드:
- confidence: 0~100 (제품 특정 신뢰도)
- category: "세럼"·"토너"·"크림"·"선크림"·"클렌징"·"앰플"·"에센스" 등 한글 한 단어
- ingredients[]: 주요 성분 위주(최대 8개). 각 항목 { name(한글 성분명), role(기능을 한 줄, 한국어), type, label, caution }
  - type: "key"(핵심 유효성분) | "calm"(진정/보습성) | "base"(베이스/보존/용제) | "warn"(주의·자극 가능)
  - label: 태그로 보일 짧은 한글 (예: "핵심","진정","보습","베이스","주의")
  - caution: 그 성분의 주의점(없으면 빈 문자열 "")
- allergens[]: 라벨에서 확인되는 알레르기 유발 가능 성분만 담습니다. 대표적으로 EU 지정 향료 알레르겐 26종(리날룰, 리모넨, 시트로넬롤, 제라니올, 유제놀, 시트랄, 쿠마린, 벤질알코올, 벤질벤조에이트, 시트로넬롤, 파네솔 등)과 널리 알려진 자극 유발 성분. 각 항목 { name(한글 성분명), note(왜 주의가 필요한지 한 줄) }. 라벨에서 확인되지 않으면 빈 배열로 두고 절대 지어내지 마세요.
- summary: 이 제품을 한 줄로 설명 (한국어)
- caution: 이 제품 전반의 주의사항 (없으면 빈 문자열)
- note: 인식 근거나 사용자 안내 한 줄

모든 사용자 대상 텍스트는 자연스러운 한국어로 작성하세요.`;

// API 키가 없을 때 UI가 끝까지 동작하도록 반환하는 데모 결과.
// (싸이닉 히아루론산 앰플 스킨 — data/products.json의 정식 전성분표 기준)
function demoResult(): ScanResult {
  return {
    identified: true,
    confidence: 90,
    brand: "싸이닉",
    name: "히아루론산 앰플 스킨",
    category: "토너",
    ingredients: [
      { name: "소듐하이알루로네이트", role: "수분 공급·보습막 형성", type: "key", label: "핵심", caution: "" },
      { name: "하이드롤라이즈드하이알루로네이트", role: "저분자 흡수로 속보습 공급", type: "key", label: "핵심", caution: "" },
      { name: "소듐하이알루로네이트크로스폴리머", role: "수분 지속력 강화", type: "key", label: "핵심", caution: "" },
      { name: "판테놀", role: "진정·피부장벽 강화", type: "calm", label: "진정", caution: "" },
      { name: "마데카소사이드", role: "피부 진정·재생 보조", type: "calm", label: "진정", caution: "" },
      { name: "병풀추출물", role: "민감해진 피부 진정", type: "calm", label: "진정", caution: "" },
      { name: "카보머", role: "점증제(제형 안정화)", type: "base", label: "베이스", caution: "" },
      { name: "향료", role: "제품 향 부여", type: "warn", label: "주의", caution: "향에 민감한 피부는 자극이 있을 수 있어요." },
    ],
    allergens: [],
    safety: ["약산성", "저자극 포뮬러"],
    summary: "5종의 히알루론산과 판테놀·마데카소사이드가 속보습과 피부 진정을 동시에 채워주는 데일리 수분 토너예요.",
    caution: "향료가 함유되어 있어 향에 민감한 피부는 사용 전 패치테스트를 권장해요.",
    candidates: [],
    note: "데모 응답입니다. 실제 분석을 켜려면 서버에 ANTHROPIC_API_KEY 를 설정하세요.",
    demo: true,
  };
}

// data URL → { media_type, data(base64) }
function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl.trim());
  if (!m) return null;
  return { mediaType: m[1], data: m[2] };
}

export async function POST(req: Request) {
  let body: { image?: string; allergyIngredients?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const image = body.image;
  if (!image || typeof image !== "string") {
    return NextResponse.json({ error: "이미지가 없어요." }, { status: 400 });
  }

  // 키가 없으면 데모 결과로 폴백 (배포/개발에서 앱이 끝까지 동작)
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(demoResult());
  }

  const parsed = parseDataUrl(image);
  if (!parsed) {
    return NextResponse.json({ error: "이미지 형식을 읽을 수 없어요." }, { status: 400 });
  }

  const allergyText = body.allergyIngredients?.length
    ? `등록된 알러지·기피 성분: ${body.allergyIngredients.join(", ")}`
    : "등록된 알러지·기피 성분 없음";

  try {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: { type: "json_schema", name: "cosmetic_scan", schema: SCHEMA },
      },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: parsed.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: parsed.data },
            },
            { type: "text", text: `이 화장품을 분석해 스키마에 맞는 JSON으로만 답하세요. ${allergyText}` },
          ],
        },
      ],
    } as Anthropic.MessageCreateParamsNonStreaming);

    if (msg.stop_reason === "refusal") {
      return NextResponse.json({ error: "이 이미지는 분석할 수 없어요. 다른 사진으로 시도해 주세요." }, { status: 422 });
    }

    const textBlock = msg.content.find((b) => b.type === "text");
    const raw = textBlock && textBlock.type === "text" ? textBlock.text : "";
    const data = JSON.parse(raw) as ScanResult;
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "분석 중 문제가 생겼어요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
