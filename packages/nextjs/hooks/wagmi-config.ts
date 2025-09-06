import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// Create wagmi config
export const wagmiConfig = createConfig({
  chains: [sepolia], // ✅ Ethereum Sepolia
  connectors: [
    injected(),
    metaMask(),
    // Add WalletConnect if you have a project ID
    // walletConnect({ projectId: 'your-project-id' }),
  ],
  transports: {
    [sepolia.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
