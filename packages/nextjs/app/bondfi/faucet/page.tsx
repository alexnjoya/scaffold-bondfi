"use client";
import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Settings, Info, X, Droplets, Plus, DollarSign } from 'lucide-react';
import tokens from '@/lib/Tokens/tokens';
import { addTokenToMetamask } from '@/lib/utils.ts';
import { useContractInstances } from '@/provider/ContractInstanceProvider';
import { roundToTwoDecimalPlaces, roundToFiveDecimalPlaces } from '@/lib/utils';
import { Button } from "~~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/card";
import { Input } from "~~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~~/components/ui/select";
import { Badge } from "~~/components/ui/badge";
import { Loader } from "lucide-react";

export default function FaucetPage() {
  const { isConnected, TEST_TOKEN_CONTRACT_INSTANCE, fetchBalance, address } = useContractInstances();
 
  const [fromToken, setFromToken] = useState('AFR');
  const [isFaucet, setFaucet] = useState(false);
  const [toToken, setToToken] = useState('AFR');
  const token1Address = tokens.find(t => t.symbol === fromToken)?.address;
  const token2Address = tokens.find(t => t.symbol === toToken)?.address;

  const [token1Amount, setToken1Amount] = useState<string>("");
  const [Bal1, setBal1] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching balances and rates...', token1Address, token2Address);
        const bal1 = await fetchBalance(token1Address);
     
        const roundedBal1 = bal1 ? roundToTwoDecimalPlaces(bal1) : 0;
        
        setBal1(roundedBal1);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [isConnected, fromToken, Bal1, token1Address, token2Address, fetchBalance, isFaucet]);

  const getFaucet = async () => {
    try {
      const TOKEN_CONTRACT = await TEST_TOKEN_CONTRACT_INSTANCE(token1Address);
      const GET_FAUCET = await TOKEN_CONTRACT.faucet(token1Amount);
      setFaucet(true);
      console.log(`Loading - ${GET_FAUCET.hash}`);
      await GET_FAUCET.wait();
      console.log(`Success - ${GET_FAUCET.hash}`);
      setFaucet(false);
    } catch (error) {
      setFaucet(false);
      console.log(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Token Faucet</h1>
        <p className="text-gray-600">Get testnet tokens for testing the BondFi platform</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Main Faucet Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Request Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Token Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Select Token</label>
                <Select value={fromToken} onValueChange={setFromToken}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    {tokens
                      .filter(token => token.symbol !== 'ETH' && token.symbol !== 'AFX')
                      .map(token => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{token.symbol}</span>
                            <span className="text-sm text-gray-500">{token.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    disabled={!isConnected}
                    value={token1Amount}
                    onChange={(e) => setToken1Amount(e.target.value)}
                    placeholder="0.0"
                    className="text-2xl font-semibold pr-20"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Badge variant="secondary" className="text-sm">
                      {fromToken}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Max Faucet: 100 {fromToken}
                </p>
              </div>

              {/* Balance Display */}
              {address && !isNaN(Bal1) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Balance</span>
                    <span className="font-medium">
                      {Bal1} {fromToken}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  disabled={!isConnected || !token1Amount || isFaucet}
                  onClick={getFaucet}
                  className="w-full"
                  size="lg"
                >
                  {isFaucet ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Getting Faucet...
                    </>
                  ) : (
                    <>
                      <Droplets className="h-4 w-4 mr-2" />
                      Get Faucet
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => addTokenToMetamask(token1Address, fromToken, 18)}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Metamask
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* How it Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                How it Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Select Token</h4>
                  <p className="text-sm text-gray-600">Choose the testnet token you want to receive</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-green-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Enter Amount</h4>
                  <p className="text-sm text-gray-600">Specify how many tokens you need (max 100)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-purple-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Get Tokens</h4>
                  <p className="text-sm text-gray-600">Click "Get Faucet" to receive your testnet tokens</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Available Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tokens
                  .filter(token => token.symbol !== 'ETH' && token.symbol !== 'AFX')
                  .map(token => (
                    <div key={token.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-sm text-gray-600">{token.name}</div>
                      </div>
                      <Badge variant="outline">
                        {token.symbol === fromToken ? 'Selected' : 'Available'}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Wallet Connected</span>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
              {address && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs font-mono">
                  {address}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
