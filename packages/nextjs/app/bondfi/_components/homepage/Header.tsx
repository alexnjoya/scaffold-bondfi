"use client";

import Link from "next/link";
import { Button } from "~~/components/ui/button";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-3 px-4 transition-all duration-300 bg-white shadow-md">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="https://res.cloudinary.com/ecosheane/image/upload/v1756552072/Logo_jvn2t4.png" 
            alt="BondFi Logo" 
            className="h-8"
          />
          <span className="text-xl font-bold text-orange-500">BondFi</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-gray-900">
          <a href="#features" className="hover:text-primary transition-colors text-sm font-medium">Features</a>
          <a href="#price" className="hover:text-primary transition-colors text-sm font-medium">Price</a>
          <a href="#how-it-works" className="hover:text-primary transition-colors text-sm font-medium">How It Works</a>
          <a href="#partners" className="hover:text-primary transition-colors text-sm font-medium">Partners</a>
        </div>
        
        <Button 
          asChild 
          className="bg-gradient-primary text-white hover:opacity-90 px-5 py-2 text-base font-medium shadow-glow"
        >
          <Link href="/bondfi/dashboard">Launch App</Link>
        </Button>
      </nav>
    </header>
  );
}
