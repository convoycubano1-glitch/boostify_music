import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, polygonMumbai } from 'wagmi/chains';

// WalletConnect Project ID - debe ser válido de https://cloud.walletconnect.com
// Si el proyecto da error 403, significa que el projectId no está registrado o expiró
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

let wagmiConfigInstance: ReturnType<typeof getDefaultConfig> | null = null;

export function getWagmiConfig() {
  if (!wagmiConfigInstance) {
    try {
      wagmiConfigInstance = getDefaultConfig({
        appName: 'Boostify Music',
        projectId: WALLETCONNECT_PROJECT_ID,
        chains: [
          polygon,
          polygonMumbai,
        ],
        ssr: false,
      });
    } catch (error) {
      console.error('[Web3Config] Error initializing wagmi config:', error);
      // Crear config mínima sin WalletConnect
      wagmiConfigInstance = getDefaultConfig({
        appName: 'Boostify Music',
        projectId: 'demo',
        chains: [polygon],
        ssr: false,
      });
    }
  }
  return wagmiConfigInstance;
}

// Para compatibilidad con código existente
export const wagmiConfig = getWagmiConfig();

// BTF-2300 ArtistToken Contract - DEPLOYED ON POLYGON MAINNET
export const BOOSTIFY_CONTRACT_ADDRESS = '0x76F4c51204E096f6993A6171B524A7AaedDcD723';

export const ERC1155_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'buyTokens',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'uri',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
