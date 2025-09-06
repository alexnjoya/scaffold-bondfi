import { Metadata } from "next";
import { Cart } from "../_components/Cart";

export const metadata: Metadata = {
  title: "Shopping Cart - Bondfi",
  description: "Review and manage your shopping cart items",
};

export default function CartPage() {
  return <Cart />;
}
