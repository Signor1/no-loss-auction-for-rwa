'use client';

import { createConfig, http } from 'wagmi';
import { base, baseSepolia, mainnet, sepolia } from 'wagmi/chains';
import { 
  injected, 
  walletConnect, 
  coinbaseWallet,
  metaMask,
  rainbowWallet,
  safe
} from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

export const config = createConfig({
  chains: [base, baseSepolia, mainnet, sepolia],
  connectors: [
    // MetaMask - Most popular wallet
    metaMask(),
    
    // Coinbase Wallet - Native Base integration
    coinbaseWallet({
      appName: 'No-Loss Auction',
      appLogoUrl: 'https://no-loss-auction.com/logo.png',
    }),
    
    // Rainbow Wallet - Multi-chain support
    rainbowWallet(),
    
    // WalletConnect v2 - Universal connector
    walletConnect({ 
      projectId,
      metadata: {
        name: 'No-Loss Auction',
        description: 'RWA No-Loss Auction Platform',
        url: 'https://no-loss-auction.com',
        icons: ['https://no-loss-auction.com/logo.png']
      }
    }),
    
    // Base Wallet - Native Base wallet
    injected({
      target: 'com.base.wallet',
    }),
    
    // Safe - Multi-sig wallet support
    safe(),
    
    // Generic injected wallets (catch-all)
    injected(),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

export { base, baseSepolia, mainnet, sepolia };
