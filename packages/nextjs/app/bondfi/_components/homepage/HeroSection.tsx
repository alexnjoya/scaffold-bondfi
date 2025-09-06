"use client";

import Link from "next/link";
import { Button } from "~~/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative z-10 w-full bg-black min-h-screen flex items-center mt-16">
      <div className="w-full grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-fade-in px-6 lg:pl-12">
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6 font-['Clash Display', 'sans-serif']">
            <span className="block bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
              Save, Build Credit,
            </span>
            <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              Shop Together
            </span>
          </h1>
          <p className="text-xl text-white/70 mb-8 leading-relaxed font-['Clash Display', 'sans-serif'] bg-gradient-to-r from-white/90 to-white/60 bg-clip-text text-transparent">
            A DeFi platform for savings circles, merchant payments, and global money transfers using stablecoins.
          </p>
          <Button 
            asChild 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90 shadow-accent-glow group"
          >
            <Link href="/bondfi/dashboard" className="flex items-center gap-2">
              Launch App
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
        
        <div className="relative animate-float h-screen flex items-center justify-end pr-0">
          <div className="absolute inset-0 bg-gradient-primary blur-3xl opacity-10 animate-pulse-glow"></div>
          <div className="relative w-[600px] h-[600px]">
            <img 
              src="https://res.cloudinary.com/ecosheane/image/upload/v1756551397/download_fuskmj.png" 
              alt="BondFi Blockchain Illustration" 
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
