import { Metadata } from "next";
import { Marketplace } from "../_components/Marketplace";

export const metadata: Metadata = {
  title: "Marketplace - Bondfi",
  description: "Shop with merchants using stablecoins and earn rewards",
};

export default function MarketplacePage() {
  return <Marketplace />;
}
