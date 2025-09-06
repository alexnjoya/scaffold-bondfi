"use client";

import {
  HeroSection,
  PriceCards,
  FeaturesSection,
  HowItWorks,
  Partners,
  Footer
} from "./homepage";

export function BondfiLanding() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <HeroSection />
      <PriceCards />
      <FeaturesSection />
      <HowItWorks />
      <Partners />
      <Footer />
    </div>
  );
}
