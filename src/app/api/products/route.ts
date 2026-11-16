import { NextRequest, NextResponse } from "next/server";
import { addProduct, listProducts } from "@/lib/store";
import type { ProductCard } from "@/lib/types";
import { getTodayCloseIso } from "@/lib/market-hours";

export async function GET() {
  return NextResponse.json({ products: listProducts() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = `p-${Date.now()}`;
    const product: ProductCard = {
      id,
      title: body.title,
      flowers: body.flowers ?? [],
      price: Number(body.price),
      retailEstimate: Number(body.retailEstimate),
      discountRate: Number(body.discountRate),
      colorKeywords: body.colorKeywords ?? [],
      bloomState: body.bloomState,
      freshnessTag: body.freshnessTag,
      careTips: body.careTips ?? [],
      quantity: Number(body.quantity ?? 1),
      imageDataUrl: body.imageDataUrl ?? "",
      stallCode: body.stallCode,
      stallZone: body.stallZone,
      sellerName: body.sellerName,
      createdAt: new Date().toISOString(),
      closesAt: body.closesAt || getTodayCloseIso(),
      remainingSlots: Number(body.quantity ?? 1),
    };

    addProduct(product);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "등록 실패" }, { status: 500 });
  }
}
