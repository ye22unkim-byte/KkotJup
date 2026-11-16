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
  stallCode: string;
  stallZone: string;
  sellerName: string;
}

export interface Reservation {
  productId: string;
  pickupCode: string;
  reservedAt: string;
}
