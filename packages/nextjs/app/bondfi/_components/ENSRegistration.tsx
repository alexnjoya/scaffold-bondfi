"use client";

import React, { useState } from 'react';
import { Card } from "~~/components/ui/card";
import { Button } from "~~/components/ui/button";
import { Input } from "~~/components/ui/input";
import { Label } from "~~/components/ui/label";
import { Badge } from "~~/components/ui/badge";
import { 
  User, 
  Check, 
  AlertCircle, 
  Loader2,
  Copy,
  ExternalLink,
  Shield,
  Zap,
  Globe
} from "lucide-react";
import { useContractInstances } from '@/provider/ContractInstanceProvider';

export function ENSRegistration() {
  const { isConnected, address } = useContractInstances();
  const [ensName, setEnsName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Validate ENS name format
  const validateENSName = (name: string) => {
    if (!name) return { valid: false, message: 'ENS name is required' };
    if (!name.endsWith('.eth')) return { valid: false, message: 'ENS name must end with .eth' };
    if (name.length < 7) return { valid: false, message: 'ENS name must be at least 3 characters (plus .eth)' };
    if (name.length > 255) return { valid: false, message: 'ENS name is too long' };
    if (!/^[a-z0-9-]+\.eth$/i.test(name)) return { valid: false, message: 'ENS name can only contain letters, numbers, and hyphens' };
    return { valid: true, message: '' };
  };

  // Register ENS name
  const registerENS = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    const validation = validateENSName(ensName);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setIsRegistering(true);
    setError('');
    setRegistrationResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ens_name: ensName,
          eth_address: address
        })
      });

      const data = await response.json();

      if (response.ok) {
        setRegistrationResult(data);
        setEnsName(''); // Clear the form
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('ENS registration failed:', error);
      setError('Failed to register ENS name. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Success Screen
  if (registrationResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center bg-gradient-card border-border/20 shadow-glass">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">ENS Name Registered Successfully!</h2>
          <p className="text-muted-foreground mb-6">
            Your ENS name has been successfully registered and is now active.
          </p>
          
          <div className="bg-background/50 rounded-xl p-6 mb-6 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <span className="font-medium">ENS Name</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{registrationResult.data?.ens_name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(registrationResult.data?.ens_name)}
                  className="h-8 w-8 p-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-medium">Address</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {registrationResult.data?.eth_address?.slice(0, 6)}...{registrationResult.data?.eth_address?.slice(-4)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(registrationResult.data?.eth_address)}
                  className="h-8 w-8 p-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => setRegistrationResult(null)} 
              variant="outline"
            >
              Register Another
            </Button>
            <Button 
              onClick={() => window.location.href = '/bondfi/remittances'} 
              className="bg-primary hover:bg-primary/90"
            >
              Send Money
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Register ENS Name</h1>
        <p className="text-muted-foreground">Register a human-readable name for your wallet address. Make sending and receiving payments easier.</p>
      </div>

      {/* Wallet Connection Warning */}
      {!isConnected && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-yellow-800 font-medium">Wallet not connected</p>
              <p className="text-yellow-600 text-sm">Please connect your wallet to register an ENS name</p>
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Registration Form */}
        <Card className="lg:col-span-2 p-6 bg-gradient-card border-border/20 shadow-glass">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Register ENS Name</h2>
          </div>

          <div className="space-y-6">
            {/* Current Address Display */}
            {isConnected && address && (
              <div className="p-4 bg-background/50 rounded-lg border border-border/20">
                <Label className="text-sm font-medium text-muted-foreground">Your Wallet Address</Label>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-mono text-sm flex-1">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(address)}
                    className="h-8 w-8 p-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* ENS Name Input */}
            <div className="space-y-2">
              <Label htmlFor="ensName">ENS Name</Label>
              <div className="relative">
                <Input 
                  id="ensName" 
                  placeholder="yourname.eth" 
                  className="pl-8"
                  value={ensName}
                  onChange={(e) => {
                    setEnsName(e.target.value.toLowerCase());
                    setError(''); // Clear error when user types
                  }}
                  disabled={!isConnected || isRegistering}
                />
                <User className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Choose a unique name ending with .eth (e.g., john.eth, mary.eth)
              </p>
            </div>

            {/* Registration Preview */}
            {ensName && validateENSName(ensName).valid && (
              <Card className="p-4 bg-background/50 border-border/10">
                <h3 className="font-medium mb-3">Registration Preview</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ENS Name</span>
                    <span className="font-mono">{ensName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wallet Address</span>
                    <span className="font-mono text-xs">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="secondary" className="text-xs">
                      Ready to Register
                    </Badge>
                  </div>
                </div>
              </Card>
            )}

            {/* Register Button */}
            <Button 
              className="w-full bg-primary hover:bg-primary/90" 
              size="lg" 
              onClick={registerENS}
              disabled={!isConnected || !ensName || isRegistering || !validateENSName(ensName).valid}
            >
              {isRegistering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Register ENS Name
                </>
              )}
            </Button>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/10">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Zap className="h-5 w-5 text-accent" />
                </div>
                <div className="text-sm font-medium">Instant</div>
                <div className="text-xs text-muted-foreground">Immediate activation</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <div className="text-sm font-medium">Secure</div>
                <div className="text-xs text-muted-foreground">Blockchain verified</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Globe className="h-5 w-5 text-accent" />
                </div>
                <div className="text-sm font-medium">Global</div>
                <div className="text-xs text-muted-foreground">Works everywhere</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Benefits & Info */}
        <div className="space-y-6">
          {/* Benefits */}
          <Card className="p-6 bg-gradient-card border-border/20 shadow-glass">
            <h3 className="font-semibold mb-4">Why Register an ENS Name?</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Easy to Remember</div>
                  <div className="text-xs text-muted-foreground">No more copying long addresses</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Professional</div>
                  <div className="text-xs text-muted-foreground">Use your name for business</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Error Prevention</div>
                  <div className="text-xs text-muted-foreground">Reduce sending to wrong addresses</div>
                </div>
              </div>
            </div>
          </Card>

          {/* ENS Examples */}
          <Card className="p-6 bg-gradient-card border-border/20 shadow-glass">
            <h3 className="font-semibold mb-4">Popular ENS Names</h3>
            <div className="space-y-2">
              {[
                { name: "john.eth", description: "Personal use" },
                { name: "mary.eth", description: "Individual" },
                { name: "company.eth", description: "Business" },
                { name: "shop.eth", description: "Commerce" }
              ].map((example, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded bg-background/50">
                  <div>
                    <div className="font-mono text-sm">{example.name}</div>
                    <div className="text-xs text-muted-foreground">{example.description}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Available
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* How It Works */}
          <Card className="p-6 bg-gradient-card border-border/20 shadow-glass">
            <h3 className="font-semibold mb-4">How It Works</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                <span>Enter your desired ENS name</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                <span>Connect your wallet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                <span>Register and start using</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
