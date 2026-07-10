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
  required: ["identified", "confidence", "brand", "name", "category", "ingredients", "safety", "summary", "caution", "candidates", "note"],
};

const SYSTEM_PROMPT = `당신은 한국 화장품 성분 분석 전문가입니다. 사용자가 찍은 화장품 사진을 보고 분석합니다.

원칙(반드시 지킬 것):
- 사진 속에서 실제로 읽히거나 특정 가능한 정보만 사용하세요. 라벨의 브랜드·제품명·전성분 텍스트를 우선 판독합니다.
- 사진만으로 제품을 확신할 수 없으면 절대 지어내지 마세요. 이때는 identified=false 로 두고, 가능한 후보 제품을 candidates 에 최대 3개 제시하거나, 후보도 어렵다면 빈 배열과 함께 note 에 "라벨이 더 잘 보이게 다시 촬영하거나 수동 검색을 이용하세요" 같은 안내를 담으세요.
- 제품이 특정되면(identified=true) 그 제품의 전성분을 조회해 ingredients 에 담습니다. 사진에 전성분이 보이면 그것을 우선하고, 안 보이면 알려진 정품 성분 정보를 사용합니다. 불확실한 성분은 넣지 마세요.
- 화장품이 아니거나 아무것도 식별 불가하면 identified=false, confidence 낮게, note 에 이유를 적으세요.

각 필드:
- confidence: 0~100 (제품 특정 신뢰도)
- category: "세럼"·"토너"·"크림"·"선크림"·"클렌징"·"앰플"·"에센스" 등 한글 한 단어
- ingredients[]: 주요 성분 위주(최대 8개). 각 항목 { name(한글 성분명), role(기능을 한 줄, 한국어), type, label, caution }
  - type: "key"(핵심 유효성분) | "calm"(진정/보습성) | "base"(베이스/보존/용제) | "warn"(주의·자극 가능)
  - label: 태그로 보일 짧은 한글 (예: "핵심","진정","보습","베이스","주의")
  - caution: 그 성분의 주의점(없으면 빈 문자열 "")
- safety[]: "무향","저자극","EWG 그린","약산성","무기자차" 등 해당되는 안전 특성 (없으면 빈 배열)
- summary: 이 제품을 한 줄로 설명 (한국어)
- caution: 이 제품 전반의 주의사항 (없으면 빈 문자열)
- note: 인식 근거나 사용자 안내 한 줄

모든 사용자 대상 텍스트는 자연스러운 한국어로 작성하세요.`;

// API 키가 없을 때 UI가 끝까지 동작하도록 반환하는 데모 결과.
function demoResult(): ScanResult {
  return {
    identified: true,
    confidence: 92,
    brand: "토리든",
    name: "다이브인 저분자 히알루론산 세럼",
    category: "세럼",
    ingredients: [
      { name: "5종 히알루론산", role: "층별 수분 공급·보습", type: "key", label: "핵심", caution: "" },
      { name: "판테놀", role: "진정·장벽 강화", type: "calm", label: "진정", caution: "" },
      { name: "알란토인", role: "자극 완화·진정", type: "calm", label: "진정", caution: "" },
      { name: "베타인", role: "수분 보유·컨디셔닝", type: "base", label: "보습", caution: "" },
      { name: "1,2-헥산다이올", role: "보존·보습 보조", type: "base", label: "베이스", caution: "" },
    ],
    safety: ["무향", "무색소", "EWG 그린", "저자극 테스트"],
    summary: "저분자 히알루론산으로 속보습을 빠르게 채워주는 데일리 진정 세럼이에요.",
    caution: "",
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
  let body: { image?: string };
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
            { type: "text", text: "이 화장품을 분석해 스키마에 맞는 JSON으로만 답하세요." },
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
