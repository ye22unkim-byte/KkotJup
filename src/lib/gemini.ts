import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AnalyzeResult } from "./types";
import { mockAnalyze } from "./mock-analyze";

const SYSTEM_PROMPT = `당신은 화훼 도매시장 '떨이 꽃' 상품 카드 생성 AI입니다.
상인이 찍은 꽃 양동이 사진과 짧은 음성(또는 음성 전사문)을 보고,
소비자가 바로 살 수 있는 상품 카드 JSON만 반환하세요.

규칙:
- 반드시 JSON만 출력 (마크다운/설명 금지)
- 가격은 음성에서 우선 추출. 없으면 사진 규모로 합리적으로 추정
- retailEstimate는 일반 소매 꽃집 기준 추정가
- discountRate = round((1 - price/retailEstimate)*100)
- bloomState는 "봉오리" | "만개" | "빠른 감상" 중 하나
- freshnessTag는 직관적인 한국어 한 줄
- careTips는 물올림/화병 꽂이 팁 정확히 3줄
- quantity는 남은 박스/단 수량 추정 (1~5)
- summary는 상인 승인 화면용 큰 글씨 요약 (예: "핑크 장미 외 1종 / 10,000원")

JSON 스키마:
{
  "title": string,
  "flowers": [{"name": string, "approxStems": number}],
  "price": number,
  "retailEstimate": number,
  "discountRate": number,
  "colorKeywords": string[],
  "bloomState": "봉오리"|"만개"|"빠른 감상",
  "freshnessTag": string,
  "careTips": [string, string, string],
  "quantity": number,
  "summary": string
}`;

function parseJsonLoose(text: string): AnalyzeResult {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const json = start >= 0 && end >= 0 ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(json) as AnalyzeResult;
}

export async function analyzeMultimodal(input: {
  imageBase64: string;
  imageMimeType: string;
  audioBase64?: string;
  audioMimeType?: string;
  transcript?: string;
}): Promise<{ result: AnalyzeResult; source: "gemini" | "mock" }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { result: mockAnalyze(input.transcript), source: "mock" };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    });

    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
      { text: SYSTEM_PROMPT },
      {
        text: `음성 전사(있으면 참고): ${input.transcript || "(없음)"}\n사진과 음성을 종합해 상품 카드를 만드세요.`,
      },
      {
        inlineData: {
          data: input.imageBase64,
          mimeType: input.imageMimeType || "image/jpeg",
        },
      },
    ];

    if (input.audioBase64 && input.audioMimeType) {
      parts.push({
        inlineData: {
          data: input.audioBase64,
          mimeType: input.audioMimeType,
        },
      });
    }

    const response = await model.generateContent({ contents: [{ role: "user", parts }] });
    const text = response.response.text();
    const result = parseJsonLoose(text);

    if (!result.title || !result.price) {
      throw new Error("Incomplete Gemini payload");
    }

    return { result, source: "gemini" };
  } catch (error) {
    console.error("[gemini] fallback to mock:", error);
    return { result: mockAnalyze(input.transcript), source: "mock" };
  }
}
