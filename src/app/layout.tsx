import type { Metadata } from "next";
import { Jua } from "next/font/google";
import "./globals.css";

const rounded = Jua({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-rounded",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Jua&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${rounded.variable} antialiased`}>
        <style>{`
          :root {
            --font-display: var(--font-rounded), "Jua", "Noto Sans KR", sans-serif;
            --font-body: var(--font-rounded), "Jua", "Noto Sans KR", sans-serif;
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}
