import { NextResponse } from "next/server";
import { getStorageMode } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function GET() {
  return NextResponse.json({
    ok: true,
    storage: getStorageMode(),
    supabaseConfigured: isSupabaseConfigured(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
}
