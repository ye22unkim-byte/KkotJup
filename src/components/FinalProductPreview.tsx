import type { AnalyzeResult, SellerSession } from "@/lib/types";

export function FinalProductPreview({
  analysis,
  session,
  imageDataUrl,
}: {
  analysis: AnalyzeResult;
  session: SellerSession;
  imageDataUrl: string;
}) {
  const saved = Math.max(0, analysis.retailEstimate - analysis.price);
  const flowers = analysis.flowers.filter((f) => f.name.trim());

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[1.5rem] bg-leaf-deep shadow-[var(--shadow)]">
        <div className="relative aspect-[4/3]">
          {imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageDataUrl} alt={analysis.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-leaf text-white">사진 없음</div>
          )}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-petal px-3 py-1 text-xs font-bold text-white">마감 떨이</span>
          <span className="rounded-full bg-dawn px-3 py-1 text-xs font-bold text-leaf-deep">
            미스터리 꽃박스
          </span>
        </div>
        <p className="mt-3 text-sm font-bold text-petal">
          소매 대비 -{analysis.discountRate}% · 약 {saved.toLocaleString("ko-KR")}원 절약
        </p>
        <h2 className="mt-1 break-keep text-3xl font-black leading-snug">{analysis.title}</h2>
        <p className="mt-2 text-ink-soft">
          {session.stallZone} · 호수 {session.stallCode} · {session.sellerName}
        </p>
      </div>

      <div className="flex items-end justify-between rounded-[1.2rem] bg-white/80 p-4">
        <div>
          <p className="text-xs text-ink-soft line-through">
            소매 약 {analysis.retailEstimate.toLocaleString("ko-KR")}원
          </p>
          <p className="text-3xl font-black text-petal">
            {analysis.price.toLocaleString("ko-KR")}원
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-ink-soft">남은 수량</p>
          <p className="text-lg font-black text-leaf">{analysis.quantity}개</p>
        </div>
      </div>

      <div className="rounded-[1.2rem] bg-white/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold">오늘 구출 구성</h3>
          <span className="rounded-full bg-blush px-2.5 py-1 text-xs font-bold text-petal">
            {analysis.freshnessTag}
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {flowers.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between rounded-xl bg-dawn/60 px-3 py-2 text-sm"
            >
              <span className="font-semibold text-ink">{f.name}</span>
              <span className="text-ink-soft">
                {f.approxStems ? `약 ${f.approxStems}대` : "수량 확인"}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {analysis.colorKeywords.map((k) => (
            <span
              key={k}
              className="rounded-full bg-blush px-2.5 py-1 text-xs font-semibold text-petal"
            >
              #{k}
            </span>
          ))}
          <span className="rounded-full bg-dawn px-2.5 py-1 text-xs font-semibold text-leaf-deep">
            #{analysis.bloomState}
          </span>
        </div>
      </div>

      {analysis.careTips.filter(Boolean).length > 0 && (
        <div className="rounded-[1.2rem] bg-white/80 p-4">
          <h3 className="font-bold">집에서 오래 보는 팁</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-ink-soft">
            {analysis.careTips.filter(Boolean).map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
