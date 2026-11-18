import { NextRequest, NextResponse } from "next/server";
import { getStorageMode, loginOrRegisterSeller } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const shopName = String(body.shopName ?? "").trim();
    const location = String(body.location ?? "").trim();
    if (!shopName) {
      return NextResponse.json({ error: "가게 이름은 필수입니다." }, { status: 400 });
    }

    const { seller, created } = await loginOrRegisterSeller(shopName, location);
    return NextResponse.json({ seller, created, storage: getStorageMode() });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "로그인 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
