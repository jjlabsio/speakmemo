import type { Metadata } from "next";
import "@repo/ui/globals.css";
import "@/styles/theme.css";
import { Providers } from "@/components/providers";
import { pretendard } from "@/styles/font";
import { JsonLd } from "./_components/json-ld";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BASE_URL } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "semo — 말하면, 정리된다. AI 음성 메모",
  description:
    "녹음 버튼 하나로 시작하세요. AI가 요약, 핵심 포인트, 할 일 목록까지 자동으로 만들어 드립니다.",
  keywords: [
    "음성 메모",
    "음성 노트",
    "보이스 메모",
    "AI 메모",
    "AI 노트 정리",
    "말하면 정리",
    "음성 요약",
    "회의록 자동 정리",
    "아이디어 메모",
    "semo",
  ],
  openGraph: {
    title: "semo — 말하면, 정리된다",
    description: "그냥 말하세요. semo가 알아서 정리해 드릴게요.",
    url: BASE_URL,
    siteName: "semo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "semo — 말하면, 정리된다",
    description: "그냥 말하세요. semo가 알아서 정리해 드릴게요.",
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${pretendard.variable} font-sans antialiased`}>
        <JsonLd />
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
