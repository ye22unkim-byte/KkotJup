"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Countdown } from "@/components/Countdown";
import { ProductCardView } from "@/components/ProductCardView";
import type { ProductCard } from "@/lib/types";
import { isMarketOpen } from "@/lib/market-hours";

export default function BuyerPage() {
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/products");
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
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 pb-20 pt-6">
      <header className="mb-8 flex items-center justify-between gap-3">
        <div>
          <Link href="/" className="brand-mark text-3xl text-leaf-deep">
            꽃줍
          </Link>
          <p className="mt-1 text-sm text-ink-soft">오늘의 꽃 구출 피드</p>
        </div>
        <Countdown compact />
      </header>

      <section className="mb-8 animate-rise">
        <h1 className="text-3xl font-black leading-tight md:text-4xl">
          마감 임박 미스터리 꽃박스
        </h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          점심시간에 픽업 가능한 떨이만 모았습니다. AI가 꽃 종류·상태·관리법까지
          미리 알려드려요.
        </p>
        {!open && (
          <p className="mt-4 rounded-2xl bg-leaf/10 px-4 py-3 text-sm font-semibold text-leaf-deep">
            지금은 운영 시간이 아닙니다. 평일 11:30–13:00에 구출이 열려요. (데모 피드는
            미리 볼 수 있습니다)
          </p>
        )}
      </section>

      {loading ? (
        <p className="text-ink-soft">불러오는 중…</p>
      ) : products.length === 0 ? (
        <div className="rounded-[1.4rem] border border-dashed border-[var(--line)] bg-white/60 p-10 text-center">
          <p className="font-bold">아직 구출할 꽃이 없어요.</p>
          <Link href="/seller" className="btn-primary mt-4 inline-flex">
            상인으로 첫 등록하기
          </Link>
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
