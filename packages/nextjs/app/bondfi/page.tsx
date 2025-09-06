import { Metadata } from "next";
import { BondfiLanding } from "./_components/BondfiLanding";

export const metadata: Metadata = {
  title: "Bondfi - DeFi Platform",
  description: "Access to DeFi services including savings circles, marketplace, remittances, and more",
};

export default function BondfiPage() {
  return <BondfiLanding />;
}
