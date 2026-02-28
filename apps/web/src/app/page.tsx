import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "./_components/hero-section";
import { FeatureCards } from "./_components/feature-cards";
import { HowItWorks } from "./_components/how-it-works";
import { Scenarios } from "./_components/scenarios";
import { SemoCtaSection } from "./_components/semo-cta-section";
import { FaqSection } from "./_components/faq-section";

export default function Page() {
  return (
    <div className="min-h-svh">
      <Header />
      <main>
        <HeroSection />
        <FeatureCards />
        <HowItWorks />
        <Scenarios />
        <SemoCtaSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
