"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "~~/components/ui/card";
import { Button } from "~~/components/ui/button";
import { Input } from "~~/components/ui/input";
import { Label } from "~~/components/ui/label";
import { Badge } from "~~/components/ui/badge";
import { 
  Send, 
  ArrowDownUp, 
  Clock, 
  DollarSign,
  Globe,
  Shield,
  Zap,
  History,
  Check,
  User,
  AlertCircle,
  ArrowRight,
  X
} from "lucide-react";
import { useContractInstances } from '@/provider/ContractInstanceProvider';
import tokens from '@/lib/Tokens/tokens.ts';
import { ethers, formatEther, parseEther, parseUnits } from 'ethers';
import { roundToTwoDecimalPlaces } from '@/lib/utils';
import { useEnsName, useEnsAddress } from 'wagmi';
import { BasePayButton, BaseSignInButton } from '~~/components/scaffold-eth';
import { useBaseAccount } from '@/provider/BaseAccountProvider';

export function Remittances() {
  const { isConnected, TEST_TOKEN_CONTRACT_INSTANCE, AFRISTABLE_CONTRACT_INSTANCE, fetchBalance, address } = useContractInstances();
  const { isSignedIn: isBaseSignedIn, makePayment: makeBasePayment } = useBaseAccount();
  const [recipient, setRecipient] = useState('');
  const [ensAddress, setEnsAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenList, setTokenList] = useState(tokens);
  const [selectedToken, setSelectedToken] = useState(tokens[2]); 
  const [step, setStep] = useState(1);
  const [isTransacting, setIsTransacting] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [error, setError] = useState('');
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isResolvingEns, setIsResolvingEns] = useState(false);
  const [resolvedENS, setResolvedENS] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'traditional' | 'base'>('traditional');

  // Primary ENS resolution using wagmi useEnsAddress hook
  const { data: wagmiEnsAddress, isError: isWagmiError, isLoading: isWagmiLoading, error: wagmiError } = useEnsAddress({
    name: recipient.endsWith('.eth') ? recipient : undefined,
    chainId: 11155111 // Base Sepolia Testnet chain ID
  });

  const transactionFee = 0.001; // ETH for gas
  const estimatedTime = '2-5 minutes';

  // Handle wagmi ENS resolution
  useEffect(() => {
    console.log("Wagmi ENS Address:", wagmiEnsAddress);
    console.log("Wagmi ENS Loading:", isWagmiLoading);
    console.log("Wagmi ENS Error:", isWagmiError);
    if (wagmiError) console.log("Wagmi ENS Error details:", wagmiError);
    
    if (wagmiEnsAddress && recipient.endsWith('.eth')) {
      console.log('ENS resolved via wagmi:', wagmiEnsAddress);
      setEnsAddress(wagmiEnsAddress);
      setIsResolvingEns(false);
    } else if (isWagmiError && recipient.endsWith('.eth')) {
      console.log('Wagmi ENS resolution failed, trying fallback...');
      // Try fallback methods when wagmi fails
      resolveEnsToAddress(recipient);
    }
  }, [wagmiEnsAddress, isWagmiLoading, isWagmiError, wagmiError, recipient]);





  // Fallback ENS resolution function (same as TopNavigation)
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

  // Resolve ENS to address - API fallback (used when wagmi fails)
  const resolveEnsToAddress = async (ensName: string) => {
    if (!ensName.endsWith('.eth')) return '';
    
    setIsResolvingEns(true);
    try {
      // Use API fallback
      console.log('Wagmi failed, trying API fallback...');
      const response = await fetch(`http://localhost:5000/api/ens/${ensName}`);
      if (response.ok) {
        const data = await response.json();
        console.log('ENS resolved via API fallback:', data.eth_address);
        setEnsAddress(data.eth_address);
        return data.eth_address;
      }
      return '';
    } catch (error) {
      console.error('ENS resolution failed:', error);
      return '';
    } finally {
      setIsResolvingEns(false);
    }
  };

  // Handle recipient input change
  const handleRecipientChange = async (value: string) => {
  setRecipient(value);
  setError(''); // Clear previous errors

  if (value.endsWith('.eth')) {
      // It's an ENS name - wagmi will handle resolution automatically
      // The useEffect above will handle the wagmi result
      setIsResolvingEns(isWagmiLoading);
  } else if (value.startsWith('0x') && value.length === 42) {
    // It's already a raw Ethereum address
    setEnsAddress(value);
  } else if (value === '') {
    // Empty input
    setEnsAddress('');
  } else {
    // Invalid input (not ENS, not valid address)
    setEnsAddress('');
    if (value.length > 0) {
      setError('Please enter a valid Ethereum address or ENS name');
    }
  }
};

// Validation function - FIXED VERSION
const validateTransfer = () => {
  const finalRecipient = ensAddress; // This should contain the resolved address

  console.log('Validation - ensAddress:', ensAddress, 'recipient:', recipient);
  
  if (!finalRecipient || finalRecipient === '') {
    setError('Please enter a valid recipient address or ENS name');
    return false;
  }
  
  // Additional validation: check if it's a valid Ethereum address format
  if (!finalRecipient.startsWith('0x') || finalRecipient.length !== 42) {
    setError('Invalid recipient address format');
    return false;
  }
  
  if (!amount || parseFloat(amount) <= 0) {
    setError('Please enter a valid amount');
    return false;
  }
  if (parseFloat(amount) > selectedToken.balance) {
    setError('Insufficient balance');
    return false;
  }
  if (!isConnected) {
    setError('Please connect your wallet');
    return false;
  }
  setError('');
  return true;
};


  // Fetch balances for all tokens
  const updateTokenBalances = async () => {
    if (!isConnected || !address) return;
    
    setLoadingBalances(true);
    try {
      const updatedTokens = await Promise.all(
        tokens.map(async (token) => {
          try {
            let balance;
            if (token.id === 1) {
             const  balanceWei = await fetchBalance(token.address || '');
           balance = balanceWei ? roundToTwoDecimalPlaces(balanceWei) : 0;
            } else {
              // For ERC20 tokens, use fetchBalance
              const balanceWei = await fetchBalance(token.address || '');
              balance = balanceWei ? roundToTwoDecimalPlaces(balanceWei) : 0;
            }
            return { ...token, balance };
          } catch (error) {
            console.error(`Error fetching balance for ${token.symbol}:`, error);
            return { ...token, balance: 0 };
          }
        })
      );
      
      setTokenList(updatedTokens);
      
      // Update selected token with new balance
      const updatedSelectedToken = updatedTokens.find(t => t.id === selectedToken.id);
      if (updatedSelectedToken) {
        setSelectedToken(updatedSelectedToken);
      }
    } catch (error) {
      console.error('Error updating token balances:', error);
    } finally {
      setLoadingBalances(false);
    }
  };

  // Fetch balances on component mount and when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      updateTokenBalances();
    }
  }, [isConnected, address]);


  // ENS resolution fallback (same pattern as TopNavigation)
  useEffect(() => {
    console.log('ENS useEffect triggered:', { recipient, resolvedENS });
    if (recipient && recipient.startsWith('0x') && recipient.length === 42) {
      console.log('Attempting to resolve ENS for address:', recipient);
      resolveAddressToENS(recipient).then(name => {
        console.log('ENS resolution result:', name);
        if (name) {
          setResolvedENS(name);
          console.log('Set resolvedENS to:', name);
        }
      });
    }
  }, [recipient]);

  const handleTokenSelect = (token: any) => {
    setSelectedToken(token);
    setIsTokenModalOpen(false);
  };


// Base Pay execution function
const executeBasePay = async () => {
  if (!validateTransfer()) return;

  const finalRecipient = ensAddress;
  console.log('Executing Base Pay to:', finalRecipient);
  
  setIsTransacting(true);
  setError('');

  try {
    // Use Base Pay for USDC payments
    const paymentId = await makeBasePayment(amount, finalRecipient, true); // true for testnet
    
    if (paymentId) {
      setTransactionHash(paymentId);
      setStep(3);
    } else {
      setError('Base Pay failed');
    }
  } catch (error: any) {
    console.error('Base Pay failed:', error);
    setError(`Base Pay failed: ${error.message || 'Unknown error'}`);
  } finally {
    setIsTransacting(false);
  }
};

 const executeTransfer = async () => {
  if (!validateTransfer()) return;

  const finalRecipient = ensAddress; // This should be the resolved 0x address

  console.log('Executing transfer to:', finalRecipient);
  console.log('Original recipient input was:', recipient);
  
  setIsTransacting(true);
  setError('');

  try {
    let txHash;

    if (selectedToken.id === 1) {
      // Native ETH transfer - use provider directly
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: finalRecipient, // This will be the resolved 0x address
        value: ethers.parseEther(amount.toString())
      });
      txHash = tx.hash;
      await tx.wait();
    } else {
      // ERC20 token transfer using contract instances
      let contractInstance;

      // Use AFRISTABLE_CONTRACT_INSTANCE for AFRC token, TEST_TOKEN_CONTRACT_INSTANCE for others
      if (selectedToken.symbol === 'AFX') {
        contractInstance = await AFRISTABLE_CONTRACT_INSTANCE();
      } else {
        contractInstance = await TEST_TOKEN_CONTRACT_INSTANCE(selectedToken.address || '');
      }

      if (!contractInstance) {
        throw new Error('Contract instance not available');
      }

      // Convert amount to wei (assuming 18 decimals)
      const transferAmount = ethers.parseUnits(amount.toString(), 18);
     
      const tx = await contractInstance.transfer(finalRecipient, transferAmount); // Using resolved address
      txHash = tx.hash;
      await tx.wait();
    }

    setTransactionHash(txHash);
    
    // Refresh balances after successful transfer
    await updateTokenBalances();
    
    setStep(3);
  } catch (error: any) {
    console.error('Transaction failed:', error);
    if (error.code === 4001) {
      setError('Transaction rejected by user');
    } else if (error.code === -32603) {
      setError('Transaction failed - insufficient funds for gas');
    } else {
      setError(`Transaction failed: ${error.message || 'Unknown error'}`);
    }
  } finally {
    setIsTransacting(false);
  }
};

  const handleSend = () => {
    if (step === 1 && validateTransfer()) {
      setStep(2);
    } else if (step === 2) {
      if (paymentMethod === 'base') {
        executeBasePay();
      } else {
      executeTransfer();
      }
    }
  };

  const resetForm = () => {
    setStep(1);
    setRecipient('');
    setEnsAddress('');
    setAmount('');
    setError('');
    setTransactionHash('');
  };

  // Success Screen
  if (step === 3) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center bg-gradient-card border-border/20 shadow-glass">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Payment Sent Successfully!</h2>
          <p className="text-muted-foreground mb-6">
            Your transfer of {amount} {selectedToken.symbol} has been successfully sent to {recipient}
          </p>
          <div className="bg-background/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-2">Transaction Hash</p>
            <p className="font-mono text-sm break-all">{transactionHash}</p>
          </div>
          <Button onClick={resetForm} className="bg-primary hover:bg-primary/90">
            Send Another Payment
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Cross-Border Payments</h1>
        <p className="text-muted-foreground">Send money across Africa with stablecoins. Fast, secure, and low-cost.</p>
      </div>

      {/* Wallet Connection Warning */}
      {!isConnected && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-yellow-800 font-medium">Wallet not connected</p>
              <p className="text-yellow-600 text-sm">Please connect your wallet to send tokens</p>
            </div>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </Card>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          1
        </div>
        <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          2
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Send Money Form */}
        <Card className="lg:col-span-2 p-6 bg-gradient-card border-border/20 shadow-glass">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Send Money</h2>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              {/* Token Selection */}
              <div className="space-y-2">
                <Label>Select Token</Label>
                <div 
                  onClick={() => setIsTokenModalOpen(true)}
                  className="flex items-center justify-between p-3 border border-border/20 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {selectedToken.img && (
                      <img src={selectedToken.img} alt={selectedToken.symbol} className="w-8 h-8 rounded-full" />
                    )}
                    <div>
                      <div className="font-medium">{selectedToken.symbol}</div>
                      <div className="text-sm text-muted-foreground">{selectedToken.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {loadingBalances ? 'Loading...' : selectedToken.balance}
                    </div>
                    <div className="text-sm text-muted-foreground">Balance</div>
                  </div>
                </div>
              </div>

              {/* Amount and Recipient */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount to Send</Label>
                  <div className="relative">
                    <Input 
                      id="amount" 
                      placeholder="0.00" 
                      className="pl-8"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      max={selectedToken.balance}
                      step="0.000001"
                    />
                    <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Available: {loadingBalances ? 'Loading...' : selectedToken.balance} {selectedToken.symbol}
                    {!loadingBalances && (
                      <button
                        onClick={updateTokenBalances}
                        className="ml-2 text-primary hover:text-primary/80 text-xs underline"
                      >
                        Refresh
                      </button>
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Address/ENS</Label>
                  <div className="relative">
                    <Input 
                      id="recipient" 
                      placeholder="mary.eth or 0x..." 
                      className="pl-8"
                      value={recipient}
                      onChange={(e) => handleRecipientChange(e.target.value)}
                    />
                    <User className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    {isResolvingEns && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  {ensAddress && (
                    <p className="text-xs text-muted-foreground">
                      Resolves to: {ensAddress}
                    </p>
                  )}
                  {resolvedENS && (
                    <p className="text-xs text-green-600">
                      ENS: {resolvedENS}
                    </p>
                  )}
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod('traditional')}
                      className={`p-3 rounded-lg border transition-colors ${
                        paymentMethod === 'traditional'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/20 hover:border-primary/50'
                      }`}
                    >
                      <div className="text-sm font-medium">Traditional</div>
                      <div className="text-xs text-muted-foreground">ETH & Tokens</div>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('base')}
                      className={`p-3 rounded-lg border transition-colors ${
                        paymentMethod === 'base'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/20 hover:border-primary/50'
                      }`}
                    >
                      <div className="text-sm font-medium">Base Pay</div>
                      <div className="text-xs text-muted-foreground">USDC on Base</div>
                    </button>
                  </div>
                  {paymentMethod === 'base' && !isBaseSignedIn && (
                    <div className="mt-3">
                      <BaseSignInButton 
                        onSuccess={() => console.log('Base sign in successful')}
                        onError={(error) => setError(error)}
                        size="sm"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Preview */}
              {amount && (
                <Card className="p-4 bg-background/50 border-border/10">
                  <h3 className="font-medium mb-3">Transaction Preview</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span className="font-medium">
                        {paymentMethod === 'base' ? 'Base Pay (USDC)' : 'Traditional'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Send Amount</span>
                      <span>{amount} {paymentMethod === 'base' ? 'USDC' : selectedToken.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network Fee</span>
                      <span>
                        {paymentMethod === 'base' ? 'Gasless' : `${transactionFee} ETH`}
                      </span>
                    </div>
                    <div className="border-t border-border/10 pt-2 flex justify-between font-medium">
                      <span>Recipient receives</span>
                      <span>{amount} {paymentMethod === 'base' ? 'USDC' : selectedToken.symbol}</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Send Button */}
              <Button 
                className="w-full bg-primary hover:bg-primary/90" 
                size="lg" 
                onClick={handleSend}
                disabled={
                  !recipient || 
                  !amount || 
                  (paymentMethod === 'traditional' && !isConnected) ||
                  (paymentMethod === 'base' && !isBaseSignedIn)
                }
              >
                <span>
                  {paymentMethod === 'base' ? 'Pay with Base' : 'Continue'}
                </span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/10">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Zap className="h-5 w-5 text-accent" />
                  </div>
                  <div className="text-sm font-medium">Instant</div>
                  <div className="text-xs text-muted-foreground">&lt; 30 seconds</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Shield className="h-5 w-5 text-accent" />
                  </div>
                  <div className="text-sm font-medium">Secure</div>
                  <div className="text-xs text-muted-foreground">Encrypted</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <DollarSign className="h-5 w-5 text-accent" />
                  </div>
                  <div className="text-sm font-medium">Low Cost</div>
                  <div className="text-xs text-muted-foreground">0.25% fee</div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Confirm Transfer</h2>
              
              <Card className="p-6 bg-background/50">
                <h3 className="font-semibold mb-4">Transfer Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From</span>
                    <span className="font-medium font-mono text-sm">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To</span>
                    <span className="font-medium font-mono text-sm">
                      {recipient}
                      {ensAddress && (
                        <div className="text-xs text-muted-foreground">
                          {ensAddress.slice(0, 6)}...{ensAddress.slice(-4)}
                        </div>
                      )}
                      {resolvedENS && (
                        <div className="text-xs text-green-600">
                          ENS: {resolvedENS}
                        </div>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-medium">
                      {paymentMethod === 'base' ? 'Base Pay (USDC)' : 'Traditional'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Token</span>
                    <span className="font-medium">
                      {paymentMethod === 'base' ? 'USD Coin (USDC)' : `${selectedToken.name} (${selectedToken.symbol})`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">
                      {amount} {paymentMethod === 'base' ? 'USDC' : selectedToken.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network fee (estimated)</span>
                    <span className="font-medium">
                      {paymentMethod === 'base' ? 'Gasless' : `${transactionFee} ETH`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated time</span>
                    <span className="font-medium flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {paymentMethod === 'base' ? 'Instant' : estimatedTime}
                    </span>
                  </div>
                </div>
              </Card>

              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isTransacting}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={isTransacting}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isTransacting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    paymentMethod === 'base' ? 'Pay with Base' : 'Confirm & Send'
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Exchange Rates & History */}
        <div className="space-y-6">
          {/* Exchange Rates */}
          <Card className="p-6 bg-gradient-card border-border/20 shadow-glass">
            <div className="flex items-center gap-3 mb-4">
              <ArrowDownUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Live Exchange Rates</h3>
            </div>
            <div className="space-y-3">
              {[
                { from: "cUSD", to: "cGHS", rate: "15.38", change: "+0.15%" },
                { from: "cUSD", to: "cZAR", rate: "18.52", change: "-0.08%" },
                { from: "cGHS", to: "cZAR", rate: "1.20", change: "+0.23%" }
              ].map((rate, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{rate.from}/{rate.to}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{rate.rate}</div>
                    <Badge variant={rate.change.startsWith('+') ? 'default' : 'secondary'} className="text-xs">
                      {rate.change}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Transactions */}
          <Card className="p-6 bg-gradient-card border-border/20 shadow-glass">
            <div className="flex items-center gap-3 mb-4">
              <History className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Recent Transfers</h3>
            </div>
            <div className="space-y-3">
              {[
                { recipient: "mary.eth", amount: "200", currency: "cUSD", status: "completed", time: "2h ago" },
                { recipient: "john.eth", amount: "50", currency: "cGHS", status: "pending", time: "1d ago" },
                { recipient: "sarah.eth", amount: "150", currency: "cUSD", status: "completed", time: "3d ago" }
              ].map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div>
                    <div className="font-medium text-sm">{tx.recipient}</div>
                    <div className="text-xs text-muted-foreground">{tx.time}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{tx.amount} {tx.currency}</div>
                    <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              View All Transactions
            </Button>
          </Card>

          {/* Supported Countries */}
          <Card className="p-6 bg-gradient-card border-border/20 shadow-glass">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Supported Countries</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["🇬🇭 Ghana", "🇳🇬 Nigeria", "🇿🇦 South Africa", "🇰🇪 Kenya", "🇺🇬 Uganda", "🇹🇿 Tanzania"].map((country) => (
                <div key={country} className="text-sm p-2 rounded bg-background/50 text-center">
                  {country}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Token Selection Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsTokenModalOpen(false)}>
          <Card className="w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Token</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsTokenModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {tokenList.map(token => (
                <div
                  key={token.id}
                  onClick={() => handleTokenSelect(token)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-background/50 cursor-pointer transition-colors"
                >
                  {token.img && (
                    <img src={token.img} alt={token.symbol} className="w-10 h-10 rounded-full" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-sm text-muted-foreground">{token.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {loadingBalances ? 'Loading...' : token.balance}
                    </div>
                    <div className="text-sm text-muted-foreground">Balance</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}