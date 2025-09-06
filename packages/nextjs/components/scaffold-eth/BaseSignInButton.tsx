"use client";

import React from 'react';
import { Button } from "~~/components/ui/button";
import { SignInWithBaseButton } from '@base-org/account-ui/react';
import { useBaseAccount } from '@/provider/BaseAccountProvider';
import { Loader, Check, AlertCircle } from 'lucide-react';

interface BaseSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  children?: React.ReactNode;
}

export const BaseSignInButton: React.FC<BaseSignInButtonProps> = ({
  onSuccess,
  onError,
  className = '',
  variant = 'default',
  size = 'default',
  disabled = false,
  children,
}) => {
  const { signIn, isProcessing, isSignedIn, paymentStatus } = useBaseAccount();

  const handleSignIn = async () => {
    try {
      await signIn();
      if (isSignedIn) {
        onSuccess?.();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      onError?.(errorMessage);
    }
  };

  if (isSignedIn) {
    return (
      <Button
        variant="outline"
        size={size}
        className={`${className} border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}
        disabled
      >
        <Check className="w-4 h-4 mr-2" />
        Connected to Base
      </Button>
    );
  }

  if (isProcessing) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
      >
        <Loader className="w-4 h-4 mr-2 animate-spin" />
        Connecting...
      </Button>
    );
  }

  return (
    <div className="space-y-2 relative z-10">
      <SignInWithBaseButton
        align="center"
        variant="solid"
        colorScheme="light"
        size="medium"
        onClick={handleSignIn}
        disabled={disabled}
        className={`${className} relative z-10`}
      >
        {children || 'Sign in with Base'}
      </SignInWithBaseButton>
      
      {paymentStatus && (
        <div className={`text-xs p-2 rounded ${
          paymentStatus.includes('failed') || paymentStatus.includes('error')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {paymentStatus}
        </div>
      )}
    </div>
  );
};
