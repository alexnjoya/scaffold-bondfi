"use client";

import React, { useState } from 'react';
import { Button } from "~~/components/ui/button";
import { BasePayButton as BasePayButtonUI } from '@base-org/account-ui/react';
import { useBaseAccount } from '@/provider/BaseAccountProvider';
import { Loader, Check, AlertCircle } from 'lucide-react';

interface BasePayButtonProps {
  amount: string;
  to: string;
  testnet?: boolean;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  children?: React.ReactNode;
}

export const BasePayButton: React.FC<BasePayButtonProps> = ({
  amount,
  to,
  testnet = true,
  onSuccess,
  onError,
  className = '',
  variant = 'default',
  size = 'default',
  disabled = false,
  children,
}) => {
  const { makePayment, isProcessing, paymentStatus } = useBaseAccount();
  const [isCompleted, setIsCompleted] = useState(false);

  const handlePayment = async () => {
    try {
      const paymentId = await makePayment(amount, to, testnet);
      if (paymentId) {
        setIsCompleted(true);
        onSuccess?.(paymentId);
      } else {
        onError?.('Payment failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      onError?.(errorMessage);
    }
  };

  if (isCompleted) {
    return (
      <Button
        variant="outline"
        size={size}
        className={`${className} border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}
        disabled
      >
        <Check className="w-4 h-4 mr-2" />
        Payment Sent
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
        Processing...
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <BasePayButtonUI
        colorScheme="light"
        onClick={handlePayment}
        disabled={disabled}
        className={className}
      >
        {children || `Pay ${amount} USDC`}
      </BasePayButtonUI>
      
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
