/**
 * useBTF2300 - Hook para interactuar con los contratos BTF-2300 en Polygon
 * 
 * Este hook proporciona funciones para:
 * - Comprar tokens de artistas (buyTokens)
 * - Vender tokens (sellTokens via DEX)
 * - Añadir/remover liquidez
 * - Consultar balances y precios
 * - Reclamar royalties
 */

import { useState, useCallback, useEffect } from 'react';
import { parseEther, formatEther, createPublicClient, http, createWalletClient, custom } from 'viem';
import { polygon } from 'viem/chains';
import { useWeb3 } from './use-web3';
import { useToast } from './use-toast';
import {
  BTF2300_ADDRESSES,
  BTF2300_ARTIST_TOKEN_ABI,
  BTF2300_DEX_ABI,
  BTF2300_ROYALTIES_ABI,
  TOKEN_PREFIXES,
  getBTF2300Addresses,
} from '@/lib/btf2300-config';

// Contract addresses on Polygon Mainnet
const CHAIN_ID = 137;
const contracts = getBTF2300Addresses(CHAIN_ID);

// Create public client for reading contract state
const publicClient = createPublicClient({
  chain: polygon,
  transport: http('https://polygon-rpc.com'),
});

// Types
export interface ArtistOnChain {
  artistId: bigint;
  walletAddress: string;
  artistName: string;
  profileURI: string;
  totalEarnings: bigint;
  totalSongs: bigint;
  isVerified: boolean;
  isActive: boolean;
  registeredAt: bigint;
}

export interface SongOnChain {
  tokenId: bigint;
  artistId: bigint;
  title: string;
  metadataURI: string;
  totalSupply: bigint;
  availableSupply: bigint;
  pricePerToken: bigint;
  isActive: boolean;
  totalEarnings: bigint;
  createdAt: bigint;
}

export interface PoolInfo {
  tokenReserve: bigint;
  ethReserve: bigint;
  totalLPTokens: bigint;
  feeAccumulated: bigint;
  isActive: boolean;
}

export interface TransactionResult {
  hash: `0x${string}`;
  success: boolean;
  error?: string;
}

export function useBTF2300() {
  const { address, isConnected, chainId } = useWeb3();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  // Get wallet client for transactions
  const getWalletClient = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }
    
    // Request account access if needed
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Check if on Polygon network
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (parseInt(currentChainId, 16) !== CHAIN_ID) {
      // Switch to Polygon
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
        });
      } catch (switchError: any) {
        // Chain not added, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${CHAIN_ID.toString(16)}`,
              chainName: 'Polygon Mainnet',
              nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
              rpcUrls: ['https://polygon-rpc.com'],
              blockExplorerUrls: ['https://polygonscan.com'],
            }],
          });
        } else {
          throw switchError;
        }
      }
    }
    
    return createWalletClient({
      chain: polygon,
      transport: custom(window.ethereum),
    });
  }, []);

  // ============================================
  // READ FUNCTIONS
  // ============================================

  /**
   * Get artist info from blockchain
   */
  const getArtist = useCallback(async (artistId: number): Promise<ArtistOnChain | null> => {
    try {
      const result = await publicClient.readContract({
        address: contracts.artistToken as `0x${string}`,
        abi: BTF2300_ARTIST_TOKEN_ABI,
        functionName: 'artists',
        args: [BigInt(artistId)],
      }) as any;
      
      return {
        artistId: result[0],
        walletAddress: result[1],
        artistName: result[2],
        profileURI: result[3],
        totalEarnings: result[4],
        totalSongs: result[5],
        isVerified: result[6],
        isActive: result[7],
        registeredAt: result[8],
      };
    } catch (error) {
      console.error('Error getting artist:', error);
      return null;
    }
  }, []);

  /**
   * Get song info from blockchain
   */
  const getSong = useCallback(async (songId: number): Promise<SongOnChain | null> => {
    try {
      const tokenId = TOKEN_PREFIXES.SONG + songId;
      const result = await publicClient.readContract({
        address: contracts.artistToken as `0x${string}`,
        abi: BTF2300_ARTIST_TOKEN_ABI,
        functionName: 'songs',
        args: [BigInt(tokenId)],
      }) as any;
      
      return {
        tokenId: result[0],
        artistId: result[1],
        title: result[2],
        metadataURI: result[3],
        totalSupply: result[4],
        availableSupply: result[5],
        pricePerToken: result[6],
        isActive: result[7],
        totalEarnings: result[8],
        createdAt: result[9],
      };
    } catch (error) {
      console.error('Error getting song:', error);
      return null;
    }
  }, []);

  /**
   * Get token balance for user
   */
  const getTokenBalance = useCallback(async (tokenId: number, userAddress?: string): Promise<bigint> => {
    const addr = userAddress || address;
    if (!addr) return BigInt(0);
    
    try {
      const balance = await publicClient.readContract({
        address: contracts.artistToken as `0x${string}`,
        abi: BTF2300_ARTIST_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [addr as `0x${string}`, BigInt(tokenId)],
      }) as bigint;
      
      return balance;
    } catch (error) {
      console.error('Error getting balance:', error);
      return BigInt(0);
    }
  }, [address]);

  /**
   * Get current token counts
   */
  const getTokenCounts = useCallback(async () => {
    try {
      const result = await publicClient.readContract({
        address: contracts.artistToken as `0x${string}`,
        abi: BTF2300_ARTIST_TOKEN_ABI,
        functionName: 'getCurrentTokenCounts',
      }) as [bigint, bigint, bigint, bigint];
      
      return {
        totalArtists: Number(result[0]),
        totalSongs: Number(result[1]),
        totalCatalogs: Number(result[2]),
        totalLicenses: Number(result[3]),
      };
    } catch (error) {
      console.error('Error getting token counts:', error);
      return { totalArtists: 0, totalSongs: 0, totalCatalogs: 0, totalLicenses: 0 };
    }
  }, []);

  /**
   * Get DEX pool info
   */
  const getPoolInfo = useCallback(async (tokenId: number): Promise<PoolInfo | null> => {
    try {
      const result = await publicClient.readContract({
        address: contracts.dex as `0x${string}`,
        abi: BTF2300_DEX_ABI,
        functionName: 'getPoolInfo',
        args: [BigInt(tokenId)],
      }) as [bigint, bigint, bigint, bigint, boolean];
      
      return {
        tokenReserve: result[0],
        ethReserve: result[1],
        totalLPTokens: result[2],
        feeAccumulated: result[3],
        isActive: result[4],
      };
    } catch (error) {
      console.error('Error getting pool info:', error);
      return null;
    }
  }, []);

  /**
   * Get expected tokens out for a given ETH amount
   */
  const getExpectedTokensOut = useCallback(async (tokenId: number, ethAmount: string): Promise<bigint> => {
    try {
      const ethWei = parseEther(ethAmount);
      const result = await publicClient.readContract({
        address: contracts.dex as `0x${string}`,
        abi: BTF2300_DEX_ABI,
        functionName: 'getExpectedTokensOut',
        args: [BigInt(tokenId), ethWei],
      }) as bigint;
      
      return result;
    } catch (error) {
      console.error('Error getting expected tokens:', error);
      return BigInt(0);
    }
  }, []);

  /**
   * Get expected ETH out for a given token amount
   */
  const getExpectedEthOut = useCallback(async (tokenId: number, tokenAmount: number): Promise<string> => {
    try {
      const result = await publicClient.readContract({
        address: contracts.dex as `0x${string}`,
        abi: BTF2300_DEX_ABI,
        functionName: 'getExpectedEthOut',
        args: [BigInt(tokenId), BigInt(tokenAmount)],
      }) as bigint;
      
      return formatEther(result);
    } catch (error) {
      console.error('Error getting expected ETH:', error);
      return '0';
    }
  }, []);

  /**
   * Get claimable royalties
   */
  const getClaimableRoyalties = useCallback(async (tokenId: number, userAddress?: string): Promise<string> => {
    const addr = userAddress || address;
    if (!addr) return '0';
    
    try {
      const result = await publicClient.readContract({
        address: contracts.royalties as `0x${string}`,
        abi: BTF2300_ROYALTIES_ABI,
        functionName: 'getClaimableAmount',
        args: [BigInt(tokenId), addr as `0x${string}`],
      }) as bigint;
      
      return formatEther(result);
    } catch (error) {
      console.error('Error getting claimable royalties:', error);
      return '0';
    }
  }, [address]);

  // ============================================
  // WRITE FUNCTIONS
  // ============================================

  /**
   * Buy tokens directly from ArtistToken contract
   */
  const buyTokensDirect = useCallback(async (
    tokenId: number,
    amount: number,
    maxPricePerToken: string
  ): Promise<TransactionResult> => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet no conectada",
        description: "Conecta tu wallet para comprar tokens",
        variant: "destructive",
      });
      return { hash: '0x0' as `0x${string}`, success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    try {
      const walletClient = await getWalletClient();
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
      const priceWei = parseEther(maxPricePerToken);
      const totalValue = priceWei * BigInt(amount);

      toast({
        title: "🔄 Procesando transacción...",
        description: `Comprando ${amount} tokens por ${formatEther(totalValue)} MATIC`,
      });

      const hash = await walletClient.writeContract({
        address: contracts.artistToken as `0x${string}`,
        abi: BTF2300_ARTIST_TOKEN_ABI,
        functionName: 'buyTokens',
        args: [BigInt(tokenId), BigInt(amount), priceWei, deadline],
        value: totalValue,
        account: address as `0x${string}`,
      });

      setTxHash(hash);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        toast({
          title: "✅ Compra exitosa!",
          description: `Transacción confirmada: ${hash.slice(0, 10)}...`,
        });
        return { hash, success: true };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('Buy tokens error:', error);
      toast({
        title: "❌ Error en la compra",
        description: error.message || "No se pudo procesar la transacción",
        variant: "destructive",
      });
      return { hash: '0x0' as `0x${string}`, success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, getWalletClient, toast]);

  /**
   * Buy tokens from DEX pool
   */
  const buyTokensFromDEX = useCallback(async (
    tokenId: number,
    ethAmount: string,
    minTokensOut: number,
    slippage: number = 0.5
  ): Promise<TransactionResult> => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet no conectada",
        description: "Conecta tu wallet para comprar tokens",
        variant: "destructive",
      });
      return { hash: '0x0' as `0x${string}`, success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    try {
      const walletClient = await getWalletClient();
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const ethWei = parseEther(ethAmount);
      const minOut = BigInt(Math.floor(minTokensOut * (1 - slippage / 100)));

      toast({
        title: "🔄 Procesando swap...",
        description: `Comprando tokens con ${ethAmount} MATIC`,
      });

      const hash = await walletClient.writeContract({
        address: contracts.dex as `0x${string}`,
        abi: BTF2300_DEX_ABI,
        functionName: 'buyTokens',
        args: [BigInt(tokenId), minOut, deadline],
        value: ethWei,
        account: address as `0x${string}`,
      });

      setTxHash(hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        toast({
          title: "✅ Swap exitoso!",
          description: `Recibiste tokens. TX: ${hash.slice(0, 10)}...`,
        });
        return { hash, success: true };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('DEX buy error:', error);
      toast({
        title: "❌ Error en el swap",
        description: error.message || "No se pudo procesar el swap",
        variant: "destructive",
      });
      return { hash: '0x0' as `0x${string}`, success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, getWalletClient, toast]);

  /**
   * Sell tokens via DEX
   */
  const sellTokens = useCallback(async (
    tokenId: number,
    tokenAmount: number,
    minEthOut: string,
    slippage: number = 0.5
  ): Promise<TransactionResult> => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet no conectada",
        description: "Conecta tu wallet para vender tokens",
        variant: "destructive",
      });
      return { hash: '0x0' as `0x${string}`, success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    try {
      const walletClient = await getWalletClient();
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const minEthWei = parseEther(minEthOut);
      const minWithSlippage = (minEthWei * BigInt(Math.floor((1 - slippage / 100) * 1000))) / BigInt(1000);

      toast({
        title: "🔄 Procesando venta...",
        description: `Vendiendo ${tokenAmount} tokens`,
      });

      const hash = await walletClient.writeContract({
        address: contracts.dex as `0x${string}`,
        abi: BTF2300_DEX_ABI,
        functionName: 'sellTokens',
        args: [BigInt(tokenId), BigInt(tokenAmount), minWithSlippage, deadline],
        account: address as `0x${string}`,
      });

      setTxHash(hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        toast({
          title: "✅ Venta exitosa!",
          description: `Recibiste MATIC. TX: ${hash.slice(0, 10)}...`,
        });
        return { hash, success: true };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('Sell tokens error:', error);
      toast({
        title: "❌ Error en la venta",
        description: error.message || "No se pudo procesar la venta",
        variant: "destructive",
      });
      return { hash: '0x0' as `0x${string}`, success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, getWalletClient, toast]);

  /**
   * Add liquidity to DEX pool
   */
  const addLiquidity = useCallback(async (
    tokenId: number,
    tokenAmount: number,
    ethAmount: string,
    minLPTokens: number = 0
  ): Promise<TransactionResult> => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet no conectada",
        description: "Conecta tu wallet para añadir liquidez",
        variant: "destructive",
      });
      return { hash: '0x0' as `0x${string}`, success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    try {
      const walletClient = await getWalletClient();
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const ethWei = parseEther(ethAmount);

      toast({
        title: "🔄 Añadiendo liquidez...",
        description: `${tokenAmount} tokens + ${ethAmount} MATIC`,
      });

      const hash = await walletClient.writeContract({
        address: contracts.dex as `0x${string}`,
        abi: BTF2300_DEX_ABI,
        functionName: 'addLiquidity',
        args: [BigInt(tokenId), BigInt(tokenAmount), BigInt(minLPTokens), deadline],
        value: ethWei,
        account: address as `0x${string}`,
      });

      setTxHash(hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        toast({
          title: "✅ Liquidez añadida!",
          description: `Recibiste LP tokens. TX: ${hash.slice(0, 10)}...`,
        });
        return { hash, success: true };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('Add liquidity error:', error);
      toast({
        title: "❌ Error al añadir liquidez",
        description: error.message || "No se pudo procesar la transacción",
        variant: "destructive",
      });
      return { hash: '0x0' as `0x${string}`, success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, getWalletClient, toast]);

  /**
   * Claim royalties
   */
  const claimRoyalties = useCallback(async (tokenId: number): Promise<TransactionResult> => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet no conectada",
        description: "Conecta tu wallet para reclamar royalties",
        variant: "destructive",
      });
      return { hash: '0x0' as `0x${string}`, success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    try {
      const walletClient = await getWalletClient();

      toast({
        title: "🔄 Reclamando royalties...",
        description: "Procesando transacción",
      });

      const hash = await walletClient.writeContract({
        address: contracts.royalties as `0x${string}`,
        abi: BTF2300_ROYALTIES_ABI,
        functionName: 'claimHolderRoyalties',
        args: [BigInt(tokenId)],
        account: address as `0x${string}`,
      });

      setTxHash(hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        toast({
          title: "✅ Royalties reclamados!",
          description: `TX: ${hash.slice(0, 10)}...`,
        });
        return { hash, success: true };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('Claim royalties error:', error);
      toast({
        title: "❌ Error al reclamar royalties",
        description: error.message || "No se pudo procesar la transacción",
        variant: "destructive",
      });
      return { hash: '0x0' as `0x${string}`, success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, getWalletClient, toast]);

  return {
    // State
    isLoading,
    txHash,
    isConnected,
    address,
    chainId,
    
    // Contract addresses
    contracts,
    
    // Read functions
    getArtist,
    getSong,
    getTokenBalance,
    getTokenCounts,
    getPoolInfo,
    getExpectedTokensOut,
    getExpectedEthOut,
    getClaimableRoyalties,
    
    // Write functions
    buyTokensDirect,
    buyTokensFromDEX,
    sellTokens,
    addLiquidity,
    claimRoyalties,
  };
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}
