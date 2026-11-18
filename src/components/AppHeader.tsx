"use client";

import { BackButton } from "./BackButton";
import { Countdown } from "./Countdown";

export function AppHeader({
  backLabel = "이전",
  fallbackHref = "/",
  showCountdown = true,
  preferHistory,
}: {
  backLabel?: string;
  fallbackHref?: string;
  showCountdown?: boolean;
  preferHistory?: boolean;
}) {
  const useHistory =
    preferHistory ?? (backLabel !== "홈");

  return (
    <header className="mb-6 flex items-center justify-between gap-3">
      <BackButton
        label={backLabel}
        fallbackHref={fallbackHref}
        preferHistory={useHistory}
      />
      {showCountdown ? <Countdown compact /> : <span />}
    </header>
  );
}
