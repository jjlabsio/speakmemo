import { BASE_URL } from "@/lib/config";

const SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "semo",
  url: BASE_URL,
  description:
    "녹음 버튼 하나로 시작하세요. AI가 요약, 핵심 포인트, 할 일 목록까지 자동으로 만들어 드립니다.",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
  },
  inLanguage: "ko",
  keywords: "음성 메모, AI 메모, 음성 노트, 회의록 자동 정리",
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
    />
  );
}
