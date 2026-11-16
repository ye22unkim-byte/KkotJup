import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { FlowerVisual } from "@/components/FlowerVisual";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <section className="relative min-h-[100svh] w-full">
        <FlowerVisual className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-between px-6 py-8 md:px-10 md:py-10">
          <header className="flex items-center justify-between animate-rise">
            <p className="text-sm font-semibold tracking-wide text-white/80">
              양재꽃시장 · 마감 1시간
            </p>
            <Countdown compact />
          </header>

          <div className="max-w-3xl pb-8 pt-16 md:pb-16">
            <p className="animate-rise text-sm font-bold uppercase tracking-[0.2em] text-petal-soft">
              TODAY&apos;S RESCUE
            </p>
            <h1 className="brand-mark animate-rise-delay mt-3 text-[4.6rem] text-white drop-shadow-sm sm:text-[6.5rem] md:text-[8rem]">
              꽃줍
            </h1>
            <p className="animate-rise-delay mt-2 text-lg text-white/75 md:text-xl">
              KkotJup
            </p>
            <p className="animate-rise-delay-2 mt-6 max-w-xl text-base leading-relaxed text-white/90 md:text-lg">
              사진 한 장, 음성 3초로 떨이 꽃을 구출하세요. 마감 직전 1시간,
              AI가 상품 카드를 만들고 인근 소비자와 바로 연결합니다.
            </p>

            <div className="animate-rise-delay-2 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/buyer" className="btn-primary animate-pulse-glow">
                오늘의 꽃 구출하기
              </Link>
              <Link href="/seller" className="btn-secondary !bg-white/15 !text-white !border-white/35 backdrop-blur">
                상인으로 떨이 등록
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
