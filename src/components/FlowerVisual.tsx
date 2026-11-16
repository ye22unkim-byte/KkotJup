export function FlowerVisual({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,#ff8fb3_0%,transparent_45%),radial-gradient(circle_at_70%_30%,#ffd0de_0%,transparent_40%),radial-gradient(circle_at_55%_75%,#2f8f5b_0%,transparent_50%),linear-gradient(145deg,#0d3b28_0%,#1f6b45_40%,#163528_100%)]" />
      <svg
        className="absolute inset-0 h-full w-full opacity-90 animate-float"
        viewBox="0 0 800 900"
        fill="none"
      >
        <ellipse cx="400" cy="620" rx="180" ry="40" fill="rgba(0,0,0,0.18)" />
        <path
          d="M390 620 C380 480, 360 360, 340 260"
          stroke="#9be7b8"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M400 610 C430 470, 470 360, 520 280"
          stroke="#7dcf9a"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M395 520 C320 490, 280 450, 250 400"
          stroke="#6fbf88"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <g transform="translate(250 220)">
          <circle r="54" fill="#ff4d88" />
          <circle cx="48" cy="-18" r="42" fill="#ff7aa8" />
          <circle cx="-40" cy="-28" r="38" fill="#e11d62" />
          <circle cx="10" cy="-52" r="36" fill="#ff9fbf" />
          <circle cx="0" cy="-10" r="22" fill="#fff3a0" />
        </g>
        <g transform="translate(500 250)">
          <circle r="40" fill="#ff6b9a" />
          <circle cx="34" cy="-14" r="30" fill="#ff9fbf" />
          <circle cx="-28" cy="-20" r="28" fill="#e11d62" />
          <circle cx="4" cy="-8" r="16" fill="#fff6b8" />
        </g>
        <g transform="translate(360 160)">
          <circle r="28" fill="#ffa8c5" />
          <circle cx="22" cy="-8" r="20" fill="#ffd0de" />
          <circle cx="-18" cy="-12" r="18" fill="#ff6b9a" />
          <circle cx="2" cy="-4" r="10" fill="#fff8d0" />
        </g>
        <path
          d="M250 430 C210 410, 190 370, 200 340 C230 350, 255 380, 250 430Z"
          fill="#49a86d"
        />
        <path
          d="M470 390 C520 370, 545 335, 540 300 C505 315, 478 350, 470 390Z"
          fill="#3f9560"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />
    </div>
  );
}
