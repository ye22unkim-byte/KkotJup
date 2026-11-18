import type { BloomState, FlowerItem, ProductCard } from "@/lib/types";

export type ProductRow = {
  id: string;
  title: string;
  summary: string | null;
  flowers: FlowerItem[] | null;
  price: number;
  retail_estimate: number;
  discount_rate: number;
  color_keywords: string[] | null;
  bloom_state: string;
  freshness_tag: string;
  care_tips: string[] | null;
  quantity: number;
  remaining_slots: number;
  image_url: string;
  stall_code: string;
  stall_zone: string;
  seller_name: string;
  created_at: string;
  closes_at: string;
  pickup_code?: string | null;
};

export function rowToProduct(row: ProductRow): ProductCard {
  return {
    id: row.id,
    title: row.title,
    flowers: Array.isArray(row.flowers) ? row.flowers : [],
    price: row.price,
    retailEstimate: row.retail_estimate,
    discountRate: row.discount_rate,
    colorKeywords: row.color_keywords ?? [],
    bloomState: (row.bloom_state as BloomState) || "만개",
    freshnessTag: row.freshness_tag,
    careTips: row.care_tips ?? [],
    quantity: row.quantity,
    imageDataUrl: row.image_url || "",
    stallCode: row.stall_code,
    stallZone: row.stall_zone,
    sellerName: row.seller_name,
    createdAt: row.created_at,
    closesAt: row.closes_at,
    remainingSlots: row.remaining_slots,
    pickupCode: row.pickup_code || undefined,
  };
}

export function productToInsert(product: Omit<ProductCard, "id" | "createdAt"> & { id?: string }) {
  return {
    title: product.title,
    flowers: product.flowers,
    price: product.price,
    retail_estimate: product.retailEstimate,
    discount_rate: product.discountRate,
    color_keywords: product.colorKeywords,
    bloom_state: product.bloomState,
    freshness_tag: product.freshnessTag,
    care_tips: product.careTips,
    quantity: product.quantity,
    remaining_slots: product.remainingSlots,
    image_url: product.imageDataUrl || "",
    stall_code: product.stallCode,
    stall_zone: product.stallZone,
    seller_name: product.sellerName,
    closes_at: product.closesAt,
    pickup_code: product.pickupCode || null,
  };
}
