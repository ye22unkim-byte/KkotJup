import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const display = Noto_Serif_KR({
  weight: ["500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-display-loaded",
});

const body = Noto_Sans_KR({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-body-loaded",
});

export const metadata: Metadata = {
  title: "꽃줍 KkotJup — 오늘의 떨이 꽃 구출",
  description:
    "화훼 도매시장 마감 1시간 전, AI 기반 떨이 꽃 구출 타임어택 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <style>{`
          :root {
            --font-display: var(--font-display-loaded), "Noto Serif KR", "Noto Sans KR", serif;
            --font-body: var(--font-body-loaded), "Noto Sans KR", sans-serif;
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}
