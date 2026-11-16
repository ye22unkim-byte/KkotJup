import { NextResponse } from "next/server";
import { reserveProduct } from "@/lib/store";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const reservation = reserveProduct(id);
  if (!reservation) {
    return NextResponse.json({ error: "예약할 수 없습니다." }, { status: 400 });
  }
  return NextResponse.json({ reservation });
}
