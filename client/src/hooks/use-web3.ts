import { useAccount, useBalance, useChainId } from 'wagmi';
import { useMemo } from 'react';

export function useWeb3() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({
    address,
    enabled: !!address,
  });

  return useMemo(
    () => ({
      address,
      isConnected,
      chainId,
      balance: balance?.value.toString(),
      balanceFormatted: balance?.formatted,
      symbol: balance?.symbol,
    }),
    [address, isConnected, chainId, balance]
  );
}
