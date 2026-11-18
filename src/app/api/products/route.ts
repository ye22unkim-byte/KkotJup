import { NextRequest, NextResponse } from "next/server";
import { addProduct, getStorageMode, listProducts } from "@/lib/store";
import { getTodayCloseIso } from "@/lib/market-hours";

export async function GET() {
  try {
    const products = await listProducts();
    return NextResponse.json({ products, storage: getStorageMode() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "목록을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const quantity = Number(body.quantity ?? 1);

    const product = await addProduct({
      title: body.title,
      flowers: body.flowers ?? [],
      price: Number(body.price),
      retailEstimate: Number(body.retailEstimate),
      discountRate: Number(body.discountRate),
      colorKeywords: body.colorKeywords ?? [],
      bloomState: body.bloomState,
      freshnessTag: body.freshnessTag,
      careTips: body.careTips ?? [],
      quantity,
      imageDataUrl: body.imageDataUrl ?? "",
      stallCode: body.stallCode || body.sellerName || "-",
      stallZone: body.stallZone || "",
      sellerName: body.sellerName,
      closesAt: body.closesAt || getTodayCloseIso(),
      remainingSlots: quantity,
    });

    return NextResponse.json({ product, storage: getStorageMode() }, { status: 201 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "등록 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
