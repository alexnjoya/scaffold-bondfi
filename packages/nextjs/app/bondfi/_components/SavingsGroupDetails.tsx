"use client";
import React, { useState, useEffect } from 'react';
import { Crown, UserPlus,Users, TrendingUp, Calendar, DollarSign, Clock, CheckCircle, Star, Shield, AlertCircle, Loader } from 'lucide-react';
import { CONTRACT_ADDRESSES, useContractInstances } from '@/provider/ContractInstanceProvider';
import tokens from '@/lib/Tokens/tokens';
import { Button } from "~~/components/ui/button";
import { Badge } from "~~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/card";
import { Progress } from "~~/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEnsName, useEnsAddress } from "wagmi";

interface GroupDetailsProps {
  id: string;
}

export function SavingsGroupDetails({ id }: GroupDetailsProps) {
  // State variables from SS.tsx
  const [contributionAmount, setContributionAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isContributing, setIsContributing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [group, setGroup] = useState<any>(null);
  const [groupSummary, setGroupSummary] = useState<any>(null);
  const [contributionStatus, setContributionStatus] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState<{addresses: string[], names: string[]}>({addresses: [], names: []});
  const [ensNames, setEnsNames] = useState<Record<string, string>>({});
  const [resolvedENS, setResolvedENS] = useState<Record<string, string>>({});

  // Contract instances
  const { SAVING_CONTRACT_INSTANCE, TEST_TOKEN_CONTRACT_INSTANCE, AFRISTABLE_CONTRACT_INSTANCE } = useContractInstances();

  // Primary ENS resolution using wagmi useEnsAddress hook
  const { data: wagmiEnsAddress, isError: isWagmiError, isLoading: isWagmiLoading, error: wagmiError } = useEnsAddress({
    name: group?.creator?.endsWith('.eth') ? group.creator : undefined,
    chainId: 11155111 // Base Sepolia Testnet chain ID
  });

  // Utility functions from SS.tsx
  const getSupportedTokens = () => {
    return tokens.filter(token => token.symbol !== 'ETH');
  };

  const formatTokenAmount = (amount: any, decimals: any = 18) => {
    if (!amount) return '0';
    const formatted = (Number(amount) / Math.pow(10, decimals)).toFixed(6);
    return parseFloat(formatted).toString();
  };

  const toWei = (amount: any, decimals: any = 18) => {
    return (Number(amount) * Math.pow(10, decimals)).toString();
  };

  const getTimeRemaining = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const now = Math.floor(Date.now() / 1000);
    const remaining = Number(timestamp) - now;
    if (remaining <= 0) return 'Expired';
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  // ENS resolution function - following TopNavigation pattern
  const resolveAddressToENS = async (address: string) => {
    if (!address || resolvedENS[address]) return;
    
    try {
      console.log('Fetching ENS for address:', address);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${apiUrl}/api/address/${address}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('ENS data received:', data);
        if (data.ens_name) {
          setResolvedENS(prev => ({ ...prev, [address]: data.ens_name }));
        }
      } else {
        console.warn('ENS API not available, skipping custom resolution:', response.status, response.statusText);
        // Don't treat this as an error, just skip custom resolution
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('ENS resolution timeout for address:', address);
      } else {
        console.warn('ENS resolution failed, skipping custom resolution:', error);
      }
      // Don't treat this as an error, just skip custom resolution
    }
  };

  // ENS resolution function - get ENS name for an address
  const getEnsName = (address: string) => {
    return resolvedENS[address] || null;
  };

  // Format ENS name - show full name
  const formatENS = (ensName: string) => {
    return ensName;
  };

  // Format Ethereum address - following TopNavigation pattern
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Initialize data function from SS.tsx
  const initializeData = async () => {
    try {
      setIsLoading(true);
      
      const Saving_Contract = await SAVING_CONTRACT_INSTANCE();
      if (!Saving_Contract) {
        setErrorMessage('Contract not available');
        return;
      }
      
      // Get group details (full group data)
      const groupData = await (Saving_Contract as any).getGroupDetails(id);
      setGroup(groupData);
      
      // Get group summary (includes current recipient, rounds, etc.)
      const summaryData = await (Saving_Contract as any).getGroupSummary(id);
      setGroupSummary(summaryData);
      
      // Get user's contribution status for this group
      const userAddress = await (Saving_Contract as any).getAddress?.() || 
                         (window as any).ethereum?.selectedAddress;
      if (userAddress) {
        const contributionStatusData = await (Saving_Contract as any).getUserContributionStatus(id, userAddress);
        setContributionStatus(contributionStatusData);
      }
      
      // Get group members with names
      const membersData = await (Saving_Contract as any).getGroupMembersWithNames(id);
      setGroupMembers({
        addresses: membersData[0] || [],
        names: membersData[1] || []
      });
      
      console.log('Group Data', groupData);
      console.log('Group Summary', summaryData);
      console.log('Contribution Status', contributionStatus);
      console.log('Group Members', membersData);
      
    } catch (error) {
      console.error('Error initializing data:', error);
      setErrorMessage('Failed to load group details');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler functions from SS.tsx
  const handleContribute = async () => {
    if (!contributionAmount) return;
    
    try {
      setIsContributing(true);
      setErrorMessage('');
      
      // Get token address from group data
      const tokenAddress = group?.token;
      if (!tokenAddress) {
        setErrorMessage('Token address not found');
        return;
      }
      
      // Convert amount to wei
      const amountInWei = toWei(contributionAmount);
      console.log('Amount in wei:', amountInWei);
      
      // Handle token approval - following SS.tsx pattern
      if (tokenAddress === '0xc5737615ed39b6B089BEDdE11679e5e1f6B9E768') {
        const AFRI_Contract = await AFRISTABLE_CONTRACT_INSTANCE();
        if (!AFRI_Contract) {
          setErrorMessage('AFRI Contract not available');
          return;
        }
        const tx = await AFRI_Contract.approve(CONTRACT_ADDRESSES.savingAddress, amountInWei);
        await tx.wait();
      } else {
        const TOKEN_Contract = await TEST_TOKEN_CONTRACT_INSTANCE(tokenAddress);
        if (!TOKEN_Contract) {
          setErrorMessage('Token Contract not available');
          return;
        }
        const tx = await TOKEN_Contract.approve(CONTRACT_ADDRESSES.savingAddress, amountInWei);
        await tx.wait();
      }
      
      // Call smart contract function - following SS.tsx pattern
      const Saving_Contract = await SAVING_CONTRACT_INSTANCE();
      if (!Saving_Contract) {
        setErrorMessage('Contract not available');
        return;
      }
      
      const tx = await (Saving_Contract as any).contribute(id);
      await tx.wait();
      
      setSuccessMessage('Contribution made successfully!');
      setContributionAmount('');
      
      // Refresh group data
      await initializeData();
      
    } catch (error: any) {
      console.error('Error contributing:', error);
      setErrorMessage(error.message || 'Failed to make contribution');
    } finally {
      setIsContributing(false);
    }
  };

  const handleClaimPayout = async () => {
    setIsClaiming(true);
    try {
      const Saving_Contract = await SAVING_CONTRACT_INSTANCE();
      if (!Saving_Contract) {
        setErrorMessage('Contract not available');
        return;
      }
      
      const tx = await (Saving_Contract as any).claimPayout(id);
      await tx.wait();
      
      setSuccessMessage('Payout claimed successfully!');
      
      // Refresh group data
      await initializeData();
      
    } catch (error: any) {
      console.error('Claim payout error:', error);
      setErrorMessage(error.message || 'Failed to claim payout');
    }
    setIsClaiming(false);
  };

  // Handle wagmi ENS resolution
  useEffect(() => {
    console.log("Wagmi ENS Address:", wagmiEnsAddress);
    console.log("Wagmi ENS Loading:", isWagmiLoading);
    console.log("Wagmi ENS Error:", isWagmiError);
    if (wagmiError) console.log("Wagmi ENS Error details:", wagmiError);
    
    if (wagmiEnsAddress && group?.creator?.endsWith('.eth')) {
      console.log('ENS resolved via wagmi:', wagmiEnsAddress);
      setResolvedENS(prev => ({ ...prev, [group.creator]: wagmiEnsAddress }));
    } else if (isWagmiError && group?.creator?.endsWith('.eth')) {
      console.log('Wagmi ENS resolution failed, trying fallback...');
      // Try fallback methods when wagmi fails
      resolveAddressToENS(group.creator);
    }
  }, [wagmiEnsAddress, isWagmiLoading, isWagmiError, wagmiError, group?.creator]);

  // useEffect hooks from SS.tsx
  useEffect(() => {
    initializeData();
  }, [SAVING_CONTRACT_INSTANCE, id]);

  // ENS resolution effect for displayed addresses
  useEffect(() => {
    const resolveDisplayedAddresses = async () => {
      // Resolve ENS for group creator
      if (group?.creator && !resolvedENS[group.creator]) {
        await resolveAddressToENS(group.creator);
      }
      
      // Resolve ENS for current recipient
      if (groupSummary?.[14] && groupSummary[14] !== "0x0000000000000000000000000000000000000000" && !resolvedENS[groupSummary[14]]) {
        await resolveAddressToENS(groupSummary[14]);
      }
      
      // Resolve ENS for all group members
      if (groupMembers.addresses && groupMembers.addresses.length > 0) {
        for (const address of groupMembers.addresses) {
          if (address && address !== "0x0000000000000000000000000000000000000000" && !resolvedENS[address]) {
            await resolveAddressToENS(address);
          }
        }
      }
    };

    if (group || groupSummary || groupMembers.addresses.length > 0) {
      resolveDisplayedAddresses();
    }
  }, [group, groupSummary, groupMembers, resolvedENS]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading group details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Group not found
  if (!group) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/bondfi/savings" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Savings Circles
          </Link>
        </div>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Group Not Found</h2>
          <p className="text-gray-600">The savings group you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/bondfi/savings" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Savings Circles
        </Link>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Group Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {group.name || 'Savings Group'}
                  </CardTitle>
                  <p className="text-gray-600 mb-4">{group.description || 'No description available'}</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <Badge className="bg-green-100 text-green-800">
                      {group.status || 'Active'}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800">
                      {group.frequency || 'Monthly'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatTokenAmount(groupSummary?.[5] || group?.contributionAmount)}
                  </div>
                  <div className="text-sm text-gray-600">Contribution Amount</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {Number(groupSummary?.[6] || group?.currentMembers || 0)}/{Number(groupSummary?.[7] || group?.maxMembers || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {Number(groupSummary?.[8] || group?.currentRound || 0)}/{Number(groupSummary?.[9] || group?.totalRounds || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Round Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {getTimeRemaining(groupSummary?.[13] || group?.nextContributionDeadline)}
                  </div>
                  <div className="text-sm text-gray-600">Next Deadline</div>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Round Progress</span>
                  <span>{Math.round((Number(groupSummary?.[8] || group?.currentRound || 0) / Number(groupSummary?.[9] || group?.totalRounds || 1)) * 100)}%</span>
                </div>
                <Progress 
                  value={(Number(groupSummary?.[8] || group?.currentRound || 0) / Number(groupSummary?.[9] || group?.totalRounds || 1)) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User's turn indicators */}
              {groupSummary?.[14] && groupSummary[14] !== "0x0000000000000000000000000000000000000000" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {groupSummary[14] === (window as any).ethereum?.selectedAddress ? 
                        "It's your turn to claim the payout!" : 
                        "Someone else is currently claiming"}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="Contribution amount"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button 
                  onClick={handleContribute}
                  disabled={isContributing || !contributionAmount || contributionStatus?.[0]}
                  className="px-6"
                >
                  {isContributing ? <Loader className="h-4 w-4 animate-spin" /> : 
                   contributionStatus?.[0] ? 'Already Contributed' : 'Contribute'}
                </Button>
              </div>
              
              <Button 
                onClick={handleClaimPayout}
                disabled={isClaiming || !groupSummary?.[14] || groupSummary[14] !== (window as any).ethereum?.selectedAddress}
                variant="outline"
                className="w-full"
              >
                {isClaiming ? <Loader className="h-4 w-4 animate-spin" /> : 
                 !groupSummary?.[14] || groupSummary[14] === "0x0000000000000000000000000000000000000000" ? 'No Payout Available' :
                 groupSummary[14] !== (window as any).ethereum?.selectedAddress ? 'Not Your Turn' : 'Claim Payout'}
              </Button>
            </CardContent>
          </Card>

          {/* Current Recipient & Status */}
          {groupSummary?.[14] && groupSummary[14] !== "0x0000000000000000000000000000000000000000" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Current Round Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-gray-800">
                      Current Recipient: {getEnsName(groupSummary[14]) 
                        ? formatENS(getEnsName(groupSummary[14])!)
                        : groupSummary[15] || formatAddress(groupSummary[14])}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Round {Number(groupSummary[8] || group?.currentRound || 0)} of {Number(groupSummary[9] || group?.totalRounds || 0)}
                  </p>
                  <p className="text-sm text-emerald-600 font-medium mt-1">
                    Payout Amount: {formatTokenAmount(Number(groupSummary?.[5] || group?.contributionAmount || 0) * Number(groupSummary?.[6] || group?.currentMembers || 0))} {getSupportedTokens().find(t => t.address === (groupSummary?.[4] || group?.token))?.symbol || 'Tokens'}
                  </p>
                </div>
                
                {/* User's contribution status */}
                {contributionStatus && (
                  <div className="mt-4 flex items-center space-x-2">
                    {contributionStatus[0] ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span className="text-emerald-600 font-medium">You have contributed for this round</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <span className="text-amber-600 font-medium">
                          {contributionStatus[2] ? 'Late - Please contribute' : 'Contribution pending'}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Group Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Group Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Creator</div>
                  <div className="font-medium">
                    {getEnsName(groupSummary?.[2] || group?.creator) 
                      ? formatENS(getEnsName(groupSummary?.[2] || group?.creator)!)
                      : groupSummary?.[3] || group?.creatorName || 
                        (groupSummary?.[2] || group?.creator) 
                          ? formatAddress(groupSummary?.[2] || group?.creator)
                          : 'Unknown'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Group ID</div>
                  <div className="font-medium">{id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Token</div>
                  <div className="font-medium">
                    {getSupportedTokens().find(t => t.address === (groupSummary?.[4] || group?.token))?.symbol || 'Unknown'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="font-medium">
                    {groupSummary?.[11] ? 'Completed' : 
                     groupSummary?.[10] ? 'Active' : 
                     groupSummary?.[12] ? 'Recruiting' : 'Inactive'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Group Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Group Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Members</span>
                <span className="font-medium">{Number(groupSummary?.[6] || group?.currentMembers || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Round Progress</span>
                <span className="font-medium">
                  {Math.round((Number(groupSummary?.[8] || group?.currentRound || 0) / Number(groupSummary?.[9] || group?.totalRounds || 1)) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contribution Amount</span>
                <span className="font-medium">
                  {formatTokenAmount(groupSummary?.[5] || group?.contributionAmount)} {getSupportedTokens().find(t => t.address === (groupSummary?.[4] || group?.token))?.symbol || 'Tokens'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Rounds</span>
                <span className="font-medium">{Number(groupSummary?.[9] || group?.totalRounds || 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({groupSummary?.[6] || group?.currentMembers || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groupMembers.addresses && groupMembers.addresses.length > 0 ? (
                  groupMembers.addresses.map((address, index) => {
                    const isCurrentRecipient = groupSummary?.[14] && groupSummary[14] === address;
                    const memberName = groupMembers.names[index] || '';
                    const ensName = getEnsName(address);
                    const displayName = ensName 
                      ? formatENS(ensName)
                      : memberName || formatAddress(address);
                    
                    return (
                      <div key={address} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {displayName}
                        </div>
                          <div className="text-sm text-gray-600 truncate">
                            {address}
                        </div>
                      </div>
                        <div className="flex items-center gap-2">
                          {isCurrentRecipient && (
                            <Badge className="bg-emerald-100 text-emerald-800">
                              <Star className="w-3 h-3 mr-1" />
                              Current Recipient
                            </Badge>
                          )}
                          <Badge className="bg-green-100 text-green-800">
                            Member
                      </Badge>
                    </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No members yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}