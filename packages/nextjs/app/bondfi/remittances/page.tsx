import { Metadata } from "next";
import { Remittances } from "../_components/Remittances";

export const metadata: Metadata = {
  title: "Remittances - Bondfi",
  description: "Send money globally with low fees using blockchain",
};

export default function RemittancesPage() {
  return <Remittances />;
}
