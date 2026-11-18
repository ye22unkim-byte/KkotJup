import { Countdown } from "@/components/Countdown";
import { LoginPanel } from "@/components/LoginPanel";

export default function HomePage() {
  return (
    <main className="relative mx-auto min-h-[100svh] max-w-lg overflow-hidden bg-[#f7f1e8]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-24 h-56 w-56 rounded-full bg-[#e7cfc4]/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 bottom-24 h-48 w-48 rounded-full bg-[#edd9cf]/70 blur-3xl"
      />

      <section className="relative flex min-h-[100svh] flex-col">
        <header className="flex items-center justify-between px-6 pt-7">
          <p className="text-sm font-semibold tracking-wide text-[#5c463c]">양재꽃시장</p>
          <Countdown compact tone="soft" />
        </header>

        <div className="px-2 pt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/home-truck.png"
            alt="꽃 트럭 일러스트"
            className="mx-auto w-full object-contain"
          />
        </div>

        <div className="relative flex flex-1 flex-col px-7 pb-8">
          <div className="animate-rise">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#c48998]">
              TODAY&apos;S RESCUE
            </p>
            <h1 className="brand-mark mt-2 text-[3.4rem] text-[#4a342c] sm:text-[3.8rem]">
              꽃줍
            </h1>
            <p className="mt-4 max-w-[18.5rem] text-[0.95rem] leading-relaxed text-[#5c463c]">
              사진 한 장, 음성 10초로 떨이 꽃을 구출하세요.
              <br />
              마감 직전 1시간, AI가 상품 카드를 만들고 소비자와 바로 연결합니다.
            </p>
          </div>

          <div className="animate-rise-delay mt-8">
            <LoginPanel />
          </div>
        </div>

        <svg
          aria-hidden
          viewBox="0 0 360 72"
          className="mt-auto w-full text-[#d07a6a]"
          fill="none"
        >
          <path
            d="M8 28c28 10 40-16 68-8s36 22 64 10 40-20 70-8 34 18 62 8 36-16 72-6"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <circle cx="42" cy="22" r="5" />
            <path d="M42 27v7M39 31h6" />
            <circle cx="318" cy="20" r="5" />
            <path d="M318 25v7M315 29h6" />
            <circle cx="168" cy="46" r="4" />
            <path d="M168 50v6M166 53h4" />
          </g>
        </svg>
      </section>
    </main>
  );
}
