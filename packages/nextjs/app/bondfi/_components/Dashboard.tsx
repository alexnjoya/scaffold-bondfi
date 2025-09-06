"use client";
import React, { useState, useEffect } from 'react';
import { Card } from "~~/components/ui/card";
import { Button } from "~~/components/ui/button";
import { Progress } from "~~/components/ui/progress";
import { Badge } from "~~/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~~/components/ui/dialog";
import { Input } from "~~/components/ui/input";
import { Label } from "~~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~~/components/ui/select";
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  Eye,
  Shield,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader,
  Star,
  Crown,
  Copy
} from "lucide-react";
import { CONTRACT_ADDRESSES, useContractInstances } from '@/provider/ContractInstanceProvider';
import tokens from '@/lib/Tokens/tokens';

export function Dashboard() {
  // State management from SavingsCircles.tsx
  const [userInfo, setUserInfo] = useState<any>(null);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const [supportedTokens, setSupportedTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userName, setUserName] = useState('');
  const [totalStats, setTotalStats] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Agent registration state
  const [isAgent, setIsAgent] = useState(false);
  const [agentContactInfo, setAgentContactInfo] = useState('');
  const [showAgentRegistration, setShowAgentRegistration] = useState(false);
  
  // Group creation state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');
  const [groupSize, setGroupSize] = useState(5);
  const [frequency, setFrequency] = useState('weekly');
  const [selectedToken, setSelectedToken] = useState('');
  
  // Join group state
  const [inviteCode, setInviteCode] = useState('');
  const [selectedGroupToJoin, setSelectedGroupToJoin] = useState<any>(null);
  
  // Invite code state
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false);
  const [currentInviteCode, setCurrentInviteCode] = useState('');
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState<any>(null);

  const { isConnected, SAVING_CONTRACT_INSTANCE, TEST_TOKEN_CONTRACT_INSTANCE, AFRISTABLE_CONTRACT_INSTANCE, address } = useContractInstances();

  // Frequency options from SavingsCircles.tsx
  const frequencyOptions = [
    {value: 'five minute', label: 'Five-minute', seconds: 300 },
    { value: 'daily', label: 'Daily', seconds: 86400 },
    { value: 'weekly', label: 'Weekly', seconds: 604800 },
    { value: 'biweekly', label: 'Bi-weekly', seconds: 1209600 },
    { value: 'monthly', label: 'Monthly', seconds: 2592000 },
  ];

  // Utility functions from SavingsCircles.tsx
  const getSupportedTokens = () => {
    return tokens.filter(token => token.id > 1);
  };

  const formatTokenAmount = (amountInWei: any, decimals = 18) => {
    if (!amountInWei) return '0';
    const divisor = Math.pow(10, decimals);
    return (parseFloat(amountInWei) / divisor).toFixed(2);
  };

  const toWei = (amount: any, decimals = 18) => {
    const multiplier = Math.pow(10, decimals);
    return (parseFloat(amount) * multiplier).toString();
  };

  const getTimeRemaining = (timestamp: any) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = Number(timestamp) - now;
    
    if (remaining <= 0) return "Ready";
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    
    return `${days}d ${hours}h`;
  };

  const initializeData = async () => {
    if (!isConnected || !address) return;
    
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
        setUserInfo(userMemberInfo);
        
        const name = await Saving_Contract.getUserName(address);
        setUserName(name);
        
        // Get user's groups
        const userGroupIds = await Saving_Contract.getUserGroups(address);
        const userGroupsData = await Promise.all(
          userGroupIds.map(async (groupId: any) => {
            const summary = await Saving_Contract.getGroupSummary(groupId);
            const contributionStatus = await Saving_Contract.getUserContributionStatus(groupId, address);
            
            // Get invite code for groups created by the user
            let inviteCode = "";
            if (summary[2] === address) {
              try {
                inviteCode = await Saving_Contract.groupInviteCode(groupId);
              } catch (error) {
                console.log(`No invite code for group ${groupId}`);
              }
            }
            
            return { 
              ...summary, 
              contributionStatus,
              inviteCode 
            };
          })
        );
        setMyGroups(userGroupsData);
        
        // Get available groups
        const joinableGroups = await Saving_Contract.getJoinableGroups();
        setAvailableGroups(joinableGroups);
        
        // Get supported tokens
        const tokenData = await Saving_Contract.getSupportedTokens();
        setSupportedTokens(tokenData);
        
        // Get total stats
        const stats = await Saving_Contract.getTotalStats();
        setTotalStats(stats);
        
        // Set supported tokens for UI
        setSelectedToken(getSupportedTokens()[0]?.address || '');
      }
    } catch (error: any) {
      console.error('Error initializing data:', error);
      setErrorMessage('Failed to load contract data');
    }
    setIsLoading(false);
  };

  // Registration handler functions
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

  // Handler functions from SavingsCircles.tsx
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

    } catch (error: any) {
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
        setErrorMessage('Invite code required to join group');
        setIsProcessing(false);
        return;
      }
      
      await tx.wait();
      setSuccessMessage('Successfully joined the group!');
      setInviteCode('');
      setSelectedGroupToJoin(null);
      initializeData(); // Refresh data
    } catch (error: any) {
      console.error('Join group error:', error);
      setErrorMessage('Failed to join group');
    }
    setIsProcessing(false);
  };

  const handleGenerateInviteCode = async (groupId: any) => {
    try {
      const Saving_Contract = await SAVING_CONTRACT_INSTANCE();
      if (!Saving_Contract) {
        setErrorMessage('Contract not available');
        return;
      }
      
      const inviteCode = await Saving_Contract.groupInviteCode(groupId);
      setCurrentInviteCode(inviteCode);
      setSelectedGroupForInvite(myGroups.find(g => g[0] === groupId));
      setShowInviteCodeModal(true);
    } catch (error: any) {
      console.error('Error generating invite code:', error);
      setErrorMessage('Failed to generate invite code');
    }
  };

  const handleContribute = async (groupId: any, tokenAddress: any, amount: any) => {
    setIsProcessing(true);
    try {
      const AFRI_Contract = await AFRISTABLE_CONTRACT_INSTANCE();
      const TOKEN_Contract = await TEST_TOKEN_CONTRACT_INSTANCE(tokenAddress);
      
      if (!AFRI_Contract || !TOKEN_Contract) {
        setErrorMessage('Contract not available');
        return;
      }
      
      if (tokenAddress === '0xc5737615ed39b6B089BEDdE11679e5e1f6B9E768') {
        const tx = await AFRI_Contract.approve(CONTRACT_ADDRESSES.savingAddress, amount);
        await tx.wait();      
      } else {
        const tx = await TOKEN_Contract.approve(CONTRACT_ADDRESSES.savingAddress, amount);
        await tx.wait();   
      }

      const Saving_Contract = await SAVING_CONTRACT_INSTANCE();
      if (!Saving_Contract) {
        setErrorMessage('Contract not available');
        return;
      }
      const tx = await Saving_Contract.contribute(groupId);
      await tx.wait();
      
      setSuccessMessage('Contribution made successfully!');
      initializeData();
    } catch (error: any) {
      console.error('Contribution error:', error);
      setErrorMessage('Failed to make contribution');
    }
    setIsProcessing(false);
  };

  const handleClaimPayout = async (groupId: any) => {
    setIsProcessing(true);
    try {
      const Saving_Contract = await SAVING_CONTRACT_INSTANCE();
      if (!Saving_Contract) {
        setErrorMessage('Contract not available');
        return;
      }
      const tx = await Saving_Contract.claimPayout(groupId);
      await tx.wait();
      
      setSuccessMessage('Payout claimed successfully!');
      initializeData();
    } catch (error: any) {
      console.error('Claim payout error:', error);
      setErrorMessage('Failed to claim payout');
    }
    setIsProcessing(false);
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(currentInviteCode);
    setSuccessMessage('Invite code copied to clipboard!');
  };

  useEffect(() => {
    initializeData();
  }, [isConnected, address]);

  // Show loading screen
  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading your savings data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show connection prompt
  if (!isConnected) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground">Please connect your wallet to access BondFi ROSCA</p>
          </div>
        </div>
      </div>
    );
  }

  // Show registration form if not registered
  if (!isRegistered) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="max-w-md mx-auto mt-16">
          <Card className="p-8 bg-gradient-card border-border/20 shadow-glass text-center">
            <Users className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Welcome to BondFi ROSCA</h2>
            <p className="text-muted-foreground mb-6">Please register to get started</p>
            
            <div className="space-y-4">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your full name"
              />
              
              <div className="space-y-2">
                <Button 
                  onClick={handleRegisterUser}
                  disabled={!userName.trim() || isProcessing}
                  className="w-full shadow-glow"
                >
                  {isProcessing ? 'Registering...' : 'Register as User'}
                </Button>
                
                <div className="text-center text-muted-foreground text-sm">or</div>
                
                <Button 
                  onClick={() => setShowAgentRegistration(true)}
                  disabled={!userName.trim()}
                  variant="outline"
                  className="w-full"
                >
                  Register as Agent
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate dashboard metrics
  const activeGroups = myGroups.filter(group => group[10] && !group[11]);
  const upcomingPayouts = activeGroups.filter(group => group[14] === address);
  const pendingContributions = activeGroups.filter(group => !group.contributionStatus?.[0]);

  // Calculate total balance from user contributions
  const totalBalance = userInfo ? formatTokenAmount(userInfo[1]) : '0';
  
  // Find next payout
  const nextPayout = upcomingPayouts.length > 0 ? upcomingPayouts[0] : null;

  return (
    <div className="space-y-8 animate-fade-in">
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

      {/* Welcome Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Welcome back, {userName || 'Member'}</h1>
          {isAgent && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <Crown className="w-3 h-3 mr-1" />
              Agent
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">Manage your savings, track your contributions, and explore opportunities.</p>
        {!isAgent && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
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

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-card border-border/20 shadow-glass">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Total Contributions</span>
            </div>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold">${totalBalance}</div>
            <div className="text-sm text-muted-foreground">
              Across {activeGroups.length} active groups
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card border-border/20 shadow-glass">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Reputation Score</span>
            </div>
            <Badge className="bg-accent/10 text-accent hover:bg-accent/20">
              {userInfo && !userInfo[6] ? 'Good Standing' : 'Verified'}
            </Badge>
          </div>
          <div className="space-y-3">
            <div className="text-3xl font-bold">{userInfo ? userInfo[7]?.toString() : '0'}</div>
            <div className="text-sm text-muted-foreground">
              {userInfo && userInfo[6] ? 'Has defaults' : 'Excellent Saver Status'}
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card border-border/20 shadow-glass">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Next Payout</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold">
              {nextPayout ? getTimeRemaining(nextPayout[13]) : 'None'}
            </div>
            <div className="text-sm text-muted-foreground">
              {nextPayout 
                ? `${nextPayout[1]} • $${formatTokenAmount(nextPayout[5] * nextPayout[7])} expected`
                : 'No upcoming payouts'
              }
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Active Circles */}
        <Card className="lg:col-span-2 p-6 bg-gradient-card border-border/20 shadow-glass">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Active Savings Circles</h2>
            {isAgent ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="shadow-glow">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Circle
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card-glass backdrop-blur-xl border-border/20 max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Savings Circle</DialogTitle>
                  <DialogDescription>
                    Set up a new rotating savings group for your community.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      id="groupName"
                      placeholder="e.g., Family Savings Circle"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="groupDescription">Description (Optional)</Label>
                    <Input
                      id="groupDescription"
                      placeholder="Brief description of the group"
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contributionAmount">Contribution Amount</Label>
                    <Input
                      id="contributionAmount"
                      type="number"
                      placeholder="0.00"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="token">Token</Label>
                    <Select value={selectedToken} onValueChange={setSelectedToken}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSupportedTokens().map((token) => (
                          <SelectItem key={token.address} value={token.address}>
                            {token.symbol} - {token.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="groupSize">Group Size</Label>
                    <Input
                      id="groupSize"
                      type="number"
                      min="2"
                      max="20"
                      value={groupSize}
                      onChange={(e) => setGroupSize(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCreateGroup}
                      disabled={!groupName || !contributionAmount || !selectedToken || isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? 'Creating...' : 'Create Circle'}
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowAgentRegistration(true)}
                className="shadow-glow"
              >
                <Crown className="h-4 w-4 mr-2" />
                Become Agent to Create
              </Button>
            )}
          </div>
          
          <div className="space-y-6">
            {activeGroups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No active circles yet</p>
              </div>
            ) : (
              activeGroups.slice(0, 3).map((group, index) => (
                <div key={group[0]}>
                  <div className="p-4 rounded-lg bg-background/50 border border-border/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{group[1]}</div>
                          <div className="text-sm text-muted-foreground">{group[6]?.toString()} members</div>
                        </div>
                      </div>
                      <div className="text-right flex gap-2">
                        <div>
                          <div className="font-semibold">${formatTokenAmount(group[5])}</div>
                          <Badge variant={group[14] === address ? "default" : "secondary"} className="text-xs">
                            {group[14] === address ? "Your Turn Next" : 
                             !group.contributionStatus?.[0] ? "Contribute" : "Active"}
                          </Badge>
                        </div>
                        {group[14] === address && (
                          <Button 
                            size="sm"
                            onClick={() => handleClaimPayout(group[0])}
                            disabled={isProcessing}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Claim
                          </Button>
                        )}
                        {!group.contributionStatus?.[0] && group[14] !== address && (
                          <Button 
                            size="sm"
                            onClick={() => handleContribute(group[0], group[4], group[5])}
                            disabled={isProcessing}
                            className="bg-primary hover:bg-primary/90"
                          >
                            Pay
                          </Button>
                        )}
                        {group[2] === address && (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateInviteCode(group[0])}
                            className="text-xs"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Invite
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Round {group[8]?.toString()} of {group[9]?.toString()}
                    </div>
                  </div>
                  {index < 2 && (
                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-1 h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20"></div>
                      <div className="w-3 h-3 rounded-full bg-gradient-primary shadow-glow animate-pulse"></div>
                      <div className="flex-1 h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20"></div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6 bg-gradient-card border-border/20 shadow-glass">
          <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
          
          <div className="space-y-4">
            {/* Show recent contributions and payouts based on group activity */}
            {activeGroups.slice(0, 4).map((group, index) => {
              const isRecent = group[14] === address;
              const isPaid = group.contributionStatus?.[0];
              
              return (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-background/50 transition-colors">
                  <div className={`p-2 rounded-full ${
                    isRecent ? 'bg-accent/10 text-accent' : isPaid ? 'bg-primary/10 text-primary' : 'bg-muted'
                  }`}>
                    {isRecent ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {isRecent ? `Ready for payout: ${group[1]}` : 
                       isPaid ? `Contributed to ${group[1]}` : `Pending: ${group[1]}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isRecent ? 'Your turn to collect' : 'This round'}
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    isRecent ? 'text-accent' : 'text-muted-foreground'
                  }`}>
                    {isRecent ? `+$${formatTokenAmount(group[5] * group[7])}` : `-$${formatTokenAmount(group[5])}`}
                  </div>
                </div>
              );
            })}
          </div>
          
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All Activity
          </Button>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-card border-border/20 shadow-glass">
        <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex flex-col items-center gap-2 h-auto py-4 shadow-glow">
                <Plus className="h-5 w-5" />
                <span>Join Circle</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card-glass backdrop-blur-xl border-border/20">
              <DialogHeader>
                <DialogTitle>Join a Savings Circle</DialogTitle>
                <DialogDescription>
                  Enter an invite code to join an existing savings group.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="joinInviteCode">Invite Code</Label>
                  <Input
                    id="joinInviteCode"
                    placeholder="e.g., BONDFI-XXXXXXXX"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Ask the circle owner for the invite code to join their group.
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => selectedGroupToJoin && handleJoinGroup(selectedGroupToJoin)}
                    disabled={!inviteCode.trim() || isProcessing}
                    className="flex-1"
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
          <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
            <ArrowUpRight className="h-5 w-5" />
            <span>Contribute</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
            <TrendingUp className="h-5 w-5" />
            <span>View Credit</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
            <Users className="h-5 w-5" />
            <span>Invite Friends</span>
          </Button>
        </div>
      </Card>

      {/* Platform Statistics */}
      {totalStats && (
        <Card className="p-6 bg-gradient-card border-border/20 shadow-glass">
          <h3 className="text-lg font-semibold mb-4 text-center">Platform Statistics</h3>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold">{totalStats[0]?.toString()}</div>
              <div className="text-sm text-muted-foreground">Total Groups</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">{totalStats[1]?.toString()}</div>
              <div className="text-sm text-muted-foreground">Active Groups</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{totalStats[2]?.toString()}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
        </Card>
      )}

      {/* Invite Code Modal */}
      <Dialog open={showInviteCodeModal} onOpenChange={setShowInviteCodeModal}>
        <DialogContent className="bg-card-glass backdrop-blur-xl border-border/20">
          <DialogHeader>
            <DialogTitle>Invite Code for {selectedGroupForInvite?.[1]}</DialogTitle>
            <DialogDescription>
              Share this invite code with people you want to join your savings circle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-background/50 rounded-lg border border-border/20">
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg">{currentInviteCode}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopyInviteCode}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              This code allows others to join your savings circle. Keep it secure and only share with trusted members.
            </div>
            <Button 
              onClick={() => setShowInviteCodeModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Phone, email, or other contact details"
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowAgentRegistration(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRegisterUserAsAgent}
                  disabled={!agentContactInfo.trim() || isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? 'Registering...' : 'Register as Agent'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}