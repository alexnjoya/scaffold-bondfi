"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers, formatEther, parseEther } from 'ethers';
import { Card } from "~~/components/ui/card";
import { Button } from "~~/components/ui/button";
import { Badge } from "~~/components/ui/badge";
import { Input } from "~~/components/ui/input";
import { 
  Store, 
  Search, 
  Filter,
  ShoppingCart,
  Star,
  MapPin,
  Verified,
  CreditCard,
  Zap,
  Package,
  CheckCircle,
  AlertCircle,
  X,
  Check,
  ChevronDown,
  Plus,
  Minus
} from "lucide-react";
import Link from "next/link";

import tokens from '@/lib/Tokens/tokens';
import { CONTRACT_ADDRESSES, useContractInstances } from '@/provider/ContractInstanceProvider';
import { useCart } from '@/contexts/CartContext';
import { BasePayButton, BaseSignInButton } from '~~/components/scaffold-eth';
import { useBaseAccount } from '@/provider/BaseAccountProvider';

interface Notification {
  message: string;
  type: 'success' | 'error';
}

interface Product {
  productId: number;
  merchant: string;
  merchantName: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  price: bigint;
  acceptedTokens: string[];
  tokenNames: string[];
  isAvailable: boolean;
  allowInstallments: boolean;
  minDownPaymentRate: number;
  maxInstallments: number;
  stock: number;
  merchantReputation: number;
}

export function Marketplace() {
  const { 
    isConnected, 
    TEST_TOKEN_CONTRACT_INSTANCE, 
    MERCHANT_CORE_CONTRACT_INSTANCE, 
    MERCHANT_REGISTRY_CONTRACT_INSTANCE,
    address 
  } = useContractInstances();
  
  const { addToCart } = useCart();
  const { isSignedIn: isBaseSignedIn, makePayment: makeBasePayment } = useBaseAccount();
  
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [purchaseForm, setPurchaseForm] = useState({
    paymentToken: 'USDC',
    quantity: 1,
    isInstallment: false,
    downPayment: '',
    numberOfInstallments: 6,
    paymentMethod: 'traditional' as 'traditional' | 'base'
  });
  const [approving, setApproving] = useState(false);
  const [userType, setUserType] = useState('customer'); // 'customer' or 'merchant'
  const [showMerchantModal, setShowMerchantModal] = useState(false);

  // Merchant registration form
  const [merchantForm, setMerchantForm] = useState({
    businessName: '',
    contactInfo: '',
    businessCategory: '',
    acceptedTokens: [] as string[]
  });

  // Filter out the first token as requested
  const availableTokens = tokens.slice(1);
  const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Food'];

  // Fetch products from smart contract
  const fetchProducts = async () => {
    if (!isConnected) return;
    
    try {
      const contract = await MERCHANT_CORE_CONTRACT_INSTANCE();
      if (!contract) {
        showNotification('Contract not available', 'error');
        return;
      }
      
      const allProducts = await contract.getAllProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      showNotification('Error fetching products: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  };

  // Load products on connection
  useEffect(() => {
    if (isConnected) {
      fetchProducts();
    }
  }, [isConnected]);

  // Notification system
  const showNotification = (message: string, type: 'success' | 'error' = 'success'): void => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Token approval function
  const approveToken = async (tokenAddress: string, spenderAddress: string, amount: string): Promise<boolean> => {
    setApproving(true);
    try {
      const tokenContract = await TEST_TOKEN_CONTRACT_INSTANCE(tokenAddress);
      if (!tokenContract) {
        showNotification('Token contract not available', 'error');
        return false;
      }
      
      const tx = await tokenContract.approve(spenderAddress, amount);
      await tx.wait();
      showNotification('Token approved successfully!');
      return true;
    } catch (error) {
      console.error('Token approval error:', error);
      showNotification('Token approval failed: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      return false;
    } finally {
      setApproving(false);
    }
  };

  // Base Pay purchase function
  const handleBasePayPurchase = async (product: Product): Promise<void> => {
    if (!isBaseSignedIn) {
      showNotification('Please sign in with Base Account', 'error');
      return;
    }

    setLoading(true);
    try {
      // Calculate total amount in USDC
      const totalAmount = parseFloat(formatEther(product.price)) * purchaseForm.quantity;
      const amountString = totalAmount.toString();
      
      // Use Base Pay for USDC payment
      const paymentId = await makeBasePayment(amountString, product.merchant, true); // true for testnet
      
      if (paymentId) {
        showNotification('Product purchased successfully with Base Pay!');
        fetchProducts(); // Refresh products
      } else {
        showNotification('Base Pay failed', 'error');
      }
    } catch (error) {
      console.error('Base Pay purchase error:', error);
      showNotification('Base Pay failed: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
    setLoading(false);
  };

  // Purchase product function
  const handlePurchaseProduct = async (product: Product): Promise<void> => {
    // Use Base Pay if selected
    if (purchaseForm.paymentMethod === 'base') {
      await handleBasePayPurchase(product);
      return;
    }

    if (!isConnected) {
      showNotification('Please connect your wallet', 'error');
      return;
    }

    const selectedToken = availableTokens.find(t => t.symbol === purchaseForm.paymentToken);
    if (!selectedToken) {
      showNotification('Invalid payment token selected', 'error');
      return;
    }

    // Check if the selected token is accepted by the product
    const isTokenAccepted = product.acceptedTokens?.includes(selectedToken.address || '');
    if (!isTokenAccepted) {
      showNotification('This payment token is not accepted for this product', 'error');
      return;
    }

    setLoading(true);
    try {
      const contract = await MERCHANT_CORE_CONTRACT_INSTANCE();
      if (!contract) {
        showNotification('Contract not available', 'error');
        setLoading(false);
        return;
      }

      // Calculate total amount
      const totalAmount = product.price * BigInt(purchaseForm.quantity);
      const amountToApprove = totalAmount.toString();
      
      // First approve the token
      const approved = await approveToken(
        selectedToken.address || '',
        CONTRACT_ADDRESSES.merchantCoreInstallmentAddress,
        amountToApprove
      );
      
      if (!approved) {
        setLoading(false);
        return;
      }

      let tx;
      
      if (purchaseForm.isInstallment && product.allowInstallments) {
        tx = await contract.purchaseProductWithInstallments(
          product.productId,
          selectedToken.address || '',
          purchaseForm.quantity,
          purchaseForm.downPayment,
          purchaseForm.numberOfInstallments
        );
      } else {
        tx = await contract.purchaseProduct(
          product.productId,
          selectedToken.address || '',
          purchaseForm.quantity
        );
      }
      
      await tx.wait();
      showNotification('Product purchased successfully!');
      fetchProducts(); // Refresh products
    } catch (error) {
      console.error('Error purchasing product:', error);
      showNotification('Error purchasing product: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
    setLoading(false);
  };

  // Add to cart function
  const handleAddToCart = (product: Product) => {
    const cartItem = {
      id: product.productId.toString(),
      name: product.name,
      price: parseFloat(formatEther(product.price)),
      currency: 'USD',
      quantity: 1,
      image: product.imageUrl || '/placeholder-product.jpg',
      description: product.description,
      category: product.category,
      merchantId: product.merchant,
      acceptedTokens: product.acceptedTokens,
      allowInstallments: product.allowInstallments,
      productId: product.productId
    };
    
    addToCart(cartItem);
    showNotification('Product added to cart!');
  };

  // Merchant registration function
  const handleRegisterMerchant = async (): Promise<void> => {
    if (!merchantForm.businessName || !merchantForm.contactInfo || merchantForm.acceptedTokens.length === 0) {
      showNotification('Please fill in all required fields and select at least one token', 'error');
      return;
    }

    setLoading(true);
    try {
      const contract = await MERCHANT_REGISTRY_CONTRACT_INSTANCE();
      if (!contract) {
        showNotification('Contract not available', 'error');
        setLoading(false);
        return;
      }

      const tx = await contract.registerMerchant(
        merchantForm.businessName,
        merchantForm.contactInfo,
        merchantForm.businessCategory,
        merchantForm.acceptedTokens
      );
      await tx.wait();
      showNotification('Merchant registered successfully!');
      setMerchantForm({
        businessName: '',
        contactInfo: '',
        businessCategory: '',
        acceptedTokens: []
      });
      setUserType('merchant');
      setShowMerchantModal(false);
    } catch (error) {
      console.error('Error registering merchant:', error);
      showNotification('Error registering merchant: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
    setLoading(false);
  };

  // Token selection handlers for merchant registration
  const handleMerchantTokenSelect = (token: any): void => {
    const currentTokens: string[] = merchantForm.acceptedTokens;

    let updatedTokens: string[];
    if (currentTokens.includes(token.address ?? "")) {
      updatedTokens = currentTokens.filter(addr => addr !== (token.address ?? ""));
    } else {
      updatedTokens = [...currentTokens, token.address].filter((addr): addr is string => typeof addr === 'string' && addr !== undefined);
    }

    setMerchantForm({ ...merchantForm, acceptedTokens: updatedTokens });
  };

  const getSelectedMerchantTokenNames = useCallback((tokenAddresses: string[]): string => {
    if (tokenAddresses.length === 0) return 'Select tokens';
    const names: string[] = tokenAddresses.map(addr => {
      const token: any = availableTokens.find(t => t.address === addr);
      return token ? token.symbol : 'Unknown';
    });
    return names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ');
  }, [availableTokens]);

  const getSelectedMerchantTokens = useCallback((tokenAddresses: string[]): any[] => {
    return tokenAddresses.map(addr => availableTokens.find(t => t.address === addr)).filter(Boolean);
  }, [availableTokens]);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.isAvailable;
  });

  // Token Selection Modal Component
  const TokenSelectionModal: React.FC = () => {
    const currentTokens = selectedProduct?.acceptedTokens || [];
    const isForMerchant = showMerchantModal;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-stone-200">
            <h3 className="text-lg font-semibold text-stone-800">
              {isForMerchant ? 'Select Accepted Tokens' : 'Select Payment Token'}
            </h3>
            <button
              onClick={() => setShowTokenModal(false)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-stone-500" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {availableTokens.map((token) => {
              const isSelected = isForMerchant 
                ? merchantForm.acceptedTokens.includes(token.address || '')
                : currentTokens.includes(token.address || '');
              
              return (
                <div
                  key={token.address}
                  className={`flex items-center gap-4 p-4 hover:bg-stone-50 cursor-pointer border-b border-stone-100 last:border-b-0 transition-colors ${
                    isSelected ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => {
                    if (isForMerchant) {
                      handleMerchantTokenSelect(token);
                    } else {
                      setPurchaseForm({...purchaseForm, paymentToken: token.symbol});
                      setShowTokenModal(false);
                    }
                  }}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-100 border-2 border-white shadow-sm">
                      <img 
                        src={token.img} 
                        alt={token.symbol}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-semibold text-stone-800">{token.symbol}</div>
                    <div className="text-sm text-stone-500">{token.name}</div>
                  </div>
                  
                  {isSelected && (
                    <div className="text-blue-500 font-medium text-sm">Selected</div>
                  )}
                </div>
              );
            })}
          </div>

          {isForMerchant && (
            <div className="p-6 border-t border-stone-200 bg-stone-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTokenModal(false)}
                  className="flex-1 px-6 py-3 border border-stone-300 rounded-xl text-stone-700 font-medium hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowTokenModal(false)}
                  className="flex-1 px-6 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                >
                  Confirm Selection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Completely separate merchant registration modal component
  const MerchantRegistrationModalComponent = () => {
    const [localForm, setLocalForm] = useState({
      businessName: '',
      contactInfo: '',
      businessCategory: '',
      acceptedTokens: [] as string[]
    });

    const [showLocalTokenModal, setShowLocalTokenModal] = useState(false);

    // Initialize form when modal opens
    useEffect(() => {
      if (showMerchantModal) {
        setLocalForm({
          businessName: merchantForm.businessName,
          contactInfo: merchantForm.contactInfo,
          businessCategory: merchantForm.businessCategory,
          acceptedTokens: [...merchantForm.acceptedTokens]
        });
      }
    }, [showMerchantModal]);

    const handleInputChange = (field: string, value: string) => {
      setLocalForm(prev => ({ ...prev, [field]: value }));
    };

    const handleTokenSelect = (token: any) => {
      const currentTokens = localForm.acceptedTokens;
      let updatedTokens;
      
      if (currentTokens.includes(token.address)) {
        updatedTokens = currentTokens.filter(addr => addr !== token.address);
      } else {
        updatedTokens = [...currentTokens, token.address];
      }
      
      setLocalForm(prev => ({ ...prev, acceptedTokens: updatedTokens }));
    };

    const handleCloseModal = () => {
      setShowMerchantModal(false);
      setShowLocalTokenModal(false);
    };

    const handleSubmit = async () => {
      // Update parent form with local form data
      setMerchantForm(localForm);
      
      // Call the registration function
      if (!localForm.businessName || !localForm.contactInfo || localForm.acceptedTokens.length === 0) {
        showNotification('Please fill in all required fields and select at least one token', 'error');
        return;
      }

      setLoading(true);
      try {
        const contract = await MERCHANT_REGISTRY_CONTRACT_INSTANCE();
        if (!contract) {
          showNotification('Contract not available', 'error');
          setLoading(false);
          return;
        }

        const tx = await contract.registerMerchant(
          localForm.businessName,
          localForm.contactInfo,
          localForm.businessCategory,
          localForm.acceptedTokens
        );
        await tx.wait();
        showNotification('Merchant registered successfully!');
        setMerchantForm({
          businessName: '',
          contactInfo: '',
          businessCategory: '',
          acceptedTokens: []
        });
        setUserType('merchant');
        handleCloseModal();
      } catch (error) {
        console.error('Error registering merchant:', error);
        showNotification('Error registering merchant: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      }
      setLoading(false);
    };

    const getSelectedTokenNames = (tokenAddresses: string[]) => {
      if (tokenAddresses.length === 0) return 'Select tokens';
      const names = tokenAddresses.map(addr => {
        const token = availableTokens.find(t => t.address === addr);
        return token ? token.symbol : 'Unknown';
      });
      return names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ');
    };

    const getSelectedTokens = (tokenAddresses: string[]) => {
      return tokenAddresses.map(addr => availableTokens.find(t => t.address === addr)).filter(Boolean);
    };

    if (!showMerchantModal) return null;

    return (
      <>
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <h3 className="text-xl font-semibold text-stone-800">Register as Merchant</h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                type="button"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your business name"
                        value={localForm.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        autoComplete="organization"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Contact Information *
                      </label>
                      <input
                        type="text"
                        placeholder="Email or phone number"
                        value={localForm.contactInfo}
                        onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                        className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        autoComplete="email"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Business Category *
                      </label>
                      <select
                        value={localForm.businessCategory}
                        onChange={(e) => handleInputChange('businessCategory', e.target.value)}
                        className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        required
                      >
                        <option value="">Select Business Category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Accepted Tokens *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowLocalTokenModal(true)}
                        className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-left flex items-center justify-between hover:border-stone-400 transition-colors"
                      >
                        <div className="flex-1">
                          {localForm.acceptedTokens.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {getSelectedTokens(localForm.acceptedTokens).slice(0, 3).map((token: any, idx: number) => (
                                  <img
                                    key={idx}
                                    src={token?.img}
                                    alt={token?.symbol}
                                    className="w-6 h-6 rounded-full border-2 border-white"
                                  />
                                ))}
                              </div>
                              <span className="text-stone-700 font-medium">
                                {getSelectedTokenNames(localForm.acceptedTokens)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-500">Select accepted tokens</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {localForm.acceptedTokens.length > 0 && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              {localForm.acceptedTokens.length}
                            </span>
                          )}
                          <ChevronDown className="w-4 h-4 text-stone-400" />
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-6 py-3 border border-stone-300 rounded-xl text-stone-700 font-medium hover:bg-stone-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      disabled={loading || !localForm.businessName || !localForm.contactInfo || localForm.acceptedTokens.length === 0}
                      className="flex-1 px-6 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Registering...' : 'Register as Merchant'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Local Token Selection Modal */}
        {showLocalTokenModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-stone-200">
                <h3 className="text-lg font-semibold text-stone-800">Select Accepted Tokens</h3>
                <button
                  onClick={() => setShowLocalTokenModal(false)}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {availableTokens.map((token) => {
                  const isSelected = localForm.acceptedTokens.includes(token.address || '');
                  return (
                    <div
                      key={token.address}
                      className={`flex items-center gap-4 p-4 hover:bg-stone-50 cursor-pointer border-b border-stone-100 last:border-b-0 transition-colors ${
                        isSelected ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => handleTokenSelect(token)}
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-100 border-2 border-white shadow-sm">
                          <img 
                            src={token.img} 
                            alt={token.symbol}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-semibold text-stone-800">{token.symbol}</div>
                        <div className="text-sm text-stone-500">{token.name}</div>
                      </div>
                      
                      {isSelected && (
                        <div className="text-blue-500 font-medium text-sm">Selected</div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-6 border-t border-stone-200 bg-stone-50">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLocalTokenModal(false)}
                    className="flex-1 px-6 py-3 border border-stone-300 rounded-xl text-stone-700 font-medium hover:bg-stone-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowLocalTokenModal(false)}
                    className="flex-1 px-6 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                  >
                    Confirm Selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Connection Status */}
      {isConnected ? (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-lg w-fit">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-green-700 text-sm">Connected</span>
          <span className="text-stone-500 text-sm">{address?.slice(0, 6)}...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2 rounded-lg w-fit">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-red-700 text-sm">Not Connected</span>
        </div>
      )}

      {/* Token Selection Modal */}
      {showTokenModal && <TokenSelectionModal />}

      {/* Merchant Registration Modal */}
      <MerchantRegistrationModalComponent />

      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 p-4 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 
          'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? 
              <CheckCircle className="w-4 h-4" /> : 
              <AlertCircle className="w-4 h-4" />
            }
            {notification.message}
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Merchant Marketplace</h1>
          <p className="text-muted-foreground">Shop with verified merchants and earn credit rewards.</p>
        </div>
        <div className="flex gap-3">
        <Link href="/bondfi/add-product">
          <Button className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow">
            <Store className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
          {userType !== 'merchant' && (
            <Button 
              onClick={() => setShowMerchantModal(true)}
              className="bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white shadow-glow"
            >
              <Store className="h-4 w-4 mr-2" />
              Become a Merchant
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <Card className="p-4 bg-gradient-card border-border/20">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Products Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Products</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length > 0 ? filteredProducts.map((product, index) => {
            const acceptedTokensInfo = product.acceptedTokens?.map(addr => 
              availableTokens.find(t => t.address === addr)
            ).filter(Boolean) || [];

            return (
              <Card key={index} className="p-6 bg-gradient-card border-border/20 shadow-glass hover:shadow-glow transition-all group">
                <div className="space-y-4">
                  {/* Product Image */}
                  <div className="aspect-square bg-stone-100 rounded-xl mb-4 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Package className="w-12 h-12 text-stone-400" />
                    )}
                      </div>
                  
                  {/* Product Info */}
                      <div>
                    <h3 className="font-semibold text-lg mb-2">{product.name || 'Sample Product'}</h3>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{product.description || 'High-quality product with excellent features.'}</p>
                    
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-bold text-primary">${formatEther(product.price)}</span>
                    <Badge className="bg-accent/10 text-accent">
                        {product.category || 'Electronics'}
                    </Badge>
                  </div>

                    {/* Accepted Tokens Display */}
                    {acceptedTokensInfo.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-2">Accepted tokens:</p>
                        <div className="flex gap-1 flex-wrap">
                          {acceptedTokensInfo.slice(0, 3).map((token, idx) => (
                            <div key={idx} className="flex items-center gap-1 bg-stone-100 px-2 py-1 rounded-md">
                              <img src={token?.img} alt={token?.symbol} className="w-4 h-4 rounded-full" />
                              <span className="text-xs font-medium">{token?.symbol}</span>
                            </div>
                          ))}
                          {acceptedTokensInfo.length > 3 && (
                            <div className="bg-stone-100 px-2 py-1 rounded-md">
                              <span className="text-xs text-muted-foreground">+{acceptedTokensInfo.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Installment Badge */}
                    {product.allowInstallments && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-4">
                        <span className="text-green-700 text-sm">✓ Installments Available</span>
                      </div>
                    )}

                    {/* Purchase Options */}
                    <div className="space-y-3 mb-4">
                      {/* Payment Method Selection */}
                  <div className="space-y-2">
                        <label className="text-sm font-medium">Payment Method</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setPurchaseForm({...purchaseForm, paymentMethod: 'traditional'})}
                            className={`p-2 rounded-lg border text-sm transition-colors ${
                              purchaseForm.paymentMethod === 'traditional'
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-gray-300 hover:border-primary/50'
                            }`}
                          >
                            <div className="font-medium">Traditional</div>
                            <div className="text-xs text-muted-foreground">ETH & Tokens</div>
                          </button>
                          <button
                            onClick={() => setPurchaseForm({...purchaseForm, paymentMethod: 'base'})}
                            className={`p-2 rounded-lg border text-sm transition-colors ${
                              purchaseForm.paymentMethod === 'base'
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-gray-300 hover:border-primary/50'
                            }`}
                          >
                            <div className="font-medium">Base Pay</div>
                            <div className="text-xs text-muted-foreground">USDC on Base</div>
                          </button>
                        </div>
                        {purchaseForm.paymentMethod === 'base' && !isBaseSignedIn && (
                          <div className="mt-2">
                            <BaseSignInButton 
                              onSuccess={() => console.log('Base sign in successful')}
                              onError={(error) => showNotification(error, 'error')}
                              size="sm"
                              className="w-full"
                            />
                      </div>
                        )}
                    </div>

                      {/* Token Selection (only for traditional payments) */}
                      {purchaseForm.paymentMethod === 'traditional' && (
                        <select
                          value={purchaseForm.paymentToken}
                          onChange={(e) => setPurchaseForm({...purchaseForm, paymentToken: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {acceptedTokensInfo.map((token) => (
                            <option key={token?.address} value={token?.symbol}>
                              Pay with {token?.symbol}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newQuantity = Math.max(1, purchaseForm.quantity - 1);
                            setPurchaseForm({...purchaseForm, quantity: newQuantity});
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="px-3 py-1 text-sm font-medium">{purchaseForm.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPurchaseForm({...purchaseForm, quantity: purchaseForm.quantity + 1});
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                  </div>

                    {/* Payment Option Toggle */}
                    {product.allowInstallments && (
                      <div className="flex items-center mb-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={purchaseForm.isInstallment}
                            onChange={(e) => setPurchaseForm({...purchaseForm, isInstallment: e.target.checked})}
                            className="w-4 h-4 text-primary border-gray-300 rounded"
                          />
                          <span className="text-sm">Pay in Installments</span>
                        </label>
                  </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handlePurchaseProduct(product)}
                        disabled={
                          loading || 
                          approving || 
                          (purchaseForm.paymentMethod === 'base' && !isBaseSignedIn) ||
                          (purchaseForm.paymentMethod === 'traditional' && !isConnected)
                        }
                        className="flex-1 bg-gradient-primary hover:bg-gradient-primary/90 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                      >
                        <ShoppingCart className="w-4 h-4 inline mr-2" />
                        {loading || approving ? 'Processing...' : 
                         purchaseForm.paymentMethod === 'base' ? 'Pay with Base' : 'Buy Now'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                    </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          }) : (
            <div className="col-span-full text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Shop by Category</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { name: "Electronics", icon: "📱", count: 156 },
            { name: "Fashion", icon: "👗", count: 89 },
            { name: "Home & Garden", icon: "🏠", count: 234 },
            { name: "Health & Beauty", icon: "💄", count: 67 },
            { name: "Sports & Fitness", icon: "⚽", count: 145 },
            { name: "Books & Media", icon: "📚", count: 78 },
            { name: "Automotive", icon: "🚗", count: 92 },
            { name: "Food & Beverage", icon: "🍕", count: 123 }
          ].map((category, index) => (
            <Card key={index} className="p-4 bg-gradient-card border-border/20 shadow-glass hover:shadow-glow transition-all cursor-pointer group text-center">
              <div className="text-3xl mb-2">{category.icon}</div>
              <h3 className="font-medium">{category.name}</h3>
              <p className="text-sm text-muted-foreground">{category.count} merchants</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <Card className="p-6 bg-gradient-card border-border/20 shadow-glass">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Accepted Payment Methods</h3>
            <p className="text-muted-foreground">Pay with your favorite stablecoins and earn rewards</p>
          </div>
          <div className="flex items-center gap-4">
            {["cUSD", "cGHS", "cZAR", "BFI"].map((token) => (
              <div key={token} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 border border-border/20">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{token}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
