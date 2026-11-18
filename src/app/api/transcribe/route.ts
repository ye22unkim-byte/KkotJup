import { NextRequest, NextResponse } from "next/server";
import { transcribeSellerAudio } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const audioBase64 = body.audioBase64 as string | undefined;
    const audioMimeType = (body.audioMimeType as string) || "audio/webm";

    if (!audioBase64) {
      return NextResponse.json({ error: "audioBase64 is required" }, { status: 400 });
    }

    const { text, source } = await transcribeSellerAudio({
      audioBase64,
      audioMimeType,
    });

    return NextResponse.json({ text, source });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "음성 정리에 실패했습니다." }, { status: 500 });
  }
}
