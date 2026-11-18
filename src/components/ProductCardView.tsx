"use client";

import Link from "next/link";
import type { ProductCard } from "@/lib/types";
import { ProductHero } from "./ProductHero";

export function ProductCardView({
  product,
  href,
}: {
  product: ProductCard;
  href?: string;
}) {
  const content = (
    <article className="group overflow-hidden rounded-[1.4rem] border border-[var(--line)] bg-white/80 shadow-[0_12px_40px_rgba(13,59,40,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(13,59,40,0.14)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-leaf-deep">
        {product.imageDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageDataUrl}
            alt={product.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <ProductHero product={product} className="h-full w-full" />
        )}
        <div className="absolute left-3 top-3 rounded-full bg-petal px-3 py-1 text-xs font-bold text-white">
          -{product.discountRate}%
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          남은 {product.remainingSlots}개
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="break-keep text-lg font-bold leading-snug text-ink">{product.title}</h3>
          <p className="mt-1 text-sm text-ink-soft">
            {product.stallZone} · {product.stallCode} · {product.sellerName}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {product.colorKeywords.slice(0, 3).map((k) => (
            <span
              key={k}
              className="rounded-full bg-dawn px-2.5 py-1 text-xs font-semibold text-leaf-deep"
            >
              {k}
            </span>
          ))}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-ink-soft line-through">
              소매 약 {product.retailEstimate.toLocaleString("ko-KR")}원
            </p>
            <p className="text-2xl font-black text-petal">
              {product.price.toLocaleString("ko-KR")}원
            </p>
          </div>
          <span className="text-sm font-bold text-leaf">{product.bloomState}</span>
        </div>
      </div>
    </article>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
