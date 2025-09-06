import { Metadata } from "next";
import { Swap } from "../_components/Swap";

export const metadata: Metadata = {
  title: "Token Swap - Bondfi",
  description: "Swap between different cryptocurrencies seamlessly",
};

export default function SwapPage() {
  return <Swap />;
}
