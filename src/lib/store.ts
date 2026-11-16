import type { ProductCard, Reservation } from "./types";

const globalStore = globalThis as unknown as {
  __kkotjupProducts?: ProductCard[];
  __kkotjupReservations?: Reservation[];
};

function products() {
  if (!globalStore.__kkotjupProducts) {
    globalStore.__kkotjupProducts = seedProducts();
  }
  return globalStore.__kkotjupProducts;
}

function reservations() {
  if (!globalStore.__kkotjupReservations) {
    globalStore.__kkotjupReservations = [];
  }
  return globalStore.__kkotjupReservations;
}

function seedProducts(): ProductCard[] {
  const closesAt = new Date();
  closesAt.setHours(13, 0, 0, 0);

  return [
    {
      id: "seed-1",
      title: "핑크 장미 외 1종 떨이 박스",
      flowers: [
        { name: "스프레이 장미", approxStems: 10 },
        { name: "리시안셔스", approxStems: 5 },
      ],
      price: 10000,
      retailEstimate: 32000,
      discountRate: 69,
      colorKeywords: ["핑크", "라벤더"],
      bloomState: "만개",
      freshnessTag: "지금 가장 예쁜 만개",
      careTips: [
        "줄기 끝을 사선으로 2cm 잘라 주세요.",
        "아랫잎을 정리해 물이 깨끗하게 유지하세요.",
        "직사광선을 피하고 매일 물을 갈아주세요.",
      ],
      quantity: 3,
      imageDataUrl: "",
      stallCode: "A-12",
      stallZone: "장미관 1층",
      sellerName: "행복화훼",
      createdAt: new Date().toISOString(),
      closesAt: closesAt.toISOString(),
      remainingSlots: 3,
    },
    {
      id: "seed-2",
      title: "거베라 미스터리 박스",
      flowers: [
        { name: "거베라", approxStems: 8 },
        { name: "유칼립투스", approxStems: 3 },
      ],
      price: 8000,
      retailEstimate: 25000,
      discountRate: 68,
      colorKeywords: ["옐로우", "그린"],
      bloomState: "봉오리",
      freshnessTag: "봉오리 상태 · 며칠 더 감상",
      careTips: [
        "거베라 줄기가 꺾이지 않게 낮게 꽂아주세요.",
        "유칼립투스는 물기가 많은 환경이 좋아요.",
        "시든 꽃만 먼저 정리하세요.",
      ],
      quantity: 2,
      imageDataUrl: "",
      stallCode: "B-07",
      stallZone: "절화관 2통로",
      sellerName: "해뜨는꽃집",
      createdAt: new Date().toISOString(),
      closesAt: closesAt.toISOString(),
      remainingSlots: 2,
    },
  ];
}

export function listProducts() {
  return [...products()].sort(
    (a, b) => new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime(),
  );
}

export function getProduct(id: string) {
  return products().find((p) => p.id === id) ?? null;
}

export function addProduct(product: ProductCard) {
  products().unshift(product);
  return product;
}

export function reserveProduct(id: string): Reservation | null {
  const product = getProduct(id);
  if (!product || product.remainingSlots <= 0) return null;

  product.remainingSlots -= 1;
  const pickupCode = String(Math.floor(1000 + Math.random() * 9000));
  const reservation: Reservation = {
    productId: id,
    pickupCode,
    reservedAt: new Date().toISOString(),
  };
  reservations().push(reservation);
  product.pickupCode = pickupCode;
  product.reserved = true;
  return reservation;
}

export function confirmPickup(id: string, code: string) {
  const product = getProduct(id);
  if (!product) return { ok: false as const, message: "상품을 찾을 수 없습니다." };
  const reservation = reservations().find((r) => r.productId === id && r.pickupCode === code);
  if (!reservation && product.pickupCode !== code) {
    return { ok: false as const, message: "예약 번호가 올바르지 않습니다." };
  }
  return { ok: true as const, message: "픽업 확인 완료. 꽃을 건네주세요!" };
}
