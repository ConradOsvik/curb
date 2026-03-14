import { createFileRoute, redirect } from "@tanstack/react-router";

import { CtaSection } from "@/components/landing/cta-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { Footer } from "@/components/landing/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { MarketingHeader } from "@/components/marketing-header";
import { getSession } from "@/lib/server/session";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await getSession();
    if (session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: MarketingPage,
});

function MarketingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
