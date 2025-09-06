import { Metadata } from "next";
import { Dashboard } from "../_components/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard - Bondfi",
  description: "Your Bondfi dashboard with savings, marketplace, and financial tools",
};

export default function DashboardPage() {
  return <Dashboard />;
}
