"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Countdown } from "@/components/Countdown";
import { FlowerVisual } from "@/components/FlowerVisual";
import type { ProductCard } from "@/lib/types";

export default function BuyerDetailPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductCard | null>(null);
  const [pickupCode, setPickupCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Not found");
        if (alive) setProduct(data.product);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "오류");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [params.id]);

  async function reserve() {
    setError("");
    const res = await fetch(`/api/products/${params.id}/reserve`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "예약 실패");
      return;
    }
    setPickupCode(data.reservation.pickupCode);
  }

  if (loading) {
    return <main className="p-8 text-ink-soft">불러오는 중…</main>;
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <p className="font-bold">상품을 찾을 수 없습니다.</p>
        <Link href="/buyer" className="btn-secondary mt-4 inline-flex">
          피드로
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 pb-20 pt-6">
      <header className="mb-5 flex items-center justify-between">
        <Link href="/buyer" className="text-sm font-bold text-leaf">
          ← 피드
        </Link>
        <Countdown compact />
      </header>

      <div className="animate-rise overflow-hidden rounded-[1.5rem] bg-leaf-deep shadow-[var(--shadow)]">
        <div className="relative aspect-[4/3]">
          {product.imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageDataUrl} alt={product.title} className="h-full w-full object-cover" />
          ) : (
            <FlowerVisual className="h-full w-full" />
          )}
        </div>
      </div>

      <section className="animate-rise-delay mt-5 space-y-4">
        <div>
          <p className="text-sm font-bold text-petal">소매 대비 -{product.discountRate}%</p>
          <h1 className="mt-1 text-3xl font-black leading-tight">{product.title}</h1>
          <p className="mt-2 text-ink-soft">
            {product.stallZone} · 호수 {product.stallCode} · {product.sellerName}
          </p>
        </div>

        <div className="flex items-end justify-between rounded-[1.2rem] bg-white/80 p-4">
          <div>
            <p className="text-xs text-ink-soft line-through">
              소매 약 {product.retailEstimate.toLocaleString("ko-KR")}원
            </p>
            <p className="text-3xl font-black text-petal">
              {product.price.toLocaleString("ko-KR")}원
            </p>
          </div>
          <span className="rounded-full bg-dawn px-3 py-1 text-sm font-bold text-leaf-deep">
            {product.freshnessTag}
          </span>
        </div>

        <div className="rounded-[1.2rem] bg-white/80 p-4">
          <h2 className="font-bold">포함 꽃</h2>
          <ul className="mt-2 space-y-1 text-sm text-ink-soft">
            {product.flowers.map((f) => (
              <li key={f.name}>
                · {f.name}
                {f.approxStems ? ` 약 ${f.approxStems}대` : ""}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.colorKeywords.map((k) => (
              <span key={k} className="rounded-full bg-blush px-2.5 py-1 text-xs font-semibold text-petal">
                {k}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[1.2rem] bg-white/80 p-4">
          <h2 className="font-bold">집에서 오래 보는 팁</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-ink-soft">
            {product.careTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ol>
        </div>

        {pickupCode ? (
          <div className="rounded-[1.4rem] bg-leaf-deep p-6 text-center text-white">
            <p className="text-sm font-semibold text-white/80">픽업 예약 번호</p>
            <p className="brand-mark mt-2 text-6xl tracking-widest">{pickupCode}</p>
            <p className="mt-3 text-sm text-white/85">
              {product.stallZone} {product.stallCode}에서 이 번호를 보여주세요.
            </p>
          </div>
        ) : (
          <button
            type="button"
            className="btn-primary w-full text-lg"
            onClick={() => void reserve()}
            disabled={product.remainingSlots <= 0}
          >
            {product.remainingSlots <= 0 ? "매진" : "픽업 예약하기"}
          </button>
        )}

        {error && <p className="text-sm font-semibold text-petal">{error}</p>}
      </section>
    </main>
  );
}
