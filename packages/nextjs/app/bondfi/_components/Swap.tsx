"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "~~/components/ui/card";
import { Button } from "~~/components/ui/button";
import { Input } from "~~/components/ui/input";
import { Badge } from "~~/components/ui/badge";
import { 
  ArrowLeftRight, 
  ArrowUpDown, 
  Settings, 
  Info,
  TrendingUp,
  Clock,
  Zap,
  X,
  ChevronDown
} from "lucide-react";
import tokens from '@/lib/Tokens/tokens';
import { ethers, formatEther, parseEther } from 'ethers';
import { useContractInstances } from '@/provider/ContractInstanceProvider';
import { CONTRACT_ADDRESSES } from '@/provider/ContractInstanceProvider';
import { roundToSevenDecimalPlaces } from '@/lib/utils';

const roundToTwoDecimalPlaces = (num: any) => {
  return Math.round(num * 10000) / 10000;
};

const roundToFiveDecimalPlaces = (num: any) => {
  return Math.round(num * 100000) / 100000;
};

// Token Selection Modal Component
const TokenSelectionModal = ({ isOpen, onClose, tokens, onTokenSelect, selectedToken, title }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          {tokens.map((token: any) => (
            <button
              key={token.symbol}
              onClick={() => onTokenSelect(token.symbol)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                selectedToken === token.symbol ? 'bg-blue-50 border border-blue-200' : ''
              }`}
            >
              {token.img && (
                <img
                  src={token.img}
                  alt={token.symbol}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1 text-left">
                <div className="font-medium">{token.name || token.symbol}</div>
                <div className="text-sm text-gray-500">{token.symbol}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export function Swap() {
  const { isConnected, SWAP_CONTRACT_INSTANCE, PRICEAPI_CONTRACT_INSTANCE, TEST_TOKEN_CONTRACT_INSTANCE, fetchBalance, address } = useContractInstances();
  
  // Token selection states
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('AFR');
  const [showFromTokenModal, setShowFromTokenModal] = useState(false);
  const [showToTokenModal, setShowToTokenModal] = useState(false);
  
  // Amount states
  const [token1Amount, setToken1Amount] = useState<string | null>(null);
  const [token2Amount, setToken2Amount] = useState<number | null>(null);
  
  // Settings states
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [deadline, setDeadline] = useState(20);
  const [autoRouter, setAutoRouter] = useState(true);
  
  // Transaction states
  const [isApproveOne, setApproveOne] = useState(false);
  const [hasApprovedOne, setHasApprovedOne] = useState(false);
  const [isSwapping, setSwapping] = useState(false);
  const [isEstimateAmount2, setEstimatedAmount2] = useState(false);
  
  // Balance and rate states
  const [Bal1, setBal1] = useState(0);
  const [Bal2, setBal2] = useState(0);
  const [dollarRate, setDollarRate] = useState<string | null>(null);
  const [baseTwoRate, setBaseTwoRate] = useState<string | null>(null);
  const [AmountOneInWei, setAmountOneInWei] = useState('');
  const [AmountTwoRate, setAmountTwoRate] = useState<string | null>(null);
  const [poolPrices, setPoolPrices] = useState<{ [key: string]: string }>({});
  
  // Pool balance states
  const [poolBal1, setPoolBal1] = useState(0);
  const [poolBal2, setPoolBal2] = useState(0);
  
  // Get token addresses
  const token1Address = tokens.find(t => t.symbol === fromToken)?.address;
  const token2Address = tokens.find(t => t.symbol === toToken)?.address;

  // Get all liquidity pools
  const getAllLiquidityPools = () => {
    const pools: string[] = [];
    tokens.forEach(token => {
      if (Array.isArray(token.pool)) {
        token.pool.forEach(poolToken => {
          const pair = `${token.symbol}/${poolToken}`;
          const reversePair = `${poolToken}/${token.symbol}`;
          if (!pools.includes(pair) && !pools.includes(reversePair)) {
            pools.push(pair);
          }
        });
      }
    });
    return pools;
  };

  // Filter tokens to exclude selected token from opposite dropdown
  const getAvailableTokens = (selectedToken: any, isFromToken = true) => {
    if (isFromToken) {
      return tokens.filter(token => token.symbol !== selectedToken);
    } else {
      const fromTokenData = tokens.find(token => token.symbol === selectedToken);
      
      if (!fromTokenData || !fromTokenData.pool || fromTokenData.pool.length === 0) {
        return [];
      }
      
      return tokens.filter(token => 
        fromTokenData.pool.includes(token.symbol)
      );
    }
  };

  // Handle token selection
  const handleFromTokenChange = (newFromToken: any) => {
    setFromToken(newFromToken);
    setShowFromTokenModal(false);
    
    const availableToTokens = getAvailableTokens(newFromToken, false);
    
    if (availableToTokens.length > 0 && !availableToTokens.some(token => token.symbol === toToken)) {
      setToToken(availableToTokens[0].symbol);
    } else if (availableToTokens.length === 0) {
      setToToken('');
    }
  };

  const handleToTokenChange = (newToToken: any) => {
    setToToken(newToToken);
    setShowToTokenModal(false);
  };

  // Fetch pool prices
  useEffect(() => {
    const fetchPrices = async () => {
      const pools = getAllLiquidityPools();
      const prices: { [key: string]: string } = {};

      for (const pool of pools) {
        const [token1Symbol, token2Symbol] = pool.split("/");
        const token1Address = tokens.find(t => t.symbol === token1Symbol)?.address;
        const token2Address = tokens.find(t => t.symbol === token2Symbol)?.address;
        const TokenAmountInWei = ethers.parseEther("1");

        if (token1Address && token2Address) {
          try {
            const swapContract = await SWAP_CONTRACT_INSTANCE();
            if (swapContract) {
            const rate = await swapContract.estimate(
              token1Address,
              token2Address,
              TokenAmountInWei
            );
            const f_rate = ethers.formatEther(rate);
            prices[pool] = parseFloat(f_rate).toFixed(2);
            }
          } catch (error) {
            console.error(`Failed to fetch price for ${pool}:`, error);
            prices[pool] = "Error";
          }
        } else {
          prices[pool] = "Unknown Tokens";
        }
      }

      setPoolPrices(prices);
    };

    if (isConnected) {
      fetchPrices();
    }
  }, [isConnected, SWAP_CONTRACT_INSTANCE]);

  // Fetch balances and rates
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isConnected || !token1Address || !token2Address) return;
        
        const bal1 = await fetchBalance(token1Address);
        const bal2 = await fetchBalance(token2Address);
        const roundedBal1 = roundToTwoDecimalPlaces(bal1);
        const roundedBal2 = roundToTwoDecimalPlaces(bal2);
        
        setBal1(roundedBal1);
        setBal2(roundedBal2);
        
        const PRICE_CONTRACT = await PRICEAPI_CONTRACT_INSTANCE();
        if (PRICE_CONTRACT) {
        const dollarRate = await PRICE_CONTRACT.getLatestPrice(token1Address);
        const formattedDollarRate = ethers.formatEther(dollarRate);
        setDollarRate(formattedDollarRate);
        }
        
        // Fetch pool balances
        const SWAP_CONTRACT = await SWAP_CONTRACT_INSTANCE();
        if (SWAP_CONTRACT) {
          const [poolBalance1, poolBalance2] = await SWAP_CONTRACT.getPoolSize(token1Address, token2Address);
          const s_poolBal1 = formatEther(poolBalance1);
          const s_poolBal2 = formatEther(poolBalance2);
          console.log('Pool Balances:', s_poolBal1, s_poolBal2);
          
          setPoolBal1(Number(roundToSevenDecimalPlaces(s_poolBal1)));
          setPoolBal2(Number(roundToSevenDecimalPlaces(s_poolBal2)));
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [isConnected, isSwapping, fromToken, toToken, token1Amount, token2Amount, address]);

  // Calculate amount2
  const calculateAmount2 = async () => {
    if (token1Amount !== null && token1Address && token2Address) {
      setEstimatedAmount2(true);
      const PRICE_CONTRACT = await PRICEAPI_CONTRACT_INSTANCE();
      const TokenAmountInWei: any = ethers.parseEther(token1Amount);

      try {
        if (PRICE_CONTRACT) {
        const rate = await PRICE_CONTRACT.estimate(
          token1Address,
          token2Address,
          TokenAmountInWei
        );
        
        const f_rate: any = ethers.formatEther(rate);
        const swapFee = (20 / 1000) * f_rate;
        const amountTwoToReceive = f_rate - swapFee;
        const roundedAmount = parseFloat(amountTwoToReceive.toFixed(9));
        
        setToken2Amount(roundedAmount);
        setAmountOneInWei(TokenAmountInWei);

        // Estimating two to one
        const Amount2InWei = ethers.parseEther("1");
        const rateToExchangeTwotoOne = await PRICE_CONTRACT.estimate(
          token2Address,
          token1Address,
          Amount2InWei
        );
        const formattedTwoRate = ethers.formatEther(rateToExchangeTwotoOne);
        setBaseTwoRate(formattedTwoRate);
        setAmountTwoRate(rateToExchangeTwotoOne);
        }
      } catch (error) {
        console.error(error);
        setToken2Amount(null);
      } finally {
        setEstimatedAmount2(false);
      }
    } else {
      setToken2Amount(null);
      setEstimatedAmount2(false);
    }
  };

  useEffect(() => {
    calculateAmount2();
  }, [token1Amount, fromToken, toToken]);

  // Handle amount input
  const handleAmountChange = (e: any) => {
    const newValue = e.target.value;
    setToken1Amount(newValue);
  };

  // Approve token
  const ApproveTokenOne = async () => {
    try {
      if (!token1Address) return;
      const TEST_TOKEN_CONTRACT = await TEST_TOKEN_CONTRACT_INSTANCE(token1Address);
      if (TEST_TOKEN_CONTRACT) {
      const approveSpending = await TEST_TOKEN_CONTRACT.approve(CONTRACT_ADDRESSES.swapAddress, AmountOneInWei);
      setApproveOne(true);
      await approveSpending.wait();
      setApproveOne(false);
      setHasApprovedOne(true);
      }
    } catch (error) {
      setApproveOne(false);
      console.log(error);
    }
  };

  // Swap tokens
  const SwapToken = async () => {
    if (fromToken == 'ETH') {
      try {
        const SWAP_CONTRACT = await SWAP_CONTRACT_INSTANCE();
        if (SWAP_CONTRACT) {
        const SWAP = await SWAP_CONTRACT.swap(token1Address, token2Address, AmountOneInWei, {
          value: AmountOneInWei
        });
        setSwapping(true);
        await SWAP.wait();
        setSwapping(false);
        setHasApprovedOne(false);
        setApproveOne(false);
        setToken1Amount(null);
        setToken2Amount(null);
        }
      } catch (error) {
        setSwapping(false);
        setHasApprovedOne(false);
        setApproveOne(false);
        setToken1Amount(null);
        setToken2Amount(null);
        console.log(error);
      }
    } else {
      try {
        const SWAP_CONTRACT = await SWAP_CONTRACT_INSTANCE();
        if (SWAP_CONTRACT) {
        const SWAP = await SWAP_CONTRACT.swap(token1Address, token2Address, AmountOneInWei);
        setSwapping(true);
        await SWAP.wait();
        setSwapping(false);
        setHasApprovedOne(false);
        setApproveOne(false);
        setToken1Amount(null);
        setToken2Amount(null);
        }
      } catch (error) {
        setSwapping(false);
        setHasApprovedOne(false);
        setApproveOne(false);
        setToken1Amount(null);
        setToken2Amount(null);
        console.log(error);
      }
    }
  };

  // Handle max amount
  const handleFromAmountChange = () => {
    setToken1Amount(Bal1.toString());
  };

  // Swap tokens positions
  const swapTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setToken1Amount(null);
    setToken2Amount(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Token Swap</h1>
        <p className="text-muted-foreground">Exchange tokens instantly with the best rates across African stablecoins.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Swap Interface */}
        <Card className="lg:col-span-2 p-6 bg-gradient-card border-border/20 shadow-glass">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Swap Tokens</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-6 p-4 bg-background/50 rounded-xl border border-border/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Swap Settings</h3>
                <button onClick={() => setShowSettings(false)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Slippage Tolerance</label>
                  <div className="flex space-x-2 mb-2">
                    {[0.1, 0.5, 1.0].map(value => (
                      <Button
                        key={value}
                        variant={slippage === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSlippage(value)}
                      >
                        {value}%
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    value={slippage}
                    onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                    placeholder="Custom %"
                    step="0.1"
                    min="0.1"
                    max="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Transaction Deadline</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={deadline}
                      onChange={(e) => setDeadline(parseInt(e.target.value) || 20)}
                      className="flex-1"
                      min="1"
                      max="4320"
                    />
                    <span className="text-muted-foreground text-sm">minutes</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Auto Router</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoRouter(!autoRouter)}
                    className={autoRouter ? 'bg-primary text-primary-foreground' : ''}
                  >
                    {autoRouter ? 'ON' : 'OFF'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* From Token */}
            <div className="p-4 rounded-lg bg-background/50 border border-border/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">From</span>
                {address && !isNaN(Bal1) && (
                  <span className="text-sm text-muted-foreground">
                    Balance: {Bal1} {fromToken}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFromTokenModal(true)}
                  className="flex items-center gap-3 hover:bg-background/50 p-2 rounded-lg transition-colors"
                >
                  {tokens.find(t => t.symbol === fromToken)?.img && (
                    <img
                      src={tokens.find(t => t.symbol === fromToken)?.img}
                      alt={fromToken}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <div className="font-medium">{tokens.find(t => t.symbol === fromToken)?.name || fromToken}</div>
                    <div className="text-xs text-muted-foreground">{fromToken}</div>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="flex-1 text-right">
                  <Input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    disabled={!isConnected}
                    value={token1Amount || ''}
                    onChange={handleAmountChange}
                    className="text-right text-xl font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0"
                    placeholder="0.0"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
              <button
                onClick={handleFromAmountChange}
                  className="text-primary text-sm hover:underline"
              >
                Max
              </button>
                {isConnected && poolBal1 > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Pool: {poolBal1} {fromToken}
                  </span>
                )}
              </div>
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center">
              <Button variant="outline" size="sm" className="rounded-full p-2 h-auto" onClick={swapTokens}>
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>

            {/* To Token */}
            <div className="p-4 rounded-lg bg-background/50 border border-border/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">To</span>
                {address && !isNaN(Bal2) && (
                  <span className="text-sm text-muted-foreground">
                    Balance: {Bal2} {toToken}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowToTokenModal(true)}
                  className="flex items-center gap-3 hover:bg-background/50 p-2 rounded-lg transition-colors"
                  disabled={getAvailableTokens(fromToken, false).length === 0}
                >
                  {tokens.find(t => t.symbol === toToken)?.img && (
                    <img
                      src={tokens.find(t => t.symbol === toToken)?.img}
                      alt={toToken}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <div className="font-medium">{tokens.find(t => t.symbol === toToken)?.name || toToken}</div>
                    <div className="text-xs text-muted-foreground">{toToken}</div>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="flex-1 text-right">
                  <div className="text-xl font-semibold text-muted-foreground">
                    {token2Amount !== null ? token2Amount : '0.0'}
                  </div>
                </div>
              </div>
              {isConnected && poolBal2 > 0 && (
                <div className="flex justify-end mt-2">
                  <span className="text-xs text-muted-foreground">
                    Pool: {poolBal2} {toToken}
                  </span>
                </div>
              )}
            </div>

            {/* Swap Details */}
            {token1Amount && (
              <Card className="p-4 bg-background/30 border-border/10">
                <div className="space-y-2 text-sm">
                  {address && baseTwoRate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exchange Rate</span>
                      <span>1 {toToken} = {baseTwoRate} {fromToken}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slippage Tolerance</span>
                    <span>{slippage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network Fee</span>
                    <span>~$0.001</span>
                  </div>
                  {isConnected && token2Amount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minimum Received</span>
                      <span>{(token2Amount * (1 - slippage / 100)).toFixed(6)} {toToken}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Approve Button */}
            {fromToken !== 'ETH' && (
              <Button
                onClick={ApproveTokenOne}
                disabled={isApproveOne || hasApprovedOne || !token1Amount}
                className="w-full shadow-glow"
                size="lg"
              >
                {isApproveOne ? 'Approving...' : 
                 hasApprovedOne ? '✓ Approved' : 
                 `Approve ${fromToken}`}
              </Button>
            )}

            {/* Swap Button */}
            <Button
              onClick={SwapToken}
              disabled={
                !isConnected ||
                !token1Amount ||
                parseFloat(token1Amount) <= 0 ||
                isSwapping ||
                (fromToken !== 'ETH' && !hasApprovedOne)
              }
              className="w-full shadow-glow"
              size="lg"
            >
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              {!isConnected
                ? 'Connect Wallet'
                : isSwapping
                ? 'Swapping...'
                : !token1Amount
                ? 'Enter amount'
                : fromToken !== 'ETH' && !hasApprovedOne
                ? `Approve ${fromToken} First`
                : 'Swap Tokens'}
            </Button>

            {/* Info Banner */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <Info className="h-4 w-4 text-accent" />
              <div className="text-sm">
                <span className="font-medium text-accent">Pro Tip:</span>
                <span className="text-muted-foreground ml-1">Large swaps get better rates. Consider batching your transactions.</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Market Info Sidebar */}
        <div className="space-y-6">
          {/* Live Exchange Rates */}
          <Card className="p-6 bg-gradient-card border-border/20 shadow-glass">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Live Exchange Rates</h3>
            </div>
            {isConnected && (
              <div className="space-y-2">
                {Object.entries(poolPrices).map(([pool, price]) => (
                  <div key={pool} className="flex justify-between items-center">
                    <span className="text-muted-foreground">{pool}</span>
                    <span className="font-medium">{price}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Swaps */}
          <Card className="p-6 bg-gradient-card border-border/20 shadow-glass">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Recent Swaps</h3>
            </div>
            <div className="space-y-3">
              {[
                { from: "ETH", to: "AFR", amount: "50", time: "2m ago" },
                { from: "AFR", to: "USDC", amount: "200", time: "15m ago" },
                { from: "USDC", to: "ETH", amount: "100", time: "1h ago" },
                { from: "BFI", to: "USDC", amount: "25", time: "2h ago" }
              ].map((swap, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-white text-xs">{swap.from.slice(0, 1)}</span>
                      </div>
                      <ArrowLeftRight className="h-3 w-3 mx-1 text-muted-foreground" />
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-white text-xs">{swap.to.slice(0, 1)}</span>
                      </div>
                    </div>
                    <span className="text-sm">{swap.amount} {swap.from}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{swap.time}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Swap Features */}
          <Card className="p-6 bg-gradient-card border-border/20 shadow-glass">
            <h3 className="font-semibold mb-4">Why Swap on BondFi?</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Lightning Fast</div>
                  <div className="text-xs text-muted-foreground">Instant swaps with no delays</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Best Rates</div>
                  <div className="text-xs text-muted-foreground">Aggregated liquidity for optimal pricing</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ArrowLeftRight className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Low Fees</div>
                  <div className="text-xs text-muted-foreground">Only 2% swap fee</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Token Selection Modals */}
      <TokenSelectionModal
        isOpen={showFromTokenModal}
        onClose={() => setShowFromTokenModal(false)}
        tokens={getAvailableTokens(toToken, true)}
        onTokenSelect={handleFromTokenChange}
        selectedToken={fromToken}
        title="Select From Token"
      />
<TokenSelectionModal
        isOpen={showToTokenModal}
        onClose={() => setShowToTokenModal(false)}
        tokens={getAvailableTokens(fromToken, false)}
        onTokenSelect={handleToTokenChange}
        selectedToken={toToken}
        title="Select To Token"
      />
    </div>
  );
}