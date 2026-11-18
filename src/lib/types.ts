export type BloomState = "봉오리" | "만개" | "빠른 감상";

export interface FlowerItem {
  name: string;
  approxStems?: number;
}

export interface ProductCard {
  id: string;
  title: string;
  flowers: FlowerItem[];
  price: number;
  retailEstimate: number;
  discountRate: number;
  colorKeywords: string[];
  bloomState: BloomState;
  freshnessTag: string;
  careTips: string[];
  quantity: number;
  imageDataUrl: string;
  stallCode: string;
  stallZone: string;
  sellerName: string;
  createdAt: string;
  closesAt: string;
  remainingSlots: number;
  /** 상품에 부여된 공유 픽업 번호 (손님·상인 동일) */
  pickupCode?: string;
  reserved?: boolean;
}

export interface AnalyzeResult {
  title: string;
  flowers: FlowerItem[];
  price: number;
  retailEstimate: number;
  discountRate: number;
  colorKeywords: string[];
  bloomState: BloomState;
  freshnessTag: string;
  careTips: string[];
  quantity: number;
  summary: string;
}

export interface SellerSession {
  id?: string;
  /** 가게 이름 */
  sellerName: string;
  /** 자세한 위치 (선택) */
  stallZone: string;
  /** 호수/코드 — 없으면 가게명 사용 */
  stallCode: string;
}

export interface BuyerSession {
  nickname: string;
}

export interface Reservation {
  id?: string;
  productId?: string;
  /** 예약 시점 꽃/상품명 (상품 삭제 후에도 내역 표시용) */
  productTitle?: string;
  pickupCode: string;
  reservedAt: string;
  /** 예약 직후 남은 수량 (응답용, 선택) */
  remainingSlots?: number;
  buyerNickname?: string;
  status?: string;
  product?: ProductCard | null;
}

export interface SellerRecord {
  id: string;
  shopName: string;
  location: string;
  createdAt: string;
}
