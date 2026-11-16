import type { AnalyzeResult } from "./types";

const MOCK_SETS: AnalyzeResult[] = [
  {
    title: "핑크 장미 외 1종 떨이 박스",
    flowers: [
      { name: "스프레이 장미", approxStems: 10 },
      { name: "리시안셔스", approxStems: 5 },
    ],
    price: 10000,
    retailEstimate: 32000,
    discountRate: 69,
    colorKeywords: ["핑크", "라벤더", "부드러운"],
    bloomState: "만개",
    freshnessTag: "지금 가장 예쁜 만개",
    careTips: [
      "줄기 끝을 사선으로 2cm 잘라 물올림을 도와주세요.",
      "잎이 물에 잠기지 않게 아랫잎을 정리하세요.",
      "직사광선을 피하고 하루 한 번 물을 갈아주세요.",
    ],
    quantity: 3,
    summary: "핑크 장미 외 1종 / 10,000원",
  },
  {
    title: "노란 거베라 미스터리 박스",
    flowers: [
      { name: "거베라", approxStems: 8 },
      { name: "유칼립투스", approxStems: 3 },
    ],
    price: 8000,
    retailEstimate: 25000,
    discountRate: 68,
    colorKeywords: ["옐로우", "그린", "상큼"],
    bloomState: "봉오리",
    freshnessTag: "봉오리 상태 · 며칠 더 감상",
    careTips: [
      "거베라는 줄기가 약하니 화병 높이를 낮게 잡으세요.",
      "유칼립투스는 물기가 많은 환경에서 더 싱싱합니다.",
      "시든 꽃만 먼저 빼면 나머지가 더 오래가요.",
    ],
    quantity: 2,
    summary: "노란 거베라 외 1종 / 8,000원",
  },
  {
    title: "화이트 안개꽃 홈데코 박스",
    flowers: [
      { name: "안개꽃", approxStems: 2 },
      { name: "카네이션", approxStems: 6 },
    ],
    price: 12000,
    retailEstimate: 38000,
    discountRate: 68,
    colorKeywords: ["화이트", "코랄", "로맨틱"],
    bloomState: "빠른 감상",
    freshnessTag: "빠른 감상 추천",
    careTips: [
      "안개꽃은 물 없이도 드라이로 즐길 수 있어요.",
      "카네이션은 시원한 곳에 두면 수명이 늘어납니다.",
      "화병 물을 얕게 잡고 자주 갈아주세요.",
    ],
    quantity: 4,
    summary: "화이트 안개꽃 외 1종 / 12,000원",
  },
];

function extractPriceFromTranscript(transcript?: string) {
  if (!transcript) return null;
  const match = transcript.match(/(\d+)\s*만\s*원/);
  if (match) return Number(match[1]) * 10000;
  const match2 = transcript.match(/(\d{3,6})\s*원/);
  if (match2) return Number(match2[1]);
  return null;
}

export function mockAnalyze(transcript?: string): AnalyzeResult {
  const base = MOCK_SETS[Math.floor(Math.random() * MOCK_SETS.length)];
  const price = extractPriceFromTranscript(transcript) ?? base.price;
  const retailEstimate = Math.max(price * 3, base.retailEstimate);
  const discountRate = Math.round((1 - price / retailEstimate) * 100);

  return {
    ...base,
    price,
    retailEstimate,
    discountRate,
    summary: `${base.flowers[0]?.name ?? "꽃"} 외 ${Math.max(0, base.flowers.length - 1)}종 / ${price.toLocaleString("ko-KR")}원`,
  };
}
