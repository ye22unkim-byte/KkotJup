import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AnalyzeResult } from "./types";
import { mockAnalyze } from "./mock-analyze";

/** 짧은 프롬프트 = 입력 토큰 절약 */
const SYSTEM_PROMPT = `화훼 떨이 상품 JSON만 출력.
사진에 보이는 꽃/색만 사용. 모호한 '혼합 절화' 금지.
스키마:
{"title":string,"flowers":[{"name":string,"approxStems":number}],"price":number,"retailEstimate":number,"discountRate":number,"colorKeywords":string[],"bloomState":"봉오리"|"만개"|"빠른 감상","freshnessTag":string,"careTips":[string,string,string],"quantity":number,"summary":string}
discountRate=round((1-price/retailEstimate)*100). careTips 3줄.`;

function parseJsonLoose(text: string): AnalyzeResult {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const json = start >= 0 && end >= 0 ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(json) as AnalyzeResult;
}

function normalizeBase64(raw: string) {
  return raw.replace(/^data:.*?;base64,/, "").replace(/\s/g, "");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("[503]") ||
    message.includes("high demand") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("[429]")
  );
}

async function callGemini(
  apiKey: string,
  modelName: string,
  input: {
    imageBase64: string;
    imageMimeType: string;
    audioBase64?: string;
    audioMimeType?: string;
    transcript?: string;
  },
): Promise<AnalyzeResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 512,
      responseMimeType: "application/json",
    },
  });

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
    { text: SYSTEM_PROMPT },
    {
      text: `상인입력:${input.transcript || "없음"}\n사진 보고 JSON 작성.`,
    },
    {
      inlineData: {
        data: normalizeBase64(input.imageBase64),
        mimeType: input.imageMimeType || "image/jpeg",
      },
    },
  ];

  // 음성은 토큰 부담이 커서, 전사문이 없을 때만 첨부
  if (!input.transcript && input.audioBase64 && input.audioMimeType) {
    parts.push({
      inlineData: {
        data: normalizeBase64(input.audioBase64),
        mimeType: input.audioMimeType,
      },
    });
  }

  const response = await model.generateContent({ contents: [{ role: "user", parts }] });
  const text = response.response.text();
  const result = parseJsonLoose(text);

  if (!result.title || !result.flowers?.length) {
    throw new Error("Incomplete Gemini payload");
  }

  if (!result.price) result.price = 10000;
  if (!result.retailEstimate) result.retailEstimate = Math.max(result.price * 3, 30000);
  result.discountRate = Math.round((1 - result.price / result.retailEstimate) * 100);
  if (!result.summary) {
    result.summary = `${result.title} / ${result.price.toLocaleString("ko-KR")}원`;
  }

  return result;
}

async function callGeminiWithRetry(
  apiKey: string,
  modelName: string,
  input: Parameters<typeof callGemini>[2],
  retries = 2,
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await callGemini(apiKey, modelName, input);
    } catch (error) {
      lastError = error;
      console.error(`[gemini] ${modelName} attempt ${attempt}/${retries} failed:`, error);
      if (!isRetryableError(error) || attempt === retries) break;
      await sleep(700 * attempt);
    }
  }
  throw lastError;
}

function geminiModels() {
  return Array.from(
    new Set([
      process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
    ]),
  );
}

async function callTranscribe(
  apiKey: string,
  modelName: string,
  input: { audioBase64: string; audioMimeType: string },
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 256,
    },
  });

  const response = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `화훼시장 상인 음성을 듣고, 떨이 등록용 한글로 짧게 정리해.
꽃 이름·수량·가격·상태만 남기고 군더더기·추임새 제거.
문장만 출력. 따옴표·JSON·설명 금지.`,
          },
          {
            inlineData: {
              data: normalizeBase64(input.audioBase64),
              mimeType: input.audioMimeType,
            },
          },
        ],
      },
    ],
  });

  const text = response.response
    .text()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .trim();

  if (!text) throw new Error("Empty transcription");
  return text;
}

async function callTranscribeWithRetry(
  apiKey: string,
  modelName: string,
  input: { audioBase64: string; audioMimeType: string },
  retries = 2,
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await callTranscribe(apiKey, modelName, input);
    } catch (error) {
      lastError = error;
      console.error(`[gemini-transcribe] ${modelName} attempt ${attempt}/${retries} failed:`, error);
      if (!isRetryableError(error) || attempt === retries) break;
      await sleep(700 * attempt);
    }
  }
  throw lastError;
}

/** 음성 → 상인 입력란에 넣을 정리된 텍스트 */
export async function transcribeSellerAudio(input: {
  audioBase64: string;
  audioMimeType: string;
}): Promise<{ text: string; source: "gemini" | "mock" }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return {
      text: "장미랑 리시안셔스 합쳐서 만 원에 떨이",
      source: "mock",
    };
  }

  for (const modelName of geminiModels()) {
    try {
      const text = await callTranscribeWithRetry(apiKey, modelName, input);
      return { text, source: "gemini" };
    } catch (error) {
      console.error(`[gemini-transcribe] model ${modelName} gave up:`, error);
    }
  }

  console.error("[gemini-transcribe] all models failed, fallback to mock");
  return {
    text: "장미랑 리시안셔스 합쳐서 만 원에 떨이",
    source: "mock",
  };
}

export async function analyzeMultimodal(input: {
  imageBase64: string;
  imageMimeType: string;
  audioBase64?: string;
  audioMimeType?: string;
  transcript?: string;
}): Promise<{ result: AnalyzeResult; source: "gemini" | "mock" }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return { result: mockAnalyze(input.transcript), source: "mock" };
  }

  // 저비용 Flash-Lite 우선 (3.8-flash보다 훨씬 저렴)
  for (const modelName of geminiModels()) {
    try {
      const result = await callGeminiWithRetry(apiKey, modelName, input);
      return { result, source: "gemini" };
    } catch (error) {
      console.error(`[gemini] model ${modelName} gave up:`, error);
    }
  }

  console.error("[gemini] all models failed, fallback to mock");
  return { result: mockAnalyze(input.transcript), source: "mock" };
}
