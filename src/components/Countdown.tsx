"use client";

import { useEffect, useState } from "react";
import {
  formatCountdown,
  getSecondsUntilClose,
  getSecondsUntilOpen,
  isMarketOpen,
} from "@/lib/market-hours";

export function Countdown({ compact = false }: { compact?: boolean }) {
  const [nowTick, setNowTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  void nowTick;
  const open = isMarketOpen();
  const seconds = open ? getSecondsUntilClose() : getSecondsUntilOpen();
  const label = open ? "마감까지" : "오픈까지";

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${open ? "bg-petal text-white animate-tick" : "bg-leaf-deep/90 text-white"}`}>
        <span>{label}</span>
        <span className="tabular-nums tracking-tight">{formatCountdown(seconds)}</span>
      </div>
    );
  }

  return (
    <div className="glass inline-flex flex-col gap-1 rounded-2xl px-5 py-4 shadow-[var(--shadow)]">
      <span className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
        양재꽃시장 · 평일 11:30–13:00
      </span>
      <div className="flex items-end gap-3">
        <span className="text-sm font-bold text-ink-soft">{label}</span>
        <span
          className={`brand-mark text-4xl tabular-nums md:text-5xl ${open ? "text-petal animate-tick" : "text-leaf"}`}
        >
          {formatCountdown(seconds)}
        </span>
      </div>
    </div>
  );
}
