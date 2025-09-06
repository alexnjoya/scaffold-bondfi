"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createBaseAccountSDK, pay, getPaymentStatus } from '@base-org/account';

interface BaseAccountContextType {
  sdk: ReturnType<typeof createBaseAccountSDK> | null;
  isSignedIn: boolean;
  paymentStatus: string;
  paymentId: string;
  signIn: () => Promise<void>;
  signOut: () => void;
  makePayment: (amount: string, to: string, testnet?: boolean) => Promise<string | null>;
  checkPaymentStatus: (id: string) => Promise<string>;
  isProcessing: boolean;
}

const BaseAccountContext = createContext<BaseAccountContextType | undefined>(undefined);

interface BaseAccountProviderProps {
  children: ReactNode;
}

export const BaseAccountProvider: React.FC<BaseAccountProviderProps> = ({ children }) => {
  const [sdk, setSdk] = useState<ReturnType<typeof createBaseAccountSDK> | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize SDK
  useEffect(() => {
    const initializeSDK = () => {
      try {
        const baseSDK = createBaseAccountSDK({
          appName: 'BondFi - African Financial Platform',
          appLogo: '/logo.svg', // Update with your actual logo path
        });
        setSdk(baseSDK);
        console.log('Base Account SDK initialized');
      } catch (error) {
        console.error('Failed to initialize Base Account SDK:', error);
      }
    };

    initializeSDK();
  }, []);

  // Sign in with Base Account
  const signIn = async () => {
    if (!sdk) {
      console.error('SDK not initialized');
      return;
    }

    try {
      setIsProcessing(true);
      await sdk.getProvider().request({ method: 'wallet_connect' });
      setIsSignedIn(true);
      setPaymentStatus('Successfully connected to Base Account');
    } catch (error) {
      console.error('Sign in failed:', error);
      setPaymentStatus('Sign in failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Sign out
  const signOut = () => {
    setIsSignedIn(false);
    setPaymentStatus('');
    setPaymentId('');
  };

  // Make payment using Base Pay
  const makePayment = async (amount: string, to: string, testnet: boolean = true): Promise<string | null> => {
    if (!sdk) {
      console.error('SDK not initialized');
      return null;
    }

    try {
      setIsProcessing(true);
      setPaymentStatus('Processing payment...');
      
      const { id } = await pay({
        amount,
        to,
        testnet
      });

      setPaymentId(id);
      setPaymentStatus('Payment initiated! Click "Check Status" to see the result.');
      return id;
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus('Payment failed');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Check payment status
  const checkPaymentStatus = async (id: string): Promise<string> => {
    if (!sdk) {
      console.error('SDK not initialized');
      return 'SDK not initialized';
    }

    try {
      const { status } = await getPaymentStatus({ id });
      setPaymentStatus(`Payment status: ${status}`);
      return status;
    } catch (error) {
      console.error('Status check failed:', error);
      const errorMessage = 'Status check failed';
      setPaymentStatus(errorMessage);
      return errorMessage;
    }
  };

  const value: BaseAccountContextType = {
    sdk,
    isSignedIn,
    paymentStatus,
    paymentId,
    signIn,
    signOut,
    makePayment,
    checkPaymentStatus,
    isProcessing,
  };

  return (
    <BaseAccountContext.Provider value={value}>
      {children}
    </BaseAccountContext.Provider>
  );
};

export const useBaseAccount = (): BaseAccountContextType => {
  const context = useContext(BaseAccountContext);
  if (context === undefined) {
    throw new Error('useBaseAccount must be used within a BaseAccountProvider');
  }
  return context;
};
