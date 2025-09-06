import { Metadata } from "next";
import { AddProduct } from "../_components/AddProduct";

export const metadata: Metadata = {
  title: "Add Product - Bondfi",
  description: "Add new products to your store on Bondfi marketplace",
};

export default function AddProductPage() {
  return <AddProduct />;
}
