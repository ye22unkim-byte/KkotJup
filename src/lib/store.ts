import type { ProductCard, Reservation, SellerRecord } from "./types";
import { getSupabaseServer } from "./supabase/server";
import { productToInsert, rowToProduct, type ProductRow } from "./supabase/mappers";
import { uploadProductImage } from "./supabase/storage";
import { getTodayCloseIso } from "./market-hours";
import { makePickupCode } from "./image";

/* ---------- in-memory fallback (Supabase 미설정 시) ---------- */

const globalStore = globalThis as unknown as {
  __kkotjupProducts?: ProductCard[];
  __kkotjupReservations?: Reservation[];
  __kkotjupSellers?: SellerRecord[];
};

function memoryProducts() {
  if (!globalStore.__kkotjupProducts) {
    globalStore.__kkotjupProducts = seedProducts();
  }
  return globalStore.__kkotjupProducts;
}

function memoryReservations() {
  if (!globalStore.__kkotjupReservations) {
    globalStore.__kkotjupReservations = [];
  }
  return globalStore.__kkotjupReservations;
}

function memorySellers() {
  if (!globalStore.__kkotjupSellers) {
    globalStore.__kkotjupSellers = [];
  }
  return globalStore.__kkotjupSellers;
}

function seedProducts(): ProductCard[] {
  const closesAt = getTodayCloseIso();
  return [
    {
      id: "seed-1",
      title: "핑크 스프레이 장미 + 리시안셔스 떨이",
      flowers: [
        { name: "스프레이 장미", approxStems: 10 },
        { name: "리시안셔스", approxStems: 5 },
      ],
      price: 10000,
      retailEstimate: 32000,
      discountRate: 69,
      colorKeywords: ["핑크", "라벤더", "로맨틱"],
      bloomState: "만개",
      freshnessTag: "지금 가장 예쁜 만개",
      careTips: [
        "장미·리시안셔스 줄기를 사선으로 2cm 잘라 물올림을 도와주세요.",
        "물에 잠기는 아랫잎은 모두 떼어 물이 빨리 흐려지지 않게 하세요.",
        "에어컨 바람을 피하고, 매일 물을 갈아주면 더 오래 갑니다.",
      ],
      quantity: 3,
      imageDataUrl: "",
      stallCode: "A-12",
      stallZone: "장미관 1층",
      sellerName: "행복화훼",
      createdAt: new Date().toISOString(),
      closesAt,
      remainingSlots: 3,
    },
    {
      id: "seed-2",
      title: "노란 거베라 + 유칼립투스 떨이",
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
        "거베라 줄기가 꺾이지 않게 화병 높이를 낮게 잡으세요.",
        "유칼립투스는 물기가 많은 환경에서 더 싱싱합니다.",
        "시든 꽃만 먼저 빼면 나머지가 더 오래가요.",
      ],
      quantity: 2,
      imageDataUrl: "",
      stallCode: "B-07",
      stallZone: "절화관 2통로",
      sellerName: "해뜨는꽃집",
      createdAt: new Date().toISOString(),
      closesAt,
      remainingSlots: 2,
    },
  ];
}

function usingSupabase() {
  return Boolean(getSupabaseServer());
}

/* ---------- public API (async) ---------- */

export async function listProducts(opts?: { includeSoldOut?: boolean }) {
  const includeSoldOut = opts?.includeSoldOut ?? false;
  const supabase = getSupabaseServer();

  if (!supabase) {
    return [...memoryProducts()]
      .filter((p) => includeSoldOut || p.remainingSlots > 0)
      .sort((a, b) => new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime());
  }

  let query = supabase.from("products").select("*").order("closes_at", { ascending: true });
  if (!includeSoldOut) {
    query = query.gt("remaining_slots", 0);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[supabase] listProducts:", error.message);
    throw new Error(error.message);
  }
  return (data as ProductRow[]).map(rowToProduct);
}

export async function getProduct(id: string) {
  const supabase = getSupabaseServer();

  if (!supabase) {
    const product = memoryProducts().find((p) => p.id === id) ?? null;
    if (product && !product.pickupCode) {
      product.pickupCode = makePickupCode();
    }
    return product;
  }

  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("[supabase] getProduct:", error.message);
    throw new Error(error.message);
  }
  if (!data) return null;

  const product = rowToProduct(data as ProductRow);
  if (!product.pickupCode) {
    const code = makePickupCode();
    await supabase.from("products").update({ pickup_code: code }).eq("id", id);
    product.pickupCode = code;
  }
  return product;
}

export async function addProduct(
  input: Omit<ProductCard, "id" | "createdAt"> & { id?: string },
) {
  const supabase = getSupabaseServer();
  const pickupCode = input.pickupCode || makePickupCode();

  if (!supabase) {
    const product: ProductCard = {
      ...input,
      id: input.id || `p-${Date.now()}`,
      createdAt: new Date().toISOString(),
      pickupCode,
    };
    memoryProducts().unshift(product);
    return product;
  }

  let imageUrl = input.imageDataUrl || "";
  if (imageUrl.startsWith("data:")) {
    imageUrl = await uploadProductImage(supabase, imageUrl);
  }

  const payload = productToInsert({
    ...input,
    imageDataUrl: imageUrl,
    pickupCode,
  });
  const { data, error } = await supabase.from("products").insert(payload).select("*").single();

  if (error) {
    console.error("[supabase] addProduct:", error.message);
    throw new Error(error.message);
  }
  return rowToProduct(data as ProductRow);
}

export async function reserveProduct(
  id: string,
  buyerNickname?: string,
): Promise<Reservation | null> {
  const supabase = getSupabaseServer();
  const nickname = buyerNickname?.trim() || undefined;

  if (!supabase) {
    const products = memoryProducts();
    const product = products.find((p) => p.id === id);
    if (!product || product.remainingSlots <= 0) return null;

    product.remainingSlots -= 1;
    if (!product.pickupCode) product.pickupCode = makePickupCode();
    const pickupCode = product.pickupCode;
    const remainingSlots = product.remainingSlots;
    const reservation: Reservation = {
      id: `r-${Date.now()}`,
      productId: id,
      productTitle: product.title,
      pickupCode,
      reservedAt: new Date().toISOString(),
      buyerNickname: nickname,
      status: "reserved",
      remainingSlots,
      product: { ...product },
    };
    memoryReservations().push(reservation);
    product.reserved = true;
    // remaining 0이어도 행은 유지 (피드에서는 숨기고, 상인 내역에서는 조회)
    return reservation;
  }

  // RPC(remaining_slots 모호성) 대신 테이블 직접 갱신 — 예약은 여기서만 1 감소
  const { data: row, error: fetchError } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    console.error("[supabase] reserveProduct fetch:", fetchError.message);
    return null;
  }
  if (!row || (row.remaining_slots as number) <= 0) return null;

  const currentRemaining = row.remaining_slots as number;
  const pickupCode =
    (row.pickup_code as string | null)?.trim() || makePickupCode();
  const productTitle = String(row.title || "떨이 꽃").trim() || "떨이 꽃";
  const remainingSlots = currentRemaining - 1;

  const { data: updated, error: updateError } = await supabase
    .from("products")
    .update({
      remaining_slots: remainingSlots,
      pickup_code: pickupCode,
    })
    .eq("id", id)
    .eq("remaining_slots", currentRemaining)
    .select("id")
    .maybeSingle();

  if (updateError || !updated) {
    console.error(
      "[supabase] reserveProduct update:",
      updateError?.message || "concurrent update",
    );
    return null;
  }

  let reservationRow: { id: string; reserved_at: string } | null = null;
  const baseInsert = {
    product_id: id,
    pickup_code: pickupCode,
    status: "reserved",
    buyer_nickname: nickname ?? null,
  };

  const inserted = await supabase
    .from("reservations")
    .insert({ ...baseInsert, product_title: productTitle })
    .select("id, reserved_at")
    .single();

  if (inserted.error && /product_title/i.test(inserted.error.message)) {
    // 마이그레이션 전 스키마 폴백
    const fallback = await supabase
      .from("reservations")
      .insert(baseInsert)
      .select("id, reserved_at")
      .single();
    if (fallback.error) {
      console.error("[supabase] reserveProduct insert:", fallback.error.message);
      await supabase
        .from("products")
        .update({ remaining_slots: currentRemaining })
        .eq("id", id);
      return null;
    }
    reservationRow = fallback.data;
  } else if (inserted.error || !inserted.data) {
    console.error(
      "[supabase] reserveProduct insert:",
      inserted.error?.message || "empty",
    );
    await supabase
      .from("products")
      .update({ remaining_slots: currentRemaining })
      .eq("id", id);
    return null;
  } else {
    reservationRow = inserted.data;
  }

  // remaining 0이면 피드 쿼리에서 제외됨. 상인 내역용으로 행은 유지.

  return {
    id: reservationRow!.id as string,
    productId: id,
    productTitle,
    pickupCode,
    reservedAt: (reservationRow!.reserved_at as string) || new Date().toISOString(),
    buyerNickname: nickname,
    remainingSlots,
  };
}

/** 상인이 등록한 상품 카드 내역 (매진 포함) */
export async function listProductsBySeller(sellerName: string) {
  const name = sellerName.trim();
  if (!name) return [];
  const supabase = getSupabaseServer();

  if (!supabase) {
    return memoryProducts()
      .filter((p) => p.sellerName === name)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("seller_name", name)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[supabase] listProductsBySeller:", error.message);
    throw new Error(error.message);
  }
  return (data as ProductRow[]).map(rowToProduct);
}

export async function listReservationsByNickname(nickname: string): Promise<Reservation[]> {
  const name = nickname.trim();
  if (!name) return [];
  const supabase = getSupabaseServer();

  if (!supabase) {
    return memoryReservations()
      .filter((r) => r.buyerNickname === name)
      .map((r) => ({
        ...r,
        product: memoryProducts().find((p) => p.id === r.productId) ?? null,
      }))
      .sort((a, b) => new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime());
  }

  const { data, error } = await supabase
    .from("reservations")
    .select("*, products(*)")
    .eq("buyer_nickname", name)
    .order("reserved_at", { ascending: false });

  if (error) {
    console.error("[supabase] listReservationsByNickname:", error.message);
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const productRow = row.products as ProductRow | ProductRow[] | null;
    const product = Array.isArray(productRow)
      ? productRow[0]
        ? rowToProduct(productRow[0])
        : null
      : productRow
        ? rowToProduct(productRow)
        : null;

    const productTitle =
      (row.product_title as string | null)?.trim() ||
      product?.title ||
      "삭제된 떨이";

    return {
      id: row.id as string,
      productId: (row.product_id as string | null) || undefined,
      productTitle,
      pickupCode: row.pickup_code as string,
      reservedAt: row.reserved_at as string,
      buyerNickname: row.buyer_nickname as string | undefined,
      status: row.status as string | undefined,
      product,
    };
  });
}

export async function loginOrRegisterSeller(
  shopName: string,
  location = "",
): Promise<{ seller: SellerRecord; created: boolean }> {
  const name = shopName.trim();
  if (!name) throw new Error("가게 이름은 필수입니다.");
  const loc = location.trim();
  const supabase = getSupabaseServer();

  if (!supabase) {
    const existing = memorySellers().find((s) => s.shopName === name);
    if (existing) {
      if (loc && existing.location !== loc) {
        existing.location = loc;
      }
      return { seller: existing, created: false };
    }
    const seller: SellerRecord = {
      id: `s-${Date.now()}`,
      shopName: name,
      location: loc,
      createdAt: new Date().toISOString(),
    };
    memorySellers().push(seller);
    return { seller, created: true };
  }

  const { data: existing, error: findError } = await supabase
    .from("sellers")
    .select("*")
    .eq("shop_name", name)
    .maybeSingle();

  if (findError) {
    console.error("[supabase] find seller:", findError.message);
    throw new Error(findError.message);
  }

  if (existing) {
    if (loc && existing.location !== loc) {
      await supabase.from("sellers").update({ location: loc }).eq("id", existing.id);
    }
    return {
      seller: {
        id: existing.id,
        shopName: existing.shop_name,
        location: loc || existing.location || "",
        createdAt: existing.created_at,
      },
      created: false,
    };
  }

  const { data: created, error: insertError } = await supabase
    .from("sellers")
    .insert({ shop_name: name, location: loc })
    .select("*")
    .single();

  if (insertError) {
    console.error("[supabase] create seller:", insertError.message);
    throw new Error(insertError.message);
  }

  return {
    seller: {
      id: created.id,
      shopName: created.shop_name,
      location: created.location || "",
      createdAt: created.created_at,
    },
    created: true,
  };
}

export async function confirmPickup(id: string, code: string) {
  const supabase = getSupabaseServer();

  if (!supabase) {
    const product = memoryProducts().find((p) => p.id === id);
    if (!product) return { ok: false as const, message: "상품을 찾을 수 없습니다." };
    const reservation = memoryReservations().find(
      (r) => r.productId === id && r.pickupCode === code,
    );
    if (!reservation && product.pickupCode !== code) {
      return { ok: false as const, message: "예약 번호가 올바르지 않습니다." };
    }
    return { ok: true as const, message: "픽업 확인 완료. 꽃을 건네주세요!" };
  }

  const { data, error } = await supabase.rpc("confirm_pickup", {
    p_product_id: id,
    p_code: code,
  });

  if (error) {
    console.error("[supabase] confirmPickup:", error.message);
    return { ok: false as const, message: "확인에 실패했습니다." };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: Boolean(row?.ok) as true | false,
    message: (row?.message as string) || "처리되었습니다.",
  } as { ok: true; message: string } | { ok: false; message: string };
}

export function getStorageMode(): "supabase" | "memory" {
  return usingSupabase() ? "supabase" : "memory";
}
