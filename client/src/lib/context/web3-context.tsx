import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';

// Lazy load wagmi hooks to avoid "useConfig must be used within WagmiProvider" error
let useAccountHook: any = null;
let useBalanceHook: any = null;
let useChainIdHook: any = null;

interface Web3ContextType {
  isWeb3Ready: boolean;
  address?: `0x${string}`;
  isConnected: boolean;
  chainId?: number;
  balance?: string;
  balanceFormatted?: string;
  symbol?: string;
}

const defaultWeb3Context: Web3ContextType = {
  isWeb3Ready: false,
  address: undefined,
  isConnected: false,
  chainId: undefined,
  balance: undefined,
  balanceFormatted: undefined,
  symbol: undefined,
};

const Web3Context = createContext<Web3ContextType>(defaultWeb3Context);

// Provider for when Web3 is NOT ready - provides default values
export function Web3NotReadyProvider({ children }: { children: ReactNode }) {
  return (
    <Web3Context.Provider value={defaultWeb3Context}>
      {children}
    </Web3Context.Provider>
  );
}

// Provider for when Web3 IS ready - provides actual wagmi data
export function Web3ReadyInternalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Web3ContextType>({ ...defaultWeb3Context, isWeb3Ready: true });
  
  // Load wagmi hooks lazily
  useEffect(() => {
    try {
      const wagmi = require('wagmi');
      useAccountHook = wagmi.useAccount;
      useBalanceHook = wagmi.useBalance;
      useChainIdHook = wagmi.useChainId;
    } catch {
      console.warn('[Web3Context] Could not load wagmi hooks');
    }
  }, []);
  
  // Use wagmi hooks if available
  const accountData = useAccountHook?.() || { address: undefined, isConnected: false };
  const chainId = useChainIdHook?.() || undefined;
  const balanceData = useBalanceHook?.({ address: accountData.address });

  const value = useMemo<Web3ContextType>(() => ({
    isWeb3Ready: true,
    address: accountData.address,
    isConnected: accountData.isConnected,
    chainId,
    balance: balanceData?.data?.value?.toString(),
    balanceFormatted: balanceData?.data?.formatted,
    symbol: balanceData?.data?.symbol,
  }), [accountData.address, accountData.isConnected, chainId, balanceData?.data]);

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3Context() {
  return useContext(Web3Context);
}

// Legacy compatibility - keeping old interface
export function Web3ReadyProvider({ children, isReady }: { children: ReactNode; isReady: boolean }) {
  // This is just a pass-through now, the actual provider choice is in App.tsx
  return <>{children}</>;
}

export function useWeb3Ready() {
  const ctx = useContext(Web3Context);
  return { isWeb3Ready: ctx.isWeb3Ready };
}
