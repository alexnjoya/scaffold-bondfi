"use client";

import { useState } from "react";
import { Button } from "~~/components/ui/button";
import { Badge } from "~~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/card";
import { Input } from "~~/components/ui/input";
import { 
  Store, 
  Search, 
  ShoppingCart,
  Star,
  MapPin,
  Verified,
  CreditCard,
  Zap,
  ArrowLeft,
  Filter,
  Heart,
  Share2,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useCart } from "./CartProvider";

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  description: string;
  category: string;
  inStock: boolean;
  rating: number;
  reviews: number;
  merchantId: string;
}

interface Merchant {
  id: string;
  name: string;
  category: string;
  ens: string;
  rating: number;
  reviews: number;
  location: string;
  verified: boolean;
  cashback: string;
  products: number;
  description: string;
  paymentMethods: string[];
}

interface ShopProps {
  merchantId: string;
}

export function Shop({ merchantId }: ShopProps) {
  const { dispatch } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Mock data - in real app, fetch based on merchantId
  const [merchant] = useState<Merchant>(() => {
    // Map merchant IDs to their data
    const merchants: Record<string, Merchant> = {
      "furniture.eth": {
        id: "1",
        name: "furniture.eth",
        category: "Furniture & Decor",
        ens: "furniture.eth",
        rating: 4.9,
        reviews: 234,
        location: "Accra, Ghana",
        verified: true,
        cashback: "5%",
        products: 127,
        description: "Premium furniture and home decor from local artisans. Quality craftsmanship meets modern design.",
        paymentMethods: ["cUSD", "cGHS", "BFI"]
      },
      "electronics.eth": {
        id: "2",
        name: "electronics.eth",
        category: "Electronics",
        ens: "electronics.eth",
        rating: 4.8,
        reviews: 456,
        location: "Lagos, Nigeria",
        verified: true,
        cashback: "3%",
        products: 89,
        description: "Latest electronics and gadgets from trusted brands. Quality assurance and warranty included.",
        paymentMethods: ["cUSD", "cGHS", "BFI"]
      },
      "fashion.eth": {
        id: "3",
        name: "fashion.eth",
        category: "Fashion & Style",
        ens: "fashion.eth",
        rating: 4.7,
        reviews: 189,
        location: "Cape Town, SA",
        verified: true,
        cashback: "7%",
        products: 156,
        description: "Trendy fashion items and accessories. From casual wear to formal attire, we've got you covered.",
        paymentMethods: ["cUSD", "cGHS", "BFI"]
      }
    };
    
    return merchants[merchantId] || merchants["furniture.eth"];
  });

  const [products] = useState<Product[]>([
    {
      id: "1",
      name: "Modern Wooden Chair",
      price: 150,
      currency: "cUSD",
      image: "https://images.unsplash.com/photo-15675380966376-e305069cd1ce?w=400&h=400&fit=crop",
      description: "Elegant wooden chair with ergonomic design",
      category: "Furniture",
      inStock: true,
      rating: 4.8,
      reviews: 45,
      merchantId: "furniture.eth"
    },
    {
      id: "2",
      name: "Smart LED Bulb",
      price: 25,
      currency: "cUSD",
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop",
      description: "WiFi-enabled smart bulb with voice control",
      category: "Electronics",
      inStock: true,
      rating: 4.6,
      reviews: 89,
      merchantId: "electronics.eth"
    },
    {
      id: "3",
      name: "Cotton T-Shirt",
      price: 35,
      currency: "cUSD",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
      description: "Premium cotton t-shirt in various colors",
      category: "Fashion",
      inStock: true,
      rating: 4.7,
      reviews: 123,
      merchantId: "fashion.eth"
    }
  ]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: Product) => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
        merchantId: product.merchantId
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/bondfi/marketplace">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{merchant.name}</h1>
            <p className="text-muted-foreground">{merchant.description}</p>
          </div>
        </div>
        <Link href="/bondfi/add-product">
          <Button className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Merchant Info */}
      <Card className="p-6 bg-gradient-card border-border/20 shadow-glass">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
              <Store className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-semibold">{merchant.name}</h2>
                {merchant.verified && <Verified className="h-5 w-5 text-accent" />}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {merchant.location}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  {merchant.rating} ({merchant.reviews} reviews)
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="mb-2">
              {merchant.cashback} Cashback
            </Badge>
            <div className="text-sm text-muted-foreground">
              {merchant.products} products
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/20">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Payment Methods:</span>
            {merchant.paymentMethods.map((method) => (
              <Badge key={method} variant="outline" className="text-xs">
                {method}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
        >
          <option value="all">All Categories</option>
          <option value="furniture">Furniture</option>
          <option value="electronics">Electronics</option>
          <option value="fashion">Fashion</option>
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="group hover:shadow-glow transition-all cursor-pointer">
            <div className="relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-background/80 hover:bg-background">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-background/80 hover:bg-background">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <Badge variant={product.inStock ? "default" : "destructive"}>
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
              
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {product.description}
              </p>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm">{product.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({product.reviews} reviews)
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-primary">
                  {product.price} {product.currency}
                </div>
                <Button
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.inStock}
                  className="shadow-glow"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
