"use client";

import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopNavigation } from "./TopNavigation";
import { CartProvider } from "./CartProvider";

interface BondfiLayoutProps {
  children: React.ReactNode;
}

export function BondfiLayout({ children }: BondfiLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <CartProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar 
          collapsed={sidebarCollapsed} 
          onToggleCollapse={setSidebarCollapsed} 
        />
        <div className={`flex-1 flex flex-col min-w-0 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} transition-all duration-300 ease-in-out`}>
          <TopNavigation sidebarCollapsed={sidebarCollapsed} />
          <main className="flex-1 p-6 pt-24 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </CartProvider>
  );
}
