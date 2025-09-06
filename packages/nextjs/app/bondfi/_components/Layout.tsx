"use client";

import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopNavigation } from "./TopNavigation";

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const mainContentMargin = sidebarCollapsed ? "ml-20" : "ml-64";

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={setSidebarCollapsed} 
      />
      <div className={`flex-1 flex flex-col min-w-0 ${mainContentMargin} transition-all duration-300 ease-in-out`}>
        <TopNavigation sidebarCollapsed={sidebarCollapsed} />
        <main className="flex-1 p-6 pt-24 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
