import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PricingHero } from "./_components/pricing-hero";
import { PricingCards } from "./_components/pricing-cards";
import { FaqSection } from "./_components/faq-section";
import { PricingCta } from "./_components/pricing-cta";

export const metadata: Metadata = {
  title: "요금제 — semo",
  description:
    "지금은 무료로 사용하실 수 있어요. 이후 Pro 플랜이 생길 예정이에요.",
};

export default function PricingPage() {
  return (
    <div className="min-h-svh">
      <Header />
      <PricingHero />
      <PricingCards />
      <FaqSection />
      <PricingCta />
      <Footer />
    </div>
  );
}
