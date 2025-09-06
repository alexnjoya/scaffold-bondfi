"use client";
  
import React, { useState, useEffect } from 'react';
import { Crown, UserPlus,Users, TrendingUp, Calendar, DollarSign, Clock, CheckCircle, Star, Shield, AlertCircle, Loader } from 'lucide-react';
import { CONTRACT_ADDRESSES, useContractInstances } from '@/provider/ContractInstanceProvider';
import tokens from '@/lib/Tokens/tokens';
import { Card } from "~~/components/ui/card";
import { Button } from "~~/components/ui/button";
import { Progress } from "~~/components/ui/progress";
import { Badge } from "~~/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~~/components/ui/dialog";
import { Input } from "~~/components/ui/input";
import { Label } from "~~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~~/components/ui/select";
import Link from "next/link";
import { useEnsName, useEnsAddress } from "wagmi";

export function SavingsCircles() {
  // All state declarations at the top - following SS.tsx pattern
  const [contributionAmount, setContributionAmount] = useState('');
  const [groupSize, setGroupSize] = useState(5);
  const [frequency, setFrequency] = useState('weekly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [agentContactInfo, setAgentContactInfo] = useState('');
  const [showAgentRegistration, setShowAgentRegistration] = useState(false);
  const [ensNames, setEnsNames] = useState<Record<string, string>>({});
  const [resolvedENS, setResolvedENS] = useState<Record<string, string>>({});
  
  // Invite code state
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [currentInviteCode, setCurrentInviteCode] = useState('');
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState<any>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<any>(null);
  const [maxUses, setMaxUses] = useState(10);
  const [validityDays, setValidityDays] = useState(30);

  // Contract state
  const [userInfo, setUserInfo] = useState<any>(null);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const [supportedTokens, setSupportedTokens] = useState<any[]>([]);
  const [totalStats, setTotalStats] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userName, setUserName] = useState('');

  const { isConnected, SAVING_CONTRACT_INSTANCE, TEST_TOKEN_CONTRACT_INSTANCE, AFRISTABLE_CONTRACT_INSTANCE, address } = useContractInstances();

  // Primary ENS resolution using wagmi useEnsAddress hook
  const { data: wagmiEnsAddress, isError: isWagmiError, isLoading: isWagmiLoading, error: wagmiError } = useEnsAddress({
    name: myGroups.length > 0 && myGroups[0]?.[2]?.endsWith('.eth') ? myGroups[0][2] : undefined,
    chainId: 11155111 // Base Sepolia Testnet chain ID
  });

  const frequencyOptions = [
    {value: 'five minute', label: 'Five-minute', seconds: 300 },
    { value: 'daily', label: 'Daily', seconds: 86400 },
    { value: 'weekly', label: 'Weekly', seconds: 604800 },
    { value: 'biweekly', label: 'Bi-weekly', seconds: 1209600 },
    { value: 'monthly', label: 'Monthly', seconds: 2592000 },
  ];

  // Get supported tokens (excluding ETH which is id: 1)
  const getSupportedTokens = () => {
    return tokens.filter(token => token.id > 1);
  };

  // Format token amounts
  const formatTokenAmount = (amountInWei: any, decimals = 18) => {
    if (!amountInWei) return '0';
    const divisor = Math.pow(10, decimals);
    return (parseFloat(amountInWei) / divisor).toFixed(2);
  };

  // Convert token amount to wei
  const toWei = (amount: any, decimals = 18) => {
    const multiplier = Math.pow(10, decimals);
    return (parseFloat(amount) * multiplier).toString();
  };

  // Get time remaining
  const getTimeRemaining = (timestamp: any) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = Number(timestamp) - now;
    
    if (remaining <= 0) return "Expired";
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
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

  // Handle wagmi ENS resolution
  useEffect(() => {
    console.log("Wagmi ENS Address:", wagmiEnsAddress);
    console.log("Wagmi ENS Loading:", isWagmiLoading);
    console.log("Wagmi ENS Error:", isWagmiError);
    if (wagmiError) console.log("Wagmi ENS Error details:", wagmiError);
    
    if (wagmiEnsAddress && myGroups.length > 0 && myGroups[0]?.[2]?.endsWith('.eth')) {
      console.log('ENS resolved via wagmi:', wagmiEnsAddress);
      setResolvedENS(prev => ({ ...prev, [myGroups[0][2]]: wagmiEnsAddress }));
    } else if (isWagmiError && myGroups.length > 0 && myGroups[0]?.[2]?.endsWith('.eth')) {
      console.log('Wagmi ENS resolution failed, trying fallback...');
      // Try fallback methods when wagmi fails
      resolveAddressToENS(myGroups[0][2]);
    }
  }, [wagmiEnsAddress, isWagmiLoading, isWagmiError, wagmiError, myGroups]);

  // All useEffect hooks together
  useEffect(() => {
    if (isConnected && address) {
      initializeData();
    }
  }, [isConnected, address]);

  // ENS resolution effect for displayed addresses
  useEffect(() => {
    const resolveDisplayedAddresses = async () => {
      // Resolve ENS for group creators in myGroups
      if (myGroups.length > 0) {
        for (const group of myGroups) {
          if (group[2] && !resolvedENS[group[2]]) {
            await resolveAddressToENS(group[2]);
          }
        }
      }
      
      // Resolve ENS for group creators in availableGroups
      if (availableGroups.length > 0) {
        for (const group of availableGroups) {
          if (group.creator && !resolvedENS[group.creator]) {
            await resolveAddressToENS(group.creator);
          }
        }
      }
    };

    if (myGroups.length > 0 || availableGroups.length > 0) {
      resolveDisplayedAddresses();
    }
  }, [myGroups, availableGroups, resolvedENS]);

  const initializeData = async () => {
    setIsLoading(true);
    try {
      const Saving_Contract = await SAVING_CONTRACT_INSTANCE();
      if (!Saving_Contract) {
        setErrorMessage('Contract not available');
        return;
      }
      
      // Check if user is registered
      const registered = await Saving_Contract.isUserRegistered(address);
      
      setIsRegistered(registered);
      
      if (registered) {
        // Check if user is an agent
        const agentStatus = await Saving_Contract.isAjoAgent(address);
        setIsAgent(agentStatus);
        
        // Get user info
        const userMemberInfo = await Saving_Contract.getMemberInfo(address);
        console.log('userMemberInfo', userMemberInfo);
        setUserInfo(userMemberInfo);
        
        const name = await Saving_Contract.getUserName(address);
        setUserName(name);
        
        // Get user's groups
        const userGroupIds = await Saving_Contract.getUserGroups(address);
        const userGroupsData = await Promise.all(
          userGroupIds.map(async (groupId: any) => {
            const summary = await Saving_Contract.getGroupSummary(groupId);
            console.log('summarry',summary)

            const savingInfo= await Saving_Contract.savingsGroups(groupId);
            console.log('savingInfo',savingInfo)
            const contributionStatus = await Saving_Contract.getUserContributionStatus(groupId, address);
            
            // Get invite code details for groups created by the user
            let inviteCodeData = null;
            if (summary[2] === address) {
              try {
                const inviteCode = await Saving_Contract.groupInviteCode(groupId);
                if (inviteCode && inviteCode !== "0" && inviteCode !== "") {
                  // Get invite code details
                  const inviteCodeInfo = await Saving_Contract.inviteCodes(inviteCode);
                  inviteCodeData = {
                    code: inviteCode,
                    maxUses: inviteCodeInfo[4]?.toString(),
                    currentUses: inviteCodeInfo[5]?.toString(),
                    expiryTime: inviteCodeInfo[6]?.toString(),
                    isActive: inviteCodeInfo[3]
                  };
                }
              } catch (error) {
                console.log(`No invite code for group ${groupId}`);
              }
            }
            
            return { 
              ...summary, 
              contributionStatus,
              inviteCode: inviteCodeData?.code || "",
              maxUses: inviteCodeData?.maxUses,
              currentUses: inviteCodeData?.currentUses,
              expiryTime: inviteCodeData?.expiryTime,
              isInviteActive: inviteCodeData?.isActive
            };
          })
        );
        setMyGroups(userGroupsData);
      }
      
      // Get available groups
      const joinableGroups = await Saving_Contract.getJoinableGroups();
      setAvailableGroups(joinableGroups);
      
      // Get supported tokens
      const tokenData = await Saving_Contract.getSupportedTokens();
      setSupportedTokens(tokenData);
      
      // Get total stats
      const stats = await Saving_Contract.getTotalStats();
      console.log('total stats', stats)
      setTotalStats(stats);
      
      // Set supported tokens for UI
      setSelectedToken(getSupportedTokens()[0]?.address || '');
      
    } catch (error: any) {
      console.error('Error initializing data:', error);
      // Check if the error is because user is already registered
      if (error.reason === "Already Registered") {
        setIsRegistered(true);
        // Try to fetch data again since user is actually registered
        initializeData();
      } else {
        setErrorMessage('Failed to load contract data');
      }
    }
    setIsLoading(false);
  };

  const handleRegisterUser = async () => {
    if (!userName.trim()) return;
    
    setIsProcessing(true);
    try {
      const Saving_Contract = await SAVING_CONTRACT_INSTANCE();
      if (!Saving_Contract) {
        setErrorMessage('Contract not available');
        return;
      }
      
      // First check if user is already registered
      const isUserRegistered = await Saving_Contract.isUserRegistered(address);
      if (isUserRegistered) {
        setIsRegistered(true);
        setSuccessMessage('You are already registered! Welcome back to BondFi ROSCA.');
        initializeData(); // Refresh data
        return;
      }
      
      const tx = await Saving_Contract.registerUser(userName);
      await tx.wait();
      
      setIsRegistered(true);
      setSuccessMessage('Successfully registered! Welcome to BondFi ROSCA.');
      initializeData(); // Refresh data
    } catch (error: any) {
      console.error('Registration error:', error);
      // Check if the error is because user is already registered
      if (error.reason === "Already Registered") {
        setIsRegistered(true);
        setSuccessMessage('You are already registered! Welcome back to BondFi ROSCA.');
        initializeData(); // Refresh data
      } else {
        setErrorMessage('Failed to register user');
      }
    }
    setIsProcessing(false);
  };

  const handleRegisterUserAsAgent = async () => {
    if (!agentContactInfo.trim()) return;

    setIsProcessing(true);
    try {
      const Saving_Contract = await SAVING_CONTRACT_INSTANCE();
      if (!Saving_Contract) {
        setErrorMessage('Contract not available');
        return;
      }

      // Then, register the user as an Ajo Agent
      const agentTx = await Saving_Contract.registerAsAjoAgent(userName, agentContactInfo);
      await agentTx.wait();

      setIsAgent(true);
      setShowAgentRegistration(false);
      setSuccessMessage('Successfully registered as an agent!');
      initializeData(); // Refresh data
    } catch (error: any) {
      console.error('Agent registration error:', error);
      setErrorMessage('Failed to register as agent');
    }
    setIsProcessing(false);
  };

  const handleCreateGroup = async () => {
    if (!groupName || !contributionAmount || !selectedToken || parseFloat(contributionAmount) <= 0) return;

    setIsProcessing(true);
    try {
      const Saving_Contract = await SAVING_CONTRACT_INSTANCE();
      if (!Saving_Contract) {
        setErrorMessage('Contract not available');
        return;
      }
      const freqData = frequencyOptions.find(f => f.value === frequency);
      if (!freqData) {
        setErrorMessage('Invalid frequency selected');
        return;
      }
      const contributionInWei = toWei(contributionAmount);

      const tx = await Saving_Contract.createGroup(
        groupName,
        groupDescription || `${groupName} - A savings group`,
        selectedToken,
        contributionInWei,
        freqData.seconds,
        groupSize
      );

      await tx.wait();

      setSuccessMessage(`Successfully created "${groupName}" group!`);
      setGroupName('');
      setGroupDescription('');
      setContributionAmount('');
      initializeData(); // Refresh data

    } catch (error) {
      console.error('Group creation error:', error);
      setErrorMessage('Failed to create group');
    }

    setIsProcessing(false);
  };

  const handleJoinGroup = async (groupId: any) => {
    setIsProcessing(true);
    try {
      const Saving_Contract = await SAVING_CONTRACT_INSTANCE();
      if (!Saving_Contract) {
        setErrorMessage('Contract not available');
        return;
      }
      let tx;
      
      if (inviteCode.trim()) {
        tx = await Saving_Contract.joinGroupWithCode(groupId, inviteCode);
      } else {
        // If no invite code, try direct join (if allowed)
        setErrorMessage('Invite code required to join group');
        setIsProcessing(false);
        return;
      }
      
      await tx.wait();
      setSuccessMessage('Successfully joined the group!');
      setInviteCode('');
      initializeData(); // Refresh data
    } catch (error) {
      console.error('Join group error:', error);
      setErrorMessage('Failed to join group');
    }
    setIsProcessing(false);
  };

  const getStatusColor = (isActive: any, isCompleted: any, canJoin: any) => {
    if (isCompleted) return 'text-stone-500 bg-stone-100';
    if (isActive) return 'text-emerald-600 bg-emerald-50';
    if (canJoin) return 'text-blue-600 bg-blue-50';
    return 'text-stone-600 bg-stone-100';
  };

  const getGroupStatus = (group: any) => {
    if (group.isCompleted) return 'Completed';
    if (group.isActive) return 'Active';
    if (group.canJoin) return 'Recruiting';
    return 'Full';
  };

  // Invite code management functions
  const handleGenerateInviteCode = async (groupId: any) => {
    setSelectedGroupId(groupId);
    setSelectedGroupForInvite(myGroups.find(g => g[0] === groupId));
    setShowInviteModal(true);
  };

  const handleCreateInviteCode = async () => {
    if (!selectedGroupId) return;
    
    setIsProcessing(true);
    try {
      const Saving_Contract = await SAVING_CONTRACT_INSTANCE();
      if (!Saving_Contract) {
        setErrorMessage('Contract not available');
        return;
      }
      
      const tx = await Saving_Contract.generateInviteCode(
        selectedGroupId,
        maxUses,
        validityDays
      );
      
      await tx.wait();
      
      // Close modal and reset values
      setShowInviteModal(false);
      setSelectedGroupId(null);
      setMaxUses(10);
      setValidityDays(30);
      
      // Refresh the groups data to show the new invite code
      await initializeData();
      
      setSuccessMessage('Invite code generated successfully!');
      
    } catch (error: any) {
      console.error('Error generating invite code:', error);
      setErrorMessage('Failed to generate invite code. Please try again.');
    }
    setIsProcessing(false);
  };

  const handleDeactivateInviteCode = async (inviteCode: string) => {
    setIsProcessing(true);
    try {
      const Saving_Contract = await SAVING_CONTRACT_INSTANCE();
      if (!Saving_Contract) {
        setErrorMessage('Contract not available');
        return;
      }
      
      const tx = await Saving_Contract.deactivateInviteCode(inviteCode);
      await tx.wait();
      
      // Refresh the groups data to reflect the deactivated code
      await initializeData();
      
      setSuccessMessage('Invite code deactivated successfully!');
      
    } catch (error: any) {
      console.error('Error deactivating invite code:', error);
      setErrorMessage('Failed to deactivate invite code. Please try again.');
    }
    setIsProcessing(false);
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(currentInviteCode);
    setSuccessMessage('Invite code copied to clipboard!');
  };

  // Show loading screen
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-terracotta" />
          <p className="text-stone-600">Loading BondFi ROSCA data...</p>
        </div>
      </div>
    );
  }

  // Show connection prompt
  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center bg-white rounded-2xl p-8 shadow-sm border border-stone-200">
          <Shield className="w-16 h-16 text-terracotta mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-stone-800 mb-2">Connect Your Wallet</h2>
          <p className="text-stone-600">Please connect your wallet to access BondFi ROSCA</p>
        </div>
      </div>
    );
  }

  // Show registration form if not registered
  if (!isRegistered) {
    return (
   <div className="max-w-md mx-auto mt-16">
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-200">
      <div className="text-center mb-6">
        <Users className="w-16 h-16 text-terracotta mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-stone-800 mb-2">Welcome to BondFi ROSCA</h2>
        <p className="text-stone-600">Please register to get started</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-terracotta focus:border-transparent"
            placeholder="Enter your full name"
          />
        </div>
        
        <div className="space-y-2">
          <button
            onClick={handleRegisterUser}
            disabled={!userName.trim() || isProcessing}
            className="w-full bg-gradient-to-r from-terracotta to-sage text-black py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Registering...' : 'Register as User'}
          </button>
          
          <div className="text-center text-stone-500 text-sm">or</div>
          
          <button
            onClick={() => setShowAgentRegistration(true)}
            disabled={!userName.trim()}
            className="w-full bg-gradient-to-r from-sage to-gold text-black py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Register as Agent
          </button>
        </div>
      </div>
    </div>
   
  </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-stone-800">BondFi ROSCA</h1>
          {isAgent && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Agent
            </div>
          )}
        </div>
        <p className="text-stone-600">Traditional rotating savings with modern security</p>
        <p className="text-stone-500 text-sm">Welcome back, {userName}!</p>
        {!isAgent && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-600" />
              <span className="text-amber-800 text-sm">
                Want to create groups? <button 
                  onClick={() => setShowAgentRegistration(true)}
                  className="underline hover:no-underline font-medium"
                >
                  Register as an Agent
                </button>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">{successMessage}</p>
          <button onClick={() => setSuccessMessage('')} className="ml-auto text-green-600 hover:text-green-800">
            ×
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{errorMessage}</p>
          <button onClick={() => setErrorMessage('')} className="ml-auto text-red-600 hover:text-red-800">
            ×
          </button>
        </div>
      )}

      {/* Overview Stats */}
      {userInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-sage/10 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-sage" />
              </div>
              <h3 className="font-semibold text-stone-800">Total Contributions</h3>
            </div>
            <p className="text-2xl font-bold text-stone-800">
              {formatTokenAmount(userInfo[1])} 
            </p>
            <p className="text-stone-500 text-sm">Across {userInfo[3]?.toString()} active groups</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-stone-800">Active Groups</h3>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{userInfo[3]?.toString()}</p>
            <p className="text-stone-500 text-sm">
              {userInfo[4]?.toString()} completed
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-semibold text-stone-800">Reputation Score</h3>
            </div>
            <p className="text-2xl font-bold text-stone-800">{userInfo[7]?.toString()}/100</p>
            <p className="text-stone-500 text-sm">
              {userInfo[6] ? 'Has defaults' : 'Good standing'}
            </p>
          </div>
        </div>
      )}

      {/* My Groups */}
      {myGroups.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Active Circles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {myGroups.filter(group => !group[11]).map((group, index) => (
              <Card key={index} className="p-6 bg-gradient-card border-border/20 shadow-glass hover:shadow-glow transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{group[1]}</h3>
                        {group[2] === address && <Crown className="h-4 w-4 text-amber-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created by: {getEnsName(group[2]) 
                          ? formatENS(getEnsName(group[2])!)
                          : group[3] || formatAddress(group[2]) || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={group[10] ? "default" : "secondary"}
                    className={group[10] ? "bg-accent text-accent-foreground" : ""}
                  >
                    {group[10] ? 'Active' : 'Recruiting'}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-white">
                        {group[8]?.toString()}
                      </div>
                      <span className="text-sm font-medium">Round {group[8]?.toString()} of {group[9]?.toString()}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Completion</div>
                      <div className="text-sm font-semibold">
                        {Math.round((Number(group[8]) / Number(group[9])) * 100)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-semibold">
                          {formatTokenAmount(group[5])} {getSupportedTokens().find(t => t.address === group[4])?.symbol}
                        </div>
                        <div className="text-xs text-muted-foreground">Per contribution</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-semibold">
                          {group[10] ? getTimeRemaining(group[13]) : 'Not Started'}
                        </div>
                        <div className="text-xs text-muted-foreground">Next deadline</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Link href={`/bondfi/savings-group/${group[0]}`}>
                      <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        View Details
                      </Button>
                    </Link>
                    
                    {/* Invite Code Section for Group Creators */}
                    {group[2] === address && (
                      <div className="space-y-2">
                        {group.inviteCode && group.inviteCode !== "0" && group.inviteCode !== "" && group.isInviteActive ? (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs text-green-600 font-medium">Active Invite Code</div>
                              <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(group.inviteCode);
                                  setSuccessMessage('Invite code copied to clipboard!');
                                }}
                                  className="p-1 text-green-600 hover:text-green-800 transition-colors"
                                title="Copy invite code"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                                <button
                                  onClick={() => handleDeactivateInviteCode(group.inviteCode)}
                                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                  title="Deactivate invite code"
                                  disabled={isProcessing}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                            </div>
                            </div>
                            <div className="font-mono text-sm text-green-800 break-all">{group.inviteCode}</div>
                            <div className="text-xs text-green-600 mt-1">
                              Uses: {group.currentUses || '0'}/{group.maxUses || 'Unlimited'} | 
                              Expires: {group.expiryTime ? new Date(Number(group.expiryTime) * 1000).toLocaleDateString() : 'Never'}
                            </div>
                          </div>
                        ) : group.inviteCode && group.inviteCode !== "0" && group.inviteCode !== "" && !group.isInviteActive ? (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs text-red-600 font-medium">Deactivated Invite Code</div>
                              <button
                                onClick={() => handleGenerateInviteCode(group[0])}
                                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                                disabled={isProcessing}
                              >
                                Generate New
                              </button>
                            </div>
                            <div className="font-mono text-sm text-red-800 break-all">{group.inviteCode}</div>
                            <div className="text-xs text-red-600 mt-1">This invite code is no longer active</div>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleGenerateInviteCode(group[0])}
                            disabled={isProcessing}
                            className="w-full text-xs"
                          >
                            {isProcessing ? 'Generating...' : 'Generate Invite Code'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Groups */}
      {availableGroups.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Circles to Join</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {availableGroups.map((group, index) => (
              <Card key={index} className="p-6 bg-gradient-card border-border/20 shadow-glass hover:shadow-glow transition-all cursor-pointer group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{group.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-muted-foreground">4.8</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 rounded-lg bg-background/20">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(Number(group.currentMembers), 3) }).map((_, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-gradient-primary border-2 border-background flex items-center justify-center">
                            <Users className="h-3 w-3 text-white" />
                          </div>
                        ))}
                        {Number(group.currentMembers) > 3 && (
                          <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                            +{Number(group.currentMembers) - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {Number(group.currentMembers)}/{Number(group.maxMembers)} members
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {Number(group.maxMembers) - Number(group.currentMembers)} spots left
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Contribution</span>
                      <span className="font-medium">
                        {formatTokenAmount(group.contributionAmount)} {getSupportedTokens().find(t => t.address === group.token)?.symbol}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Creator</span>
                      <span className="font-medium">
                        {getEnsName(group.creator) 
                          ? formatENS(getEnsName(group.creator)!)
                          : group.creatorName || formatAddress(group.creator) || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Link href={`/bondfi/savings-group/available-${group.groupId}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="w-full shadow-glow">
                          Join Circle
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card-glass backdrop-blur-xl border-border/20">
                        <DialogHeader>
                          <DialogTitle>Join {group.name}</DialogTitle>
                          <DialogDescription>
                            Enter the invite code to join this savings circle.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`invite-code-${index}`}>Invite Code</Label>
                            <Input 
                              id={`invite-code-${index}`}
                              placeholder="e.g., BONDFI-XXXXXXXX" 
                              className="font-mono"
                              value={inviteCode}
                              onChange={(e) => setInviteCode(e.target.value)}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Ask the circle owner for the invite code to join this group.
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              className="flex-1" 
                              disabled={!inviteCode.trim() || isProcessing}
                              onClick={() => handleJoinGroup(group.groupId)}
                            >
                              {isProcessing ? 'Joining...' : 'Join Circle'}
                            </Button>
                            <Button variant="outline" className="flex-1">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Platform Statistics */}
      {totalStats && (
        <div className="bg-gradient-to-br from-terracotta/10 via-sage/10 to-gold/10 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-stone-800 text-center mb-8">Platform Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-sage" />
              </div>
              <p className="text-2xl font-bold text-stone-800">{totalStats[0]?.toString()}</p>
              <p className="text-stone-600 text-sm">Total Groups</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-600">{totalStats[1]?.toString()}</p>
              <p className="text-stone-600 text-sm">Active Groups</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-8 h-8 text-gold" />
              </div>
              <p className="text-2xl font-bold text-stone-800">{totalStats[2]?.toString()}</p>
              <p className="text-stone-600 text-sm">Completed Groups</p>
            </div>
          </div>
        </div>
      )}

      {/* Agent Registration Modal */}
      {showAgentRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-stone-800 mb-4">Register as Agent</h3>
            <p className="text-stone-600 text-sm mb-6">
              As an agent, you can create groups and will be automatically added as a member.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Contact Information
                </label>
                <textarea
                  value={agentContactInfo}
                  onChange={(e) => setAgentContactInfo(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-terracotta focus:border-transparent"
                  placeholder="Phone, email, or other contact details"
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAgentRegistration(false)}
                  className="flex-1 bg-stone-200 text-stone-700 py-3 rounded-xl font-semibold hover:bg-stone-300 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegisterUserAsAgent}
                  disabled={!agentContactInfo.trim() || isProcessing}
                  className="flex-1 bg-gradient-to-r from-sage to-gold text-black py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Registering...' : 'Register as Agent'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Code Generation Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="bg-card-glass backdrop-blur-xl border-border/20">
          <DialogHeader>
            <DialogTitle>Generate Invite Code for {selectedGroupForInvite?.[1]}</DialogTitle>
            <DialogDescription>
              Create an invite code to allow others to join your savings circle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxUses">Maximum Uses</Label>
                <Input 
                  id="maxUses"
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(parseInt(e.target.value) || 10)}
                  min="1"
                  max="100"
                />
                <p className="text-xs text-muted-foreground mt-1">How many people can use this code</p>
              </div>
              <div>
                <Label htmlFor="validityDays">Validity (Days)</Label>
                <Input 
                  id="validityDays"
                  type="number"
                  value={validityDays}
                  onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                  min="1"
                  max="365"
                />
                <p className="text-xs text-muted-foreground mt-1">How long the code remains valid</p>
            </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Important:</p>
                  <p>Once generated, you can deactivate the invite code anytime. The code will be automatically deactivated after reaching the maximum uses or expiry date.</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
            <Button 
                onClick={handleCreateInviteCode}
                disabled={isProcessing || maxUses < 1 || validityDays < 1}
                className="flex-1"
              >
                {isProcessing ? 'Generating...' : 'Generate Invite Code'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowInviteModal(false)}
                className="flex-1"
              >
                Cancel
            </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
