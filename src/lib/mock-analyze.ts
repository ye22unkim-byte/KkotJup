import type { AnalyzeResult, FlowerItem } from "./types";

const FLOWER_DICT = [
  "스프레이 장미",
  "리시안셔스",
  "유칼립투스",
  "카네이션",
  "안개꽃",
  "거베라",
  "튤립",
  "장미",
  "국화",
  "해바라기",
  "수국",
  "라넌큘러스",
  "프리지아",
  "데이지",
];

function extractPriceFromTranscript(transcript?: string) {
  if (!transcript) return null;
  const match = transcript.match(/(\d+)\s*만\s*원/);
  if (match) return Number(match[1]) * 10000;
  const match2 = transcript.match(/(\d{3,6})\s*원/);
  if (match2) return Number(match2[1]);
  return null;
}

function extractFlowersFromTranscript(transcript?: string): FlowerItem[] {
  if (!transcript) return [];
  const found: FlowerItem[] = [];
  for (const name of FLOWER_DICT) {
    if (transcript.includes(name)) {
      const stemMatch = transcript.match(
        new RegExp(`${name}\\s*(\\d+)\\s*(대|송이|줄기)?`),
      );
      found.push({
        name,
        approxStems: stemMatch ? Number(stemMatch[1]) : 1,
      });
    }
  }
  return found.filter(
    (f, _, arr) =>
      !arr.some((o) => o.name !== f.name && o.name.includes(f.name)),
  );
}

/** Gemini 실패 시에만 사용. 사진 미분석이므로 상인 수정 전제. */
export function mockAnalyze(transcript?: string): AnalyzeResult {
  const price = extractPriceFromTranscript(transcript) ?? 10000;
  const fromText = extractFlowersFromTranscript(transcript);
  const flowers: FlowerItem[] =
    fromText.length > 0
      ? fromText
      : [{ name: "사진 확인 후 수정", approxStems: 1 }];

  const primary = flowers[0].name;
  const retailEstimate = Math.max(price * 3, 30000);
  const discountRate = Math.round((1 - price / retailEstimate) * 100);
  const title =
    fromText.length > 0
      ? flowers.length > 1
        ? `${primary} 외 ${flowers.length - 1}종 떨이`
        : `${primary} 떨이`
      : "사진 속 꽃 떨이 (수정 필요)";

  return {
    title,
    flowers,
    price,
    retailEstimate,
    discountRate,
    colorKeywords: fromText.length > 0 ? ["확인필요"] : ["색감 수정필요"],
    bloomState: "만개",
    freshnessTag: "상인 확인 필요",
    careTips: [
      "줄기 끝을 사선으로 2cm 잘라 물올림을 도와주세요.",
      "물에 잠기는 아랫잎은 정리해 주세요.",
      "직사광선을 피하고 매일 물을 갈아주세요.",
    ],
    quantity: 1,
    summary: `${title} / ${price.toLocaleString("ko-KR")}원`,
  };
}
