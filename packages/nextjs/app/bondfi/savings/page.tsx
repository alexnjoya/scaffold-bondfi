import { Metadata } from "next";
import { SavingsCircles } from "../_components/SavingsCircles";

export const metadata: Metadata = {
  title: "Savings Circles - Bondfi",
  description: "Join community savings groups and build credit together",
};

export default function SavingsPage() {
  return <SavingsCircles />;
}
