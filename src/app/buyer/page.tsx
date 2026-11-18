"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Countdown } from "@/components/Countdown";
import { ProductCardView } from "@/components/ProductCardView";
import { clearBuyerSession, readBuyerSession } from "@/lib/auth-session";
import type { ProductCard } from "@/lib/types";
import { isMarketOpen } from "@/lib/market-hours";

export default function BuyerPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

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
    async function load() {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json();
        if (alive) setProducts(data.products ?? []);
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    const id = setInterval(() => {
      setOpen(isMarketOpen());
      void load();
    }, 8000);
    setOpen(isMarketOpen());
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [nickname]);

  if (!nickname) {
    return <main className="p-8 text-ink-soft">로그인 확인 중…</main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 pb-20 pt-6">
      <AppHeader backLabel="홈" fallbackHref="/" />

      <section className="mb-8 animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="brand-mark text-2xl text-leaf-deep">꽃줍</p>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-dawn px-3 py-1 text-sm font-bold text-leaf-deep">
              {nickname}님
            </span>
            <button
              type="button"
              className="text-xs font-semibold text-ink-soft underline"
              onClick={() => {
                clearBuyerSession();
                router.push("/");
              }}
            >
              로그아웃
            </button>
          </div>
        </div>

        <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
          마감 임박 미스터리 꽃박스
        </h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          현재 픽업 예약 가능한 상품들만 모았습니다.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Countdown />
          <Link
            href="/buyer/history"
            className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-leaf-deep shadow-sm underline-offset-2 transition hover:bg-dawn hover:underline"
          >
            나의 꽃구출 내역
          </Link>
        </div>

        {!open && (
          <p className="mt-4 rounded-2xl bg-leaf/10 px-4 py-3 text-sm font-semibold text-leaf-deep">
            지금은 운영 시간이 아닙니다. 평일 09:30–20:00에 구출이 열려요. (데모 피드는
            미리 볼 수 있습니다)
          </p>
        )}
      </section>

      {loading ? (
        <p className="text-ink-soft">불러오는 중…</p>
      ) : products.length === 0 ? (
        <div className="rounded-[1.4rem] border border-dashed border-[var(--line)] bg-white/60 p-10 text-center">
          <p className="font-bold">아직 구출할 꽃이 없어요.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {products.map((p, i) => (
            <div key={p.id} className="animate-rise" style={{ animationDelay: `${i * 0.06}s` }}>
              <ProductCardView product={p} href={`/buyer/${p.id}`} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
