import { Metadata } from "next";
import { SavingsGroupDetails } from "../../_components/SavingsGroupDetails";

export const metadata: Metadata = {
  title: "Savings Group Details - Bondfi",
  description: "View details and manage your savings group",
};

export default async function SavingsGroupDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SavingsGroupDetails id={id} />;
}
