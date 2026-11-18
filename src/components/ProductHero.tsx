import type { ProductCard } from "@/lib/types";

type Palette = {
  bg: string;
  petal: string[];
  leaf: string;
  bucket: string;
  label: string;
};

function paletteFor(product: Pick<ProductCard, "colorKeywords" | "flowers" | "title">): Palette {
  const text = `${product.title} ${product.flowers.map((f) => f.name).join(" ")} ${product.colorKeywords.join(" ")}`.toLowerCase();

  if (text.includes("거베라") || text.includes("옐로") || text.includes("노란")) {
    return {
      bg: "linear-gradient(160deg,#1a3d18 0%,#2f6b28 45%,#f0c94d 140%)",
      petal: ["#ffd84a", "#ffb703", "#ffe566", "#f4a261"],
      leaf: "#7dcf6a",
      bucket: "#c4a574",
      label: "거베라 양동이",
    };
  }
  if (text.includes("안개") || text.includes("화이트") || text.includes("카네이션")) {
    return {
      bg: "linear-gradient(160deg,#1e2f28 0%,#3d5c4e 50%,#f7e8ee 130%)",
      petal: ["#fff7fb", "#ffd6e5", "#ffb4c8", "#f2f2f2"],
      leaf: "#9ad4b0",
      bucket: "#b08968",
      label: "홈데코 박스",
    };
  }
  // default: pink rose / lisianthus clearance bucket
  return {
    bg: "linear-gradient(160deg,#0f2e22 0%,#1f5a3d 42%,#ff8fb3 125%)",
    petal: ["#ff4d88", "#ff7aa8", "#e11d62", "#ffc2d6", "#c77dff"],
    leaf: "#8fd9a8",
    bucket: "#d4a373",
    label: "장미 떨이 양동이",
  };
}

function Rose({
  x,
  y,
  scale = 1,
  colors,
}: {
  x: number;
  y: number;
  scale?: number;
  colors: string[];
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="8" rx="18" ry="10" fill={colors[0]} opacity="0.95" />
      <ellipse cx="-14" cy="0" rx="14" ry="12" fill={colors[1]} />
      <ellipse cx="14" cy="0" rx="14" ry="12" fill={colors[2] ?? colors[0]} />
      <ellipse cx="-6" cy="-12" rx="12" ry="11" fill={colors[3] ?? colors[1]} />
      <ellipse cx="8" cy="-12" rx="12" ry="11" fill={colors[0]} />
      <circle cx="0" cy="-2" r="8" fill="#ffe8a3" />
      <circle cx="0" cy="-2" r="3.5" fill="#fff6d6" />
    </g>
  );
}

export function ProductHero({
  product,
  className = "",
}: {
  product: Pick<ProductCard, "title" | "flowers" | "colorKeywords" | "freshnessTag" | "bloomState">;
  className?: string;
}) {
  const palette = paletteFor(product);
  const primary = product.flowers[0]?.name ?? "떨이 꽃";
  const secondary = product.flowers[1]?.name;

  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden>
      <div className="absolute inset-0" style={{ background: palette.bg }} />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 600" fill="none">
        {/* bucket */}
        <ellipse cx="400" cy="520" rx="210" ry="28" fill="rgba(0,0,0,0.22)" />
        <path
          d="M250 360 L270 520 Q400 555 530 520 L550 360 Z"
          fill={palette.bucket}
        />
        <path
          d="M250 360 Q400 390 550 360 L540 330 Q400 355 260 330 Z"
          fill="#e6c29a"
        />
        <path
          d="M290 400 L305 500 M505 400 L490 500"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth="6"
        />

        {/* stems in bucket */}
        <path d="M360 360 C350 280 330 200 310 120" stroke={palette.leaf} strokeWidth="8" strokeLinecap="round" />
        <path d="M390 365 C385 270 370 180 355 90" stroke="#6fbf88" strokeWidth="7" strokeLinecap="round" />
        <path d="M420 360 C430 270 450 190 470 110" stroke={palette.leaf} strokeWidth="8" strokeLinecap="round" />
        <path d="M450 365 C470 275 500 195 530 140" stroke="#5aa872" strokeWidth="6" strokeLinecap="round" />
        <path d="M340 365 C310 290 280 220 250 170" stroke="#7dcf9a" strokeWidth="6" strokeLinecap="round" />

        <path d="M250 200 C210 180 200 140 220 120 C250 135 265 170 250 200Z" fill="#49a86d" />
        <path d="M520 180 C560 160 575 125 555 105 C525 120 510 155 520 180Z" fill="#3f9560" />

        <Rose x={310} y={115} scale={1.15} colors={palette.petal} />
        <Rose x={360} y={80} scale={1} colors={[...palette.petal].reverse()} />
        <Rose x={430} y={95} scale={1.2} colors={palette.petal} />
        <Rose x={490} y={130} scale={0.9} colors={[palette.petal[1], palette.petal[0], palette.petal[3] ?? palette.petal[1], palette.petal[2] ?? palette.petal[0]]} />
        <Rose x={250} y={155} scale={0.85} colors={palette.petal} />
      </svg>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent px-4 pb-4 pt-16">
        <p className="text-xs font-bold tracking-wide text-white/75">{palette.label}</p>
        <p className="mt-1 text-lg font-black text-white">
          {primary}
          {secondary ? ` + ${secondary}` : ""}
        </p>
        <p className="mt-1 text-sm font-semibold text-white/85">
          {product.bloomState} · {product.freshnessTag}
        </p>
      </div>
    </div>
  );
}
