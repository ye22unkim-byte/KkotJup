import type { SupabaseClient } from "@supabase/supabase-js";

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    base64: match[2],
    extension: mimeToExt(match[1]),
  };
}

function mimeToExt(mime: string) {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

/** data URL이면 Storage에 올리고 public URL 반환. 이미 http면 그대로. */
export async function uploadProductImage(
  supabase: SupabaseClient,
  imageDataUrl: string,
): Promise<string> {
  if (!imageDataUrl) return "";
  if (imageDataUrl.startsWith("http://") || imageDataUrl.startsWith("https://")) {
    return imageDataUrl;
  }

  const parsed = parseDataUrl(imageDataUrl);
  if (!parsed) return imageDataUrl;

  const buffer = Buffer.from(parsed.base64, "base64");
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${parsed.extension}`;

  const { error } = await supabase.storage.from("product-images").upload(path, buffer, {
    contentType: parsed.mimeType,
    upsert: false,
  });

  if (error) {
    console.error("[storage] upload failed:", error.message);
    // 업로드 실패 시 data URL을 그대로 넣지 않음 (DB 비대화 방지)
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}
