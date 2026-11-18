import { NextRequest, NextResponse } from "next/server";
import { listReservationsByNickname } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const nickname = req.nextUrl.searchParams.get("nickname")?.trim() || "";
    if (!nickname) {
      return NextResponse.json({ error: "nickname이 필요합니다." }, { status: 400 });
    }
    const reservations = await listReservationsByNickname(nickname);
    return NextResponse.json({ reservations });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "내역을 불러오지 못했습니다." }, { status: 500 });
  }
}
