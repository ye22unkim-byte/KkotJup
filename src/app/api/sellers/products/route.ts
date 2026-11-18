import { NextRequest, NextResponse } from "next/server";
import { listProductsBySeller } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const sellerName = req.nextUrl.searchParams.get("sellerName")?.trim() || "";
    if (!sellerName) {
      return NextResponse.json({ error: "sellerName이 필요합니다." }, { status: 400 });
    }
    const products = await listProductsBySeller(sellerName);
    return NextResponse.json({ products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "상품 내역을 불러오지 못했습니다." }, { status: 500 });
  }
}
