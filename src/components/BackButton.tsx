"use client";

import { useRouter } from "next/navigation";

export function BackButton({
  fallbackHref = "/",
  label = "이전",
  /** false면 history.back 하지 않고 항상 fallbackHref로 이동 (홈 버튼용) */
  preferHistory = true,
}: {
  fallbackHref?: string;
  label?: string;
  preferHistory?: boolean;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-sm font-bold text-leaf transition hover:text-leaf-deep"
      onClick={() => {
        if (preferHistory && typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
    >
      <span aria-hidden className="text-base leading-none">
        ←
      </span>
      {label}
    </button>
  );
}
