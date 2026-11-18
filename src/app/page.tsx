import { Countdown } from "@/components/Countdown";
import { LoginPanel } from "@/components/LoginPanel";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-[100svh] max-w-lg bg-cream">
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
        {/* 상단 히어로 사진 — 하단으로 베이지에 페이드 */}
        <div className="relative min-h-[58svh] flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/home-hero.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_28%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#f2e8d9]/35 via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-transparent via-[#f2e8d9]/75 to-[#f2e8d9]" />

          <header className="relative z-10 flex items-center justify-between px-6 pt-7">
            <p className="text-sm font-semibold tracking-wide text-leaf-deep">양재꽃시장</p>
            <Countdown compact />
          </header>
        </div>

        {/* 하단 브랜드 + 로그인 */}
        <div className="relative z-10 -mt-10 flex flex-col px-7 pb-10 pt-2">
          <div className="animate-rise">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-petal">
              TODAY&apos;S RESCUE
            </p>
            <h1 className="brand-mark mt-2 text-[3.6rem] text-leaf-deep sm:text-[4.2rem]">
              꽃줍
            </h1>
            <p className="mt-2 text-sm font-medium tracking-wide text-ink-soft">KkotJup</p>
            <p className="mt-5 max-w-[20rem] text-[0.95rem] leading-relaxed text-ink">
              사진 한 장, 음성 10초로 떨이 꽃을 구출하세요.
              <br />
              마감 직전 1시간, AI가 상품 카드를 만들고 소비자와 바로 연결합니다.
            </p>
          </div>

          <div className="animate-rise-delay mt-7">
            <LoginPanel />
          </div>

          <span
            aria-hidden
            className="animate-sparkle pointer-events-none absolute bottom-8 right-7 text-xl text-white drop-shadow-sm"
          >
            ✦
          </span>
        </div>
      </section>
    </main>
  );
}
