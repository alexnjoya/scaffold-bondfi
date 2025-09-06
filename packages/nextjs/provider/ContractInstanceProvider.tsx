"use client";
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useActiveAccount, useActiveWallet, useActiveWalletChain} from 'thirdweb/react';
import { PRICE_ABI } from '@/lib/ABI/PriceAPI_ABI.ts';
import { Token_ABI} from '@/lib/ABI/TestToken_ABI.ts';
import { SWAP_ABI } from '@/lib/ABI/Swap_ABI.ts';
import { AfriStable_ABI } from '@/lib/ABI/AfriStable_ABI.ts';
import {Saving_ABI} from '@/lib/ABI/Saving_ABI.ts';
import { MERCHANT_CORE_ABI } from '@/lib/ABI/Merchant_Core_ABI.ts';
import { Merchant_Registry_ABI } from '@/lib/ABI/Merchant_Registry_ABI.ts';
import { Installment_ABI } from '@/lib/ABI/Installment_ABI.ts';
import { Product_ABI } from '@/lib/ABI/Product_ABI.ts';
import { MultiCurrencySaving_ABI } from '@/lib/ABI/MultiCurrencySaving_ABI.ts';
import tokens from '@/lib/Tokens/tokens.ts';

// Import or define the Token type
import type { Token } from '@/lib/Tokens/tokens.ts';

// Helper function for better error handling
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
};

// Helper function for handling errors with context
const handleError = (error: unknown, context: string): string => {
  console.error(`Error in ${context}:`, error);
  return getErrorMessage(error);
};

// Contract addresses - replace with your actual contract addresses
export const CONTRACT_ADDRESSES = {
  swapAddress: '0x2B2068a831e7C7B2Ac4D97Cd293F934d2625aB69',
  priceFeedAddress: '0x2Efddc5a4FEc6a4308c7206B0E0E9b3898520108',
  afriStableAddress: '0x6615c93A524E2B2daa36276Ac418D3cB60d2DC60',
  savingAddress: '0xE29f69cCeC803F9089A0358d2e3B47118323104d',
  multiCurrencySaving: '0x63e5A563F9b4009cbf61EDFcc85f883dbd1b833A',
  merchantCoreInstallmentAddress:'0x38453e12e2e607726C7C3212F1be83207B6A8Ab4',
  MERCHANT_REGISTRY: '0xd82C058FA8405546aC5a39d8F3397B2A0CcD738c',
  INSTALLMENT_MANAGER: '0xD4E4d780B01AD2446eb85E816EA2EC7b3702410B',
  PRODUCT_CATALOG: '0xDeA521E585D429291f99631D751f5f02F544909b'
};

// Base Sepolia chain ID
const BASE_CHAIN_ID = 84532;

// Network configuration
const BASE_SEPOLIA_CONFIG = {
  chainId: `0x${BASE_CHAIN_ID.toString(16)}`, // 0x14A34 in hex
  chainName: 'Base Sepolia',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [`https://84532.rpc.thirdweb.com/${process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}`],
  blockExplorerUrls: ['https://sepolia.basescan.org/'],
};

// Thirdweb RPC endpoint
const THIRDWEB_RPC_URL = 'https://sepolia.base.org'
//const THIRDWEB_RPC_URL = `https://84532.rpc.thirdweb.com/${process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}`;

// Enhanced context interface with Thirdweb integration
interface ContractInstancesContextType {
  fetchBalance: (faucetAddress: string) => Promise<string | undefined>;
  SWAP_CONTRACT_INSTANCE: () => Promise<ethers.Contract | null>;
  AFRISTABLE_CONTRACT_INSTANCE: () => Promise<ethers.Contract | null>;
  TEST_TOKEN_CONTRACT_INSTANCE: (tokenAddress: string) => Promise<ethers.Contract | null>;
  PRICEAPI_CONTRACT_INSTANCE: () => Promise<ethers.Contract | null>;
  SAVING_CONTRACT_INSTANCE: () => Promise<ethers.Contract | null>;
  MULTICURRENCY_SAVING_CONTRACT_INSTANCE: () => Promise<ethers.Contract | null>;
  MERCHANT_CORE_CONTRACT_INSTANCE: () => Promise<ethers.Contract | null>;
  MERCHANT_REGISTRY_CONTRACT_INSTANCE: () => Promise<ethers.Contract | null>;
  INSTALLMENT_CONTRACT_INSTANCE: () => Promise<ethers.Contract | null>;
  PRODUCT_CONTRACT_INSTANCE: () => Promise<ethers.Contract | null>;
  signer: ethers.Signer | null;
  provider: ethers.JsonRpcProvider | null;
  address: string | null;
  nativeBalance: string | null;
  tokenList: Token[];
  isConnected: boolean;
  isCorrectNetwork: boolean;
  networkError: string | null;
  connectionError: string | null;
  isSwitchingNetwork: boolean;
  // Manual connection method
  reconnectSigner: () => Promise<void>;
  // Network switching method
  switchToBaseNetwork: () => Promise<boolean>;
}

export const ContractInstances = createContext<ContractInstancesContextType | undefined>(undefined);

interface ContractInstanceProviderProps {
  children: ReactNode;
}

// Provider component with updated Thirdweb integration
export const ContractInstanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Thirdweb hooks
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const activeChain = useActiveWalletChain();

  // Local state
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState<boolean>(false);
  const [autoSwitchAttempted, setAutoSwitchAttempted] = useState<boolean>(false);

  // Derived state
  const address = account?.address || null;
  const isConnected = !!account && !!wallet;
  const isCorrectNetwork = activeChain?.id === BASE_CHAIN_ID;

  
  // Enhanced network switching function
  const switchToBaseNetwork = async (): Promise<boolean> => {
    if (isSwitchingNetwork) {
      console.log('Network switch already in progress...');
      return false;
    }

    try {
      setIsSwitchingNetwork(true);
      
      if (!window.ethereum) {
        throw new Error('Ethereum provider not available');
      }

      console.log('Attempting to switch to Base Sepolia network...');
      
      // First, try to switch to the existing network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: BASE_SEPOLIA_CONFIG.chainId }],
        });
        console.log('✅ Successfully switched to Base Sepolia network');
        setNetworkError(null);
        setAutoSwitchAttempted(true);
        return true;
      } catch (switchError: unknown) {
        // If network doesn't exist (error code 4902), add it
        const error = switchError as any;
        if (error.code === 4902) {
          console.log('Base Sepolia network not found, adding it...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_SEPOLIA_CONFIG],
          });
          console.log('✅ Successfully added and switched to Base Sepolia network');
          setNetworkError(null);
          setAutoSwitchAttempted(true);
          return true;
        } else if (error.code === 4001) {
          // User rejected the request
          console.log('❌ User rejected network switch');
          setNetworkError('Please manually switch to Base Sepolia network to continue');
          return false;
        }
        throw switchError;
      }
    } catch (error) {
      console.error('❌ Failed to switch network:', error);
      const errorMessage = getErrorMessage(error);
      setNetworkError(`Failed to switch network: ${errorMessage}`);
      return false;
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  // Initialize provider with Thirdweb RPC
  useEffect(() => {
    const initializeProvider = () => {
      try {
        const jsonRpcProvider = new ethers.JsonRpcProvider(THIRDWEB_RPC_URL);
        setProvider(jsonRpcProvider);
        console.log('Thirdweb RPC provider initialized successfully');
      } catch (error) {
        const errorMessage = handleError(error, 'provider initialization');
        console.error('Failed to initialize Thirdweb RPC provider:', errorMessage);
        setConnectionError('Failed to initialize RPC provider');
      }
    };

    initializeProvider();
  }, []);

  // Effect to create signer from active account with Thirdweb RPC
  useEffect(() => {
    const createSignerFromAccount = async () => {
      if (account && wallet && isConnected && isCorrectNetwork && provider && !isSwitchingNetwork) {
        try {
          console.log('Starting signer creation process...');
          console.log('Account:', account.address);
          console.log('Current chain ID:', activeChain?.id);

          // Check if the browser has ethereum provider for signing
          if (typeof window !== 'undefined' && window.ethereum) {
            console.log('Ethereum provider found, creating browser provider...');
            
            // Create browser provider for signing transactions
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            console.log('Browser provider created successfully');
            
            // Verify we're on the correct network before creating signer
            const network = await browserProvider.getNetwork();
            console.log('Browser provider network:', Number(network.chainId));
            
            if (Number(network.chainId) !== BASE_CHAIN_ID) {
              console.warn('❌ Network mismatch detected in browser provider');
              setSigner(null);
              setConnectionError(`Network mismatch: expected ${BASE_CHAIN_ID}, got ${Number(network.chainId)}`);
              return;
            }
            
            // Get the signer
            console.log('Getting signer from browser provider...');
            const ethSigner = await browserProvider.getSigner();
            console.log('Signer obtained from browser provider');
            
            // Verify the signer address matches the account
            const signerAddress = await ethSigner.getAddress();
            console.log('Signer address:', signerAddress);
            console.log('Account address:', account.address);
            
            if (signerAddress.toLowerCase() === account.address.toLowerCase()) {
              // Try to connect signer to our Thirdweb RPC provider
              try {
                console.log('Connecting signer to Thirdweb RPC provider...');
                const connectedSigner = ethSigner.connect(provider);
                setSigner(connectedSigner);
                setConnectionError(null);
                console.log('✅ Signer connected with Thirdweb RPC provider successfully');
              } catch (connectError) {
                console.warn('Failed to connect signer to Thirdweb RPC, using browser signer:', connectError);
                // Fallback: use the browser signer directly
                setSigner(ethSigner);
                setConnectionError(null);
                console.log('✅ Using browser signer as fallback');
              }
            } else {
              console.warn('❌ Signer address mismatch with account');
              setSigner(null);
              setConnectionError('Address mismatch between wallet and signer');
            }
          } else {
            console.warn('❌ No ethereum provider found in window object');
            setSigner(null);
            setConnectionError('No ethereum provider available');
          }
        } catch (error) {
          console.error('❌ Failed to create signer from account:', error);
          setSigner(null);
          const errorMessage = getErrorMessage(error);
          setConnectionError(`Failed to create signer: ${errorMessage}`);
        }
      } else {
        console.log('Signer creation conditions not met:');
        console.log('- Account:', !!account);
        console.log('- Wallet:', !!wallet);
        console.log('- Is Connected:', isConnected);
        console.log('- Is Correct Network:', isCorrectNetwork);
        console.log('- Provider:', !!provider);
        console.log('- Is Switching Network:', isSwitchingNetwork);
        console.log('- Current Chain ID:', activeChain?.id);
        console.log('- Expected Chain ID:', BASE_CHAIN_ID);
        
        if (isConnected && !isCorrectNetwork && !isSwitchingNetwork) {
          setSigner(null);
        }
      }
    };

    createSignerFromAccount();
  }, [account, wallet, isConnected, isCorrectNetwork, provider, activeChain?.id, isSwitchingNetwork]);

  // Fetch native balance
  useEffect(() => {
    const fetchNativeBalance = async () => {
      if (provider && address && isConnected && isCorrectNetwork) {
        try {
          const balance = await provider.getBalance(address);
          setNativeBalance(ethers.formatEther(balance));
        } catch (error) {
          const errorMessage = handleError(error, 'native balance fetch');
          console.error('Failed to fetch native balance:', errorMessage);
          setNativeBalance('0');
        }
      } else {
        setNativeBalance('0');
      }
    };

    fetchNativeBalance();
  }, [provider, address, isConnected, isCorrectNetwork]);

  // Enhanced effect to handle network changes with automatic switching
  useEffect(() => {
    const handleNetworkChange = async () => {
      if (isConnected && activeChain?.id) {
        console.log(`Current network: ${activeChain.id}, expected: ${BASE_CHAIN_ID}`);
        
        if (activeChain.id !== BASE_CHAIN_ID) {
          console.log(`Wrong network detected: ${activeChain.id}, expected: ${BASE_CHAIN_ID}`);
          
          // Show network error immediately
          setNetworkError(`Connected to wrong network (Chain ID: ${activeChain.id}). Please switch to Base Sepolia (Chain ID: ${BASE_CHAIN_ID}).`);
          
          // Attempt automatic switch only once per session and if user hasn't been prompted before
          if (!autoSwitchAttempted && !isSwitchingNetwork) {
            console.log('Attempting automatic network switch...');
            
            // Add a small delay to ensure wallet state is stable
            setTimeout(async () => {
              const switched = await switchToBaseNetwork();
              if (!switched) {
                console.log('❌ Automatic network switch failed or was rejected');
                setNetworkError(
                  `Wrong network detected. Please switch to Base Sepolia (Chain ID: ${BASE_CHAIN_ID}) manually or click the switch button.`
                );
              }
            }, 1000);
          }
        } else if (activeChain.id === BASE_CHAIN_ID) {
          // Correct network
          console.log('✅ Connected to correct network');
          setNetworkError(null);
          setAutoSwitchAttempted(false); // Reset for future connections
        }
      } else if (isConnected && !activeChain?.id) {
        // Connected but no chain info available
        setNetworkError('Unable to detect current network. Please ensure you are connected to Base Sepolia.');
      } else {
        // Not connected
        setNetworkError(null);
        setAutoSwitchAttempted(false);
      }
    };

    handleNetworkChange();
  }, [activeChain?.id, isConnected, autoSwitchAttempted, isSwitchingNetwork]);

  // Effect to clear state when disconnected
  useEffect(() => {
    if (!isConnected) {
      setConnectionError(null);
      setNetworkError(null);
      setSigner(null);
      setNativeBalance('0');
      setAutoSwitchAttempted(false);
    }
  }, [isConnected]);

  // Fetch balance function
  const fetchBalance = async (faucetAddress: string): Promise<string | undefined> => {
    try {
      if (!provider || !isConnected || !isCorrectNetwork) {
        console.warn('Provider not available, wallet not connected, or wrong network.');
        return;
      }

      const token = tokens.find(token => token.address === faucetAddress);
      if (!token) {
        throw new Error('Token not found');
      }

      // Check if it's the native token
      if (token.symbol === 'ETH') {
        return nativeBalance || '0';
      }

      // For other ERC20 tokens
      const TOKEN_CONTRACT = await TEST_TOKEN_CONTRACT_INSTANCE(faucetAddress);
      if (!TOKEN_CONTRACT) {
        throw new Error('Unable to create token contract instance');
      }
      const balance = await TOKEN_CONTRACT.balanceOf(address);
      const formattedBalance = ethers.formatEther(balance);
      return formattedBalance;

    } catch (error) {
      const errorMessage = handleError(error, 'balance fetch');
      console.error('Error fetching balance:', errorMessage);
      return undefined;
    }
  };

  // Contract instance functions with enhanced error handling
  const createContractInstance = async (
    contractAddress: string, 
    abi: any[], 
    contractName: string
  ): Promise<ethers.Contract | null> => {
    if (!provider || !isConnected || !isCorrectNetwork) {
      console.warn(`${contractName}: Provider not available, wallet not connected, or wrong network.`);
      return null;
    }
    try {
      const signerOrProvider = signer || provider;
      const contract = new ethers.Contract(contractAddress, abi, signerOrProvider);
      console.log(`✅ ${contractName} contract instance created successfully`);
      return contract;
    } catch (error) {
      const errorMessage = handleError(error, `${contractName} contract creation`);
      console.error(`❌ Failed to create ${contractName} contract instance:`, errorMessage);
      return null;
    }
  };

  // Contract instance functions
  const SWAP_CONTRACT_INSTANCE = async (): Promise<ethers.Contract | null> => {
    return createContractInstance(CONTRACT_ADDRESSES.swapAddress, SWAP_ABI, 'SWAP');
  };

  const PRICEAPI_CONTRACT_INSTANCE = async (): Promise<ethers.Contract | null> => {
    return createContractInstance(CONTRACT_ADDRESSES.priceFeedAddress, PRICE_ABI, 'PRICEAPI');
  };

  const TEST_TOKEN_CONTRACT_INSTANCE = async (TOKEN_ADDRESS: string): Promise<ethers.Contract | null> => {
    return createContractInstance(TOKEN_ADDRESS, Token_ABI, 'TEST_TOKEN');
  };

  const AFRISTABLE_CONTRACT_INSTANCE = async (): Promise<ethers.Contract | null> => {
    return createContractInstance(CONTRACT_ADDRESSES.afriStableAddress, AfriStable_ABI, 'AFRISTABLE');
  };

  const MULTICURRENCY_SAVING_CONTRACT_INSTANCE = async (): Promise<ethers.Contract | null> => {
    return createContractInstance(CONTRACT_ADDRESSES.multiCurrencySaving, MultiCurrencySaving_ABI, 'MULTICURRENCY_SAVING');
  };

  const SAVING_CONTRACT_INSTANCE = async (): Promise<ethers.Contract | null> => {
    return createContractInstance(CONTRACT_ADDRESSES.savingAddress, Saving_ABI, 'SAVING');
  };

  const MERCHANT_CORE_CONTRACT_INSTANCE = async (): Promise<ethers.Contract | null> => {
    return createContractInstance(CONTRACT_ADDRESSES.merchantCoreInstallmentAddress, MERCHANT_CORE_ABI, 'MERCHANT_CORE');
  };

  const MERCHANT_REGISTRY_CONTRACT_INSTANCE = async (): Promise<ethers.Contract | null> => {
    return createContractInstance(CONTRACT_ADDRESSES.MERCHANT_REGISTRY, Merchant_Registry_ABI, 'MERCHANT_REGISTRY');
  };

  const PRODUCT_CONTRACT_INSTANCE = async (): Promise<ethers.Contract | null> => {
    return createContractInstance(CONTRACT_ADDRESSES.PRODUCT_CATALOG, Product_ABI, 'PRODUCT');
  };

  const INSTALLMENT_CONTRACT_INSTANCE = async (): Promise<ethers.Contract | null> => {
    return createContractInstance(CONTRACT_ADDRESSES.INSTALLMENT_MANAGER, Installment_ABI, 'INSTALLMENT');
  };

  // Manual reconnection function
  const reconnectSigner = async (): Promise<void> => {
    try {
      console.log('Manual signer reconnection initiated...');
      setConnectionError(null);
      
      if (!isConnected) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      if (!isCorrectNetwork) {
        throw new Error(`Wrong network. Please switch to Base Sepolia (Chain ID: ${BASE_CHAIN_ID})`);
      }

      // Force reconnection
      if (window.ethereum) {
        // Request account access again
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        if (accounts.length === 0) {
          throw new Error('No accounts available');
        }

        // Create fresh provider and signer
        const freshProvider = new ethers.BrowserProvider(window.ethereum);
        const freshSigner = await freshProvider.getSigner();
        
        // Verify the address
        const signerAddress = await freshSigner.getAddress();
        if (account && signerAddress.toLowerCase() === account.address.toLowerCase()) {
          setSigner(freshSigner);
          console.log('✅ Manual signer reconnection successful');
        } else {
          throw new Error('Address mismatch after reconnection');
        }
      } else {
        throw new Error('Ethereum provider not available');
      }
    } catch (error) {
      const errorMessage = handleError(error, 'manual reconnection');
      console.error('Manual reconnection failed:', errorMessage);
      setConnectionError(`Manual reconnection failed: ${errorMessage}`);
      throw error;
    }
  };

  const contextValue: ContractInstancesContextType = {
    fetchBalance,
    SWAP_CONTRACT_INSTANCE,
    AFRISTABLE_CONTRACT_INSTANCE,
    TEST_TOKEN_CONTRACT_INSTANCE,
    PRICEAPI_CONTRACT_INSTANCE,
    SAVING_CONTRACT_INSTANCE,
    MERCHANT_CORE_CONTRACT_INSTANCE,
    MERCHANT_REGISTRY_CONTRACT_INSTANCE,
    PRODUCT_CONTRACT_INSTANCE,
    INSTALLMENT_CONTRACT_INSTANCE,
    MULTICURRENCY_SAVING_CONTRACT_INSTANCE,
    signer,
    provider,
    address,
    nativeBalance,
    tokenList: tokens,
    isConnected,
    isCorrectNetwork,
    networkError,
    connectionError,
    isSwitchingNetwork,
    reconnectSigner,
    switchToBaseNetwork,
  };

  return (
    <ContractInstances.Provider value={contextValue}>
      {children}
    </ContractInstances.Provider>
  );
};

export default ContractInstanceProvider;

// Custom hook to use the context
export const useContractInstances = (): ContractInstancesContextType => {
  const context = React.useContext(ContractInstances);
  if (context === undefined) {
    throw new Error('useContractInstances must be used within a ContractInstanceProvider');
  }
  return context;
};