"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ProductHero } from "@/components/ProductHero";
import { readBuyerSession } from "@/lib/auth-session";
import type { ProductCard } from "@/lib/types";

type Phase = "idle" | "confirm" | "submitting";

export default function BuyerDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [nickname, setNickname] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductCard | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pickupCode, setPickupCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = readBuyerSession();
    if (!session) {
      router.replace("/");
      return;
    }
    setNickname(session.nickname);
  }, [router]);

  useEffect(() => {
    if (!nickname) return;
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
  }, [params.id, nickname]);

  async function startReserve() {
    if (!nickname || !product) {
      setError("로그인이 필요합니다.");
      return;
    }
    if (phase !== "idle") return;
    if (product.remainingSlots <= 0) {
      setError("이미 매진된 상품입니다.");
      return;
    }

    setPhase("submitting");
    setError("");
    try {
      const res = await fetch(`/api/products/${params.id}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerNickname: nickname }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "예약 실패");
        setPhase("idle");
        return;
      }

      const code = String(data.reservation?.pickupCode || product.pickupCode || "");
      const remaining =
        typeof data.remainingSlots === "number"
          ? data.remainingSlots
          : Math.max(0, product.remainingSlots - 1);

      setPickupCode(code);
      setProduct({ ...product, remainingSlots: remaining, reserved: true });
      setPhase("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "예약 실패");
      setPhase("idle");
    }
  }

  /** 확인 = 피드 이동만. 수량 감소/예약 API 호출 없음 */
  function goToFeed() {
    router.replace("/buyer");
  }

  if (loading) {
    return <main className="p-8 text-ink-soft">불러오는 중…</main>;
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-lg px-5 py-8">
        <AppHeader backLabel="피드" fallbackHref="/buyer" />
        <p className="font-bold">상품을 찾을 수 없습니다.</p>
        <Link href="/buyer" className="btn-secondary mt-4 inline-flex">
          피드로
        </Link>
      </main>
    );
  }

  const saved = product.retailEstimate - product.price;

  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 pb-20 pt-6">
      <AppHeader backLabel="피드" fallbackHref="/buyer" />

      <div className="animate-rise overflow-hidden rounded-[1.5rem] shadow-[var(--shadow)]">
        <div className="relative aspect-[4/3]">
          {product.imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageDataUrl}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <ProductHero product={product} className="h-full w-full" />
          )}
        </div>
      </div>

      <section className="animate-rise-delay mt-5 space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-petal px-3 py-1 text-xs font-bold text-white">
              마감 떨이
            </span>
            <span className="rounded-full bg-dawn px-3 py-1 text-xs font-bold text-leaf-deep">
              미스터리 꽃박스
            </span>
          </div>
          <p className="mt-3 text-sm font-bold text-petal">
            소매 대비 -{product.discountRate}% · 약 {saved.toLocaleString("ko-KR")}원 절약
          </p>
          <h1 className="mt-1 break-keep text-3xl font-black leading-snug tracking-tight">
            {product.title}
          </h1>
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
          <div className="text-right">
            <p className="text-xs font-semibold text-ink-soft">남은 수량</p>
            <p className="text-lg font-black text-leaf">{product.remainingSlots}개</p>
          </div>
        </div>

        <div className="rounded-[1.2rem] bg-white/80 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold">오늘 구출 구성</h2>
            <span className="rounded-full bg-blush px-2.5 py-1 text-xs font-bold text-petal">
              {product.freshnessTag}
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {product.flowers.map((f, i) => (
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
            {product.colorKeywords.map((k) => (
              <span
                key={k}
                className="rounded-full bg-blush px-2.5 py-1 text-xs font-semibold text-petal"
              >
                #{k}
              </span>
            ))}
            <span className="rounded-full bg-dawn px-2.5 py-1 text-xs font-semibold text-leaf-deep">
              #{product.bloomState}
            </span>
          </div>
        </div>

        <div className="rounded-[1.2rem] bg-white/80 p-4">
          <h2 className="font-bold">픽업 안내</h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm text-ink-soft">
            <li>픽업 예약하기를 누르면 남은 수량이 1개 줄고 픽업 번호가 나옵니다.</li>
            <li>확인을 누르면 꽃줍 피드로 돌아갑니다.</li>
            <li>
              <strong className="text-ink">
                {product.stallZone} {product.stallCode}
              </strong>
              에서 대기 없이 수령하세요. 마감(20:00) 전 방문 권장.
            </li>
          </ol>
        </div>

        <div className="rounded-[1.2rem] bg-white/80 p-4">
          <h2 className="font-bold">집에서 오래 보는 팁</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-ink-soft">
            {product.careTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ol>
        </div>

        {product.remainingSlots <= 0 && phase === "idle" ? (
          <div className="rounded-[1.2rem] bg-ink/5 p-5 text-center">
            <p className="font-black text-ink">매진되었어요</p>
            <p className="mt-1 text-sm text-ink-soft">피드에서 다른 떨이 꽃을 구출해 보세요.</p>
            <Link href="/buyer" className="btn-secondary mt-4 inline-flex">
              피드로 돌아가기
            </Link>
          </div>
        ) : phase === "idle" || phase === "submitting" ? (
          <button
            type="button"
            className="btn-primary w-full text-lg"
            disabled={phase === "submitting"}
            onClick={() => void startReserve()}
          >
            {phase === "submitting" ? "예약 중…" : "픽업 예약하기"}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-[1.4rem] bg-leaf-deep p-6 text-center text-white">
              <p className="text-sm font-semibold text-white/80">픽업 번호</p>
              <p className="brand-mark mt-2 text-6xl tracking-widest">{pickupCode}</p>
              <p className="mt-3 text-sm text-white/85">
                이 번호를 상인에게 보여주세요. 확인을 누르면 꽃줍 피드로 돌아갑니다.
              </p>
            </div>
            <button type="button" className="btn-primary w-full text-lg" onClick={goToFeed}>
              확인
            </button>
          </div>
        )}

        {error && <p className="text-sm font-semibold text-petal">{error}</p>}
      </section>
    </main>
  );
}
