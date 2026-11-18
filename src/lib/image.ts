/** AI 전송용으로 이미지를 축소·압축 (너무 크면 Gemini 실패 → mock 폴백됨) */
export async function compressImageDataUrl(
  dataUrl: string,
  maxSide = 960,
  quality = 0.72,
): Promise<{ dataUrl: string; mimeType: string; base64: string }> {
  if (typeof window === "undefined") {
    const mimeType = dataUrl.match(/^data:(.*?);/)?.[1] || "image/jpeg";
    return {
      dataUrl,
      mimeType,
      base64: dataUrl.split(",")[1] || "",
    };
  }

  const image = await loadImage(dataUrl);
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const mimeType = dataUrl.match(/^data:(.*?);/)?.[1] || "image/jpeg";
    return { dataUrl, mimeType, base64: dataUrl.split(",")[1] || "" };
  }

  ctx.drawImage(image, 0, 0, width, height);
  const mimeType = "image/jpeg";
  const out = canvas.toDataURL(mimeType, quality);
  return {
    dataUrl: out,
    mimeType,
    base64: out.split(",")[1] || "",
  };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function makePickupCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}
