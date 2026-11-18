"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { readBuyerSession } from "@/lib/auth-session";
import type { Reservation } from "@/lib/types";

export default function BuyerHistoryPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState<string | null>(null);
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const res = await fetch(
          `/api/reservations?nickname=${encodeURIComponent(nickname)}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "내역을 불러오지 못했습니다.");
        if (alive) setItems(data.reservations ?? []);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "오류");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [nickname]);

  if (!nickname) {
    return <main className="p-8 text-ink-soft">로그인 확인 중…</main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 pb-20 pt-6">
      <AppHeader backLabel="피드" fallbackHref="/buyer" />

      <section className="animate-rise space-y-5">
        <div>
          <p className="text-sm font-bold text-leaf">{nickname}님의 예약</p>
          <h1 className="mt-1 text-3xl font-black">나의 꽃구출 내역</h1>
          <p className="mt-2 text-sm text-ink-soft">
            지금까지 예약한 꽃 이름과 픽업 번호입니다.
          </p>
        </div>

        {loading ? (
          <p className="text-ink-soft">불러오는 중…</p>
        ) : error ? (
          <p className="rounded-xl bg-petal/10 px-4 py-3 text-sm font-semibold text-petal">
            {error}
          </p>
        ) : items.length === 0 ? (
          <div className="rounded-[1.4rem] border border-dashed border-[var(--line)] bg-white/60 p-10 text-center">
            <p className="font-bold">아직 구출한 꽃이 없어요.</p>
            <Link href="/buyer" className="btn-secondary mt-4 inline-flex">
              피드로 구출하러 가기
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const flowerName =
                item.productTitle || item.product?.title || "떨이 꽃";
              return (
                <li
                  key={item.id || `${item.pickupCode}-${item.reservedAt}`}
                  className="rounded-[1.2rem] bg-white/90 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink-soft">꽃 이름</p>
                      <p className="mt-0.5 truncate text-lg font-black text-ink">
                        {flowerName}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold text-ink-soft">예약 번호</p>
                      <p className="brand-mark mt-0.5 text-3xl tracking-widest text-leaf-deep">
                        {item.pickupCode}
                      </p>
                    </div>
                  </div>
                  {item.reservedAt && (
                    <p className="mt-3 text-xs text-ink-soft">
                      {new Date(item.reservedAt).toLocaleString("ko-KR")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
