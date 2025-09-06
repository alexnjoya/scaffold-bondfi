"use client";

import React, { useState, useEffect } from "react";
import { Button } from "~~/components/ui/button";
import { Badge } from "~~/components/ui/badge";
import { Bell, Wallet, Menu, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { createThirdwebClient } from "thirdweb";
import { ConnectButton } from "thirdweb/react";
import { useAccount, useEnsName, useEnsAvatar, useEnsAddress } from "wagmi";
import { BaseSignInButton } from "~~/components/scaffold-eth";
import { useBaseAccount } from "@/provider/BaseAccountProvider";

interface TopNavigationProps {
  sidebarCollapsed?: boolean;
}

// ENS name formatting function - show full name
const formatENS = (ensName: string) => {
  return ensName;
};

// Ethereum address formatting function
const formatAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};


const resolveAddressToENS = async (address: string) => {
  try {
    console.log('Fetching ENS for address:', address);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/api/address/${address}`);
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('ENS data received:', data);
      return data.ens_name;
    } else {
      console.error('Failed to fetch ENS:', response.status, response.statusText);
    }
    return '';
  } catch (error) {
    console.error('ENS resolution failed:', error);
    return '';
  }
};


export function TopNavigation({ sidebarCollapsed = false }: TopNavigationProps) {
  const { state } = useCart();
  const cartItemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [resolvedENS, setResolvedENS] = useState<string | null>(null);
  const { isSignedIn: isBaseSignedIn } = useBaseAccount();

  
  // Get the active account from wagmi
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ 
    address, 
    chainId: 11155111
  });
  const { data: ensAvatar } = useEnsAvatar({ 
    name: ensName ?? undefined, 
    chainId: 11155111,
    query: {
      enabled: !!ensName,
    }
  });

  // Primary ENS resolution using wagmi useEnsAddress hook (for address to ENS)
  const { data: wagmiEnsAddress, isError: isWagmiError, isLoading: isWagmiLoading, error: wagmiError } = useEnsAddress({
    name: address?.endsWith('.eth') ? address : undefined,
    chainId: 11155111 // Base Sepolia Testnet chain ID
  });

  const client = createThirdwebClient({ 
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '9d358fb1c51d6d6g1d6d6g1d6d6g1d6d6g'
  });

  // Calculate left position based on sidebar state
  const leftPosition = sidebarCollapsed ? "left-20" : "left-64";

  // Check screen size for responsiveness
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);


  // Handle wagmi ENS resolution
  useEffect(() => {
    console.log("Wagmi ENS Address:", wagmiEnsAddress);
    console.log("Wagmi ENS Loading:", isWagmiLoading);
    console.log("Wagmi ENS Error:", isWagmiError);
    if (wagmiError) console.log("Wagmi ENS Error details:", wagmiError);
    
    if (wagmiEnsAddress && address?.endsWith('.eth')) {
      console.log('ENS resolved via wagmi:', wagmiEnsAddress);
      setResolvedENS(wagmiEnsAddress);
    } else if (isWagmiError && address?.endsWith('.eth')) {
      console.log('Wagmi ENS resolution failed, trying fallback...');
      // Try fallback methods when wagmi fails
      resolveAddressToENS(address);
    }
  }, [wagmiEnsAddress, isWagmiLoading, isWagmiError, wagmiError, address]);

  // Fallback ENS resolution for address to ENS name
  useEffect(() => {
    console.log('ENS useEffect triggered:', { ensName, address, resolvedENS });
    if (!ensName && address && !address.endsWith('.eth')) {
      console.log('Attempting to resolve ENS for address:', address);
      resolveAddressToENS(address).then(name => {
        console.log('ENS resolution result:', name);
        if (name) {
          setResolvedENS(name);
          console.log('Set resolvedENS to:', name);
        }
      });
    }
  }, [ensName, address]);


  return (
    <>
      <header 
        className={`fixed top-0 ${leftPosition} right-0 z-50 h-16 border-b border-border/10 bg-card-glass backdrop-blur-xl transition-all duration-300 ease-in-out min-w-0`}
        style={{
          width: `calc(100vw - ${sidebarCollapsed ? '5rem' : '16rem'})`,
          maxWidth: '100%'
        }}
      >
        <div className="flex items-center justify-end h-full px-4 md:px-6 w-full">
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 w-full justify-end">
            {isMobile ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                
                {showMobileMenu && (
                  <div className="absolute top-16 right-0 w-48 bg-card-glass border border-border/10 rounded-lg shadow-lg p-2 backdrop-blur-xl md:hidden">
                    <div className="flex flex-col gap-2">
                      <div className="p-2">
                        <BaseSignInButton 
                          size="sm"
                          onSuccess={() => console.log('Base sign in successful')}
                          onError={(error) => console.error('Base sign in error:', error)}
                        />
                      </div>
                      
                      <Button variant="ghost" size="sm" className="relative w-full justify-start">
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                        <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-accent"></Badge>
                      </Button>
                      
                      <Link href="/bondfi/cart" className="w-full">
                        <Button variant="ghost" size="sm" className="relative w-full justify-start">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Cart
                          <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-primary text-primary-foreground">
                            {cartItemCount}
                          </Badge>
                        </Button>
                      </Link>
                      
                      {isConnected && address && (
                        <div className="p-2 border-t border-border/20 mt-2">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-card border border-border/20">
                            {ensAvatar ? (
                              <img 
                                src={ensAvatar} 
                                className="w-6 h-6 rounded-full object-cover"
                                alt="ENS Avatar"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center">
                                <Wallet className="h-3 w-3 text-white" />
                              </div>
                            )}
                            <span className="text-sm font-medium">
                              {ensName
                                ? formatENS(ensName)
                                : resolvedENS
                                  ? formatENS(resolvedENS)
                                  : formatAddress(address)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-accent"></Badge>
                </Button>
                
                <Link href="/bondfi/cart">
                  <Button variant="ghost" size="sm" className="relative">
                    <ShoppingCart className="h-4 w-4" />
                    <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-primary text-primary-foreground">
                      {cartItemCount}
                    </Badge>
                  </Button>
                </Link>
              </>
            )}
            
            <div className="flex-shrink-0 min-w-0 max-w-full flex items-center gap-2">
              <BaseSignInButton 
                size="sm"
                onSuccess={() => console.log('Base sign in successful')}
                onError={(error) => console.error('Base sign in error:', error)}
              />
              <ConnectButton 
                client={client}
                connectButton={{
                  label: isMobile ? "Connect" : "Connect Wallet",
                  className: "!bg-gradient-to-r !from-terracotta !to-sage !text-white !font-medium !px-3 md:!px-4 !py-2 md:!py-3 !rounded-lg !text-sm md:!text-base"
                }}
                detailsButton={{
                  className: "!bg-green-600 !text-white !font-medium !px-3 md:!px-4 !py-2 md:!py-3 !rounded-lg !text-sm md:!text-base",
                  displayBalanceToken: {
                    84532: "0x0000000000000000000000000000000000000000"
                  }
                }}
                connectModal={{
                  title: "Connect to BondFi",
                  showThirdwebBranding: false,
                }}
                switchButton={{
                  label: "Switch to Base Sepolia"
                }}
              />
            </div>
            
            {!isMobile && isConnected && address && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-card border border-border/20">
                {ensAvatar ? (
                  <img 
                    src={ensAvatar} 
                    className="w-6 h-6 rounded-full object-cover"
                    alt="ENS Avatar"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center">
                    <Wallet className="h-3 w-3 text-white" />
                  </div>
                )}
                <span className="text-sm font-medium">
        {ensName
  ? formatENS(ensName)
  : resolvedENS
    ? formatENS(resolvedENS)
    : formatAddress(address)}

                </span>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}