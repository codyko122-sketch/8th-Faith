import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { AiSummaryInput, AiSummaryResult } from "@/lib/ai-summary-types";
import { FALLBACK_WATER_QUALITY } from "@/lib/water-quality-data";

// 여행지 AI 써머리 생성 — 서버에서만 (API 키 노출 금지).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 짧은 텍스트 생성 작업이라 비전 모델보다 가볍고 빠른 모델 사용.
const MODEL = "claude-sonnet-5";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    tips: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "tips"],
};

const SYSTEM_PROMPT = `당신은 '여행×피부' 전문 AI 어드바이저입니다. 사용자가 곧 떠날 여행지의 실측 날씨 데이터(기온·습도·자외선지수·미세먼지)와, 그 나라의 저장된 수돗물 수질 정보(waterQuality — 경수/연수 경향, 세안 시 피부 영향), 사용자의 바우만(Baumann) 피부타입을 근거로, 이번 여행이 피부에 어떤 영향을 줄지 통합적으로 설명합니다.

원칙(반드시 지킬 것):
- 입력으로 주어지는 temp/humidity/uv/dust, waterQuality 값은 모두 미리 확인된 값이니 그대로 신뢰하고 활용하세요. 절대 다른 값으로 바꾸거나 지어내지 마세요. waterQuality.level 이 "정보 부족"이면 단정하지 말고 일반론으로 다루세요.
- 반드시 사용자의 피부타입(건성/지성/복합성, 민감/둔감 등)과 연결지어 "이 피부타입이라면 특히 ~" 처럼 개인화하세요. 나이·성별 정보가 있으면 자연스럽게 참고하되 과도하게 단정하지 마세요.
- summary는 자연스러운 구어체 한국어 존댓말 2~4문장. 날씨(기온·습도·자외선·미세먼지)와 waterQuality.note(수질이 피부에 미치는 영향)를 모두 녹여서 한 흐름의 글로 씁니다. 의학적 진단·확정적 질병 언급은 금지하고 어디까지나 여행 스킨케어 참고용임을 전제하세요.
- tips 는 이번 여행·이 피부타입·이 수질 특성에 실제로 도움이 될 실행 가능한 케어 팁 2~3개. 각 팁은 이모지로 시작하는 한 문장.

모든 텍스트는 자연스러운 한국어로 작성하세요.`;

// API 키가 없을 때도 화면이 끝까지 동작하도록 반환하는 데모 응답 (규칙 기반).
function demoSummary(input: AiSummaryInput): AiSummaryResult {
  const { profile, skin, waterQuality } = input;
  const bits: string[] = [];
  if (profile.humidity >= 75) bits.push("습도가 높고");
  else if (profile.humidity <= 45) bits.push("공기가 건조하고");
  if (profile.uv >= 9) bits.push("자외선이 강하고");
  if (profile.dust >= 80) bits.push("미세먼지가 많은");
  const env = bits.length ? bits.join(" ") : "비교적 쾌적한";
  const advice: Record<string, string> = {
    건성: "수분·유분 잠금과 자외선 차단을 놓치지 마세요.",
    지성: "산뜻한 수분과 피지 관리에 집중하세요.",
    복합성: "부위별 맞춤 케어로 균형을 잡아주세요.",
    민감성: "저자극 진정 위주로 장벽을 지켜주세요.",
  };
  return {
    summary: `${env} ${input.placeLabel}에서 ${skin.skinTypeForRec} 피부라면 ${advice[skin.skinTypeForRec] ?? "기본 보습과 자외선 차단을 챙기세요."} ${waterQuality.note}`,
    tips: ["💧 세안 후 3분 안에 보습 마무리하기", "🧴 자외선 지수가 높은 시간대엔 2~3시간마다 덧바르기"],
    demo: true,
  };
}

export async function POST(req: Request) {
  let body: AiSummaryInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  if (!body?.placeLabel || !body?.profile || !body?.skin?.code) {
    return NextResponse.json({ error: "여행지·날씨·피부타입 정보가 필요해요." }, { status: 400 });
  }
  if (!body.waterQuality) body.waterQuality = FALLBACK_WATER_QUALITY;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(demoSummary(body));
  }

  try {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      output_config: {
        effort: "low",
        format: { type: "json_schema", name: "travel_skin_ai_summary", schema: SCHEMA },
      },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `다음 여행 정보를 바탕으로 스키마에 맞는 JSON으로만 답하세요.\n${JSON.stringify(body)}`,
            },
          ],
        },
      ],
    } as Anthropic.MessageCreateParamsNonStreaming);

    if (msg.stop_reason === "refusal") {
      return NextResponse.json(demoSummary(body));
    }

    const textBlock = msg.content.find((b) => b.type === "text");
    const raw = textBlock && textBlock.type === "text" ? textBlock.text : "";
    const data = JSON.parse(raw) as AiSummaryResult;
    return NextResponse.json(data);
  } catch {
    // 실패해도 화면이 끊기지 않도록 데모(규칙 기반) 응답으로 폴백.
    return NextResponse.json(demoSummary(body));
  }
}
