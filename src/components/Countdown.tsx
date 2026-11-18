"use client";

import { useEffect, useState } from "react";
import {
  formatCountdown,
  getSecondsUntilClose,
  getSecondsUntilOpen,
  isMarketOpen,
} from "@/lib/market-hours";

export function Countdown({ compact = false }: { compact?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [nowTick, setNowTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  void nowTick;
  const open = mounted ? isMarketOpen() : true;
  const seconds = mounted
    ? open
      ? getSecondsUntilClose()
      : getSecondsUntilOpen()
    : 0;
  const label = open ? "마감까지" : "오픈까지";
  const timeText = mounted ? formatCountdown(seconds) : "--:--:--";

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${
          open ? "bg-petal text-white animate-tick" : "bg-leaf-deep/90 text-white"
        }`}
        suppressHydrationWarning
      >
        <span>{label}</span>
        <span className="tabular-nums tracking-tight" suppressHydrationWarning>
          {timeText}
        </span>
      </div>
    );
  }

  return (
    <div className="glass inline-flex flex-col gap-1 rounded-2xl px-5 py-4 shadow-[var(--shadow)]">
      <span className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
        양재꽃시장 · 평일 09:30–20:00
      </span>
      <div className="flex items-end gap-3">
        <span className="text-sm font-bold text-ink-soft">{label}</span>
        <span
          className={`brand-mark text-4xl tabular-nums md:text-5xl ${
            open ? "text-petal animate-tick" : "text-leaf"
          }`}
          suppressHydrationWarning
        >
          {timeText}
        </span>
      </div>
    </div>
  );
}
