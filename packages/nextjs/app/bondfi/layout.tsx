"use client";
import { BondfiLayout } from "./_components/BondfiLayout";
import { ThirdwebProvider } from "thirdweb/react";
import ContractInstanceProvider from "@/provider/ContractInstanceProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/hooks/wagmi-config";
import { WagmiProvider } from "wagmi";
import { CartProvider } from "@/contexts/CartContext";
import { BaseAccountProvider } from "@/provider/BaseAccountProvider";

const queryClient = new QueryClient();

export default function BondfiLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={wagmiConfig}>
       <QueryClientProvider client={queryClient}>
          <ThirdwebProvider>
           <ContractInstanceProvider>
             <BaseAccountProvider>
               <CartProvider>
                 <BondfiLayout>
                   {children}
                 </BondfiLayout>
               </CartProvider>
             </BaseAccountProvider>
           </ContractInstanceProvider>
           </ThirdwebProvider>
         </QueryClientProvider>
         </WagmiProvider>
  );
}
