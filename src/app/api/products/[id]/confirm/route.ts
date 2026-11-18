import { NextRequest, NextResponse } from "next/server";
import { confirmPickup } from "@/lib/store";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const code = String(body.code ?? "");
    const result = await confirmPickup(id, code);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: "확인 실패" }, { status: 500 });
  }
}
