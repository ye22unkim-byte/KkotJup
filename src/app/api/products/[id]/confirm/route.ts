import { NextRequest, NextResponse } from "next/server";
import { confirmPickup } from "@/lib/store";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await req.json();
  const code = String(body.code ?? "");
  const result = confirmPickup(id, code);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
