import { NextRequest, NextResponse } from "next/server";
import { reserveProduct } from "@/lib/store";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const buyerNickname = String(body.buyerNickname ?? "").trim();
    const reservation = await reserveProduct(id, buyerNickname || undefined);
    if (!reservation) {
      return NextResponse.json({ error: "예약할 수 없습니다. (매진 또는 없음)" }, { status: 400 });
    }
    return NextResponse.json({
      reservation,
      remainingSlots: reservation.remainingSlots,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "예약 실패" }, { status: 500 });
  }
}
