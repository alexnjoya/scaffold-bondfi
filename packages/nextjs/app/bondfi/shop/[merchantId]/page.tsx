import { Metadata } from "next";
import { Shop } from "../../_components/Shop";

export const metadata: Metadata = {
  title: "Shop - Bondfi",
  description: "Shop with verified merchants using stablecoins and earn rewards",
};

export default async function ShopPage({
  params,
}: {
  params: Promise<{ merchantId: string }>;
}) {
  const { merchantId } = await params;
  return <Shop merchantId={merchantId} />;
}
