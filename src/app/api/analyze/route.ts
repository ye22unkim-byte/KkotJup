import { NextRequest, NextResponse } from "next/server";
import { analyzeMultimodal } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imageBase64 = body.imageBase64 as string | undefined;
    const imageMimeType = (body.imageMimeType as string) || "image/jpeg";
    const audioBase64 = body.audioBase64 as string | undefined;
    const audioMimeType = body.audioMimeType as string | undefined;
    const transcript = body.transcript as string | undefined;

    if (!imageBase64) {
      return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
    }

    const { result, source } = await analyzeMultimodal({
      imageBase64,
      imageMimeType,
      audioBase64,
      audioMimeType,
      transcript,
    });

    return NextResponse.json({ result, source });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "분석에 실패했습니다." }, { status: 500 });
  }
}
