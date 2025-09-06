"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Landmark, 
  Store, 
  Send, 
  ArrowLeftRight,
  Wallet,
  LogOut,
  PanelLeftOpen,
  PanelLeftClose,
  User,
  Droplets
} from "lucide-react";
import { Button } from "~~/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/bondfi/dashboard", icon: LayoutDashboard },
  { title: "Savings Circles", url: "/bondfi/savings", icon: Landmark },
  { title: "Marketplace", url: "/bondfi/marketplace", icon: Store },
  { title: "Remittances", url: "/bondfi/remittances", icon: Send },
  { title: "Swap", url: "/bondfi/swap", icon: ArrowLeftRight },
  { title: "Faucet", url: "/bondfi/faucet", icon: Droplets },
  { title: "Register ENS", url: "/bondfi/register-ens", icon: User },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

export function AppSidebar({ collapsed, onToggleCollapse }: AppSidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const toggleCollapse = () => {
    onToggleCollapse(!collapsed);
  };

  const sidebarWidth = collapsed ? "w-20" : "w-64";

  return (
    <div className={`fixed left-0 top-0 h-screen z-40 ${sidebarWidth} transition-all duration-300 ease-in-out min-w-0 flex-shrink-0 bg-gray-50 border-r border-gray-200`}>
      <div className="p-4 border-b border-gray-200">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} w-full`}>
          {collapsed ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-primary hover:text-primary/80 transition-all duration-200 flex-shrink-0"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
                  <Wallet className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gradient">
                  BondFi
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCollapse}
                className="p-1.5 rounded-lg hover:bg-primary/10 text-primary hover:text-primary/80 transition-all duration-200 flex-shrink-0"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="py-4">
        <div className="space-y-2">
          {navItems.map((item) => (
            <div key={item.title}>
              <Link 
                href={item.url} 
                className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start gap-3'} px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.url)
                    ? "text-primary" 
                    : "text-primary hover:text-primary/80"
                }`}
              >
                <div className={`p-2 rounded-lg transition-all duration-200 ${
                  pathname === item.url
                    ? "bg-gradient-primary text-white shadow-glow" 
                    : "text-primary hover:bg-primary/10"
                }`}>
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                </div>
                <span className={`transition-all duration-300 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                  {item.title}
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`w-full transition-all duration-200 text-destructive hover:text-destructive hover:bg-destructive/10 ${collapsed ? 'justify-center px-2' : 'justify-start px-3'}`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span className={`ml-2 transition-all duration-300 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
              Disconnect
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
