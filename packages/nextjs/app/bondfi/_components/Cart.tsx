"use client";

import { Button } from "~~/components/ui/button";
import { Badge } from "~~/components/ui/badge";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

export function Cart() {
  const { cartItems, addToCart, removeFromCart, updateQuantity, getCartTotal, getCartItemCount } = useCart();

  const subtotal = getCartTotal();
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/bondfi/marketplace" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
              <Badge variant="secondary" className="ml-2">
                {getCartItemCount()} {getCartItemCount() === 1 ? 'item' : 'items'}
              </Badge>
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 mb-6">Start shopping to add items to your cart</p>
                <Link href="/bondfi/marketplace">
                  <Button className="bg-primary hover:bg-primary/90">
                    Browse Marketplace
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-lg font-semibold text-primary">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (5%)</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-lg font-medium"
              disabled={cartItems.length === 0}
            >
              Proceed to Checkout
            </Button>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Secure checkout powered by BondFi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
