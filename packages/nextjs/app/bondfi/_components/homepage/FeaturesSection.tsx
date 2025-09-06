"use client";

import { FeatureCard } from "../FeatureCard";
import { Landmark, Store, Send } from "lucide-react";

export function FeaturesSection() {
  return (
    <section className="bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-20 pt-32">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Platform Features</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Empowering communities through decentralized finance, savings circles, and merchant ecosystems.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Savings Circles"
            description="Join or create rotating savings groups with transparent smart contracts and automated payouts."
            icon={Landmark}
          />
          <FeatureCard
            title="Merchant Network"
            description="Shop at verified merchants using stablecoins with credit-building rewards and loyalty programs."
            icon={Store}
          />
          <FeatureCard
            title="Cross-Border Payments"
            description="Send remittances instantly across Africa using stablecoins with minimal fees."
            icon={Send}
          />
        </div>
      </div>
    </section>
  );
}
