'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';

// Types for user profile management
export interface UserProfile {
  id: string;
  address: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatar: string;
  banner: string;
  location: string;
  website: string;
  twitter: string;
  discord: string;
  telegram: string;
  createdAt: number;
  lastUpdated: number;
  isVerified: boolean;
  verificationLevel: 'basic' | 'enhanced' | 'premium';
  reputation: number;
  totalTransactions: number;
  totalVolume: number;
  joinDate: number;
  isActive: boolean;
  preferences: UserPreferences;
  privacy: PrivacySettings;
  notifications: NotificationSettings;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  defaultNetwork: string;
  gasSpeed: 'slow' | 'standard' | 'fast' | 'instant';
  showBalances: boolean;
  showNFTs: boolean;
  showDeFi: boolean;
  compactMode: boolean;
  animationsEnabled: boolean;
  soundEnabled: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showTransactions: boolean;
  showHoldings: boolean;
  showActivity: boolean;
  allowMessages: boolean;
  allowFriendRequests: boolean;
  showOnlineStatus: boolean;
  showReputation: boolean;
  dataSharing: boolean;
  analyticsTracking: boolean;
  marketingEmails: boolean;
  thirdPartyIntegrations: boolean;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  auctionUpdates: boolean;
  bidUpdates: boolean;
  outbidNotifications: boolean;
  wonAuctions: boolean;
  lostAuctions: boolean;
  paymentReminders: boolean;
  securityAlerts: boolean;
  systemUpdates: boolean;
  marketingUpdates: boolean;
  priceAlerts: boolean;
  newFeatures: boolean;
  weeklyDigest: boolean;
}

export interface ConnectedWallet {
  id: string;
  address: string;
  name: string;
  type: 'metamask' | 'walletconnect' | 'coinbase' | 'phantom' | 'other';
  isPrimary: boolean;
  isConnected: boolean;
  lastConnected: number;
  balance: string;
  chainId: number;
  network: string;
  tokenBalances: TokenBalance[];
}

export interface TokenBalance {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  balance: string;
  decimals: number;
  valueUSD: number;
  valueETH: number;
  priceChange24h: number;
  icon: string;
}

export interface Transaction {
  id: string;
  hash: string;
  type: 'send' | 'receive' | 'swap' | 'approve' | 'mint' | 'burn' | 'auction_bid' | 'auction_win' | 'auction_create';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  from: string;
  to: string;
  value: string;
  valueUSD: number;
  gasUsed: string;
  gasPrice: string;
  gasCost: number;
  blockNumber: number;
  confirmations: number;
  description: string;
  tokenSymbol?: string;
  tokenAddress?: string;
  nft?: NFTTransaction;
  auction?: AuctionTransaction;
}

export interface NFTTransaction {
  tokenId: string;
  contractAddress: string;
  tokenName: string;
  tokenImage: string;
  collectionName: string;
}

export interface AuctionTransaction {
  auctionId: string;
  assetTitle: string;
  assetImage: string;
  bidAmount: string;
  isWinning: boolean;
}

// Mock data
export const MOCK_USER_PROFILE: UserProfile = {
  id: 'user_1',
  address: '0x1234567890123456789012345678901234567890',
  username: 'john_doe',
  email: 'john.doe@example.com',
  displayName: 'John Doe',
  bio: 'Passionate about real estate tokenization and digital assets. Building the future of property investment.',
  avatar: '/avatars/default.png',
  banner: '/banners/default.png',
  location: 'New York, USA',
  website: 'https://johndoe.com',
  twitter: '@johndoe',
  discord: 'john_doe#1234',
  telegram: '@johndoe_crypto',
  createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
  lastUpdated: Date.now() - 2 * 24 * 60 * 60 * 1000,
  isVerified: true,
  verificationLevel: 'enhanced',
  reputation: 875,
  totalTransactions: 1247,
  totalVolume: 2847500,
  joinDate: Date.now() - 365 * 24 * 60 * 60 * 1000,
  isActive: true,
  preferences: {
    theme: 'system',
    language: 'en',
    timezone: 'America/New_York',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    defaultNetwork: 'ethereum',
    gasSpeed: 'standard',
    showBalances: true,
    showNFTs: true,
    showDeFi: true,
    compactMode: false,
    animationsEnabled: true,
    soundEnabled: true
  },
  privacy: {
    profileVisibility: 'public',
    showTransactions: true,
    showHoldings: true,
    showActivity: true,
    allowMessages: true,
    allowFriendRequests: true,
    showOnlineStatus: true,
    showReputation: true,
    dataSharing: false,
    analyticsTracking: true,
    marketingEmails: false,
    thirdPartyIntegrations: false
  },
  notifications: {
    email: true,
    push: true,
    inApp: true,
    auctionUpdates: true,
    bidUpdates: true,
    outbidNotifications: true,
    wonAuctions: true,
    lostAuctions: true,
    paymentReminders: true,
    securityAlerts: true,
    systemUpdates: true,
    marketingUpdates: false,
    priceAlerts: true,
    newFeatures: true,
    weeklyDigest: true
  }
};

export const MOCK_CONNECTED_WALLETS: ConnectedWallet[] = [
  {
    id: 'wallet_1',
    address: '0x1234567890123456789012345678901234567890',
    name: 'MetaMask',
    type: 'metamask',
    isPrimary: true,
    isConnected: true,
    lastConnected: Date.now(),
    balance: '2.456789',
    chainId: 1,
    network: 'Ethereum Mainnet',
    tokenBalances: [
      {
        tokenAddress: '0x0000000000000000000000000000000000000000',
        tokenSymbol: 'ETH',
        tokenName: 'Ethereum',
        balance: '2.456789',
        decimals: 18,
        valueUSD: 4913.58,
        valueETH: 2.456789,
        priceChange24h: 2.5,
        icon: '/tokens/eth.png'
      },
      {
        tokenAddress: '0xA0b86a33E6417c5c5c5c5c5c5c5c5c5c5c5c5c5c',
        tokenSymbol: 'USDC',
        tokenName: 'USD Coin',
        balance: '1250.50',
        decimals: 6,
        valueUSD: 1250.50,
        valueETH: 0.625,
        priceChange24h: 0.1,
        icon: '/tokens/usdc.png'
      }
    ]
  },
  {
    id: 'wallet_2',
    address: '0x2345678901234567890123456789012345678901',
    name: 'WalletConnect',
    type: 'walletconnect',
    isPrimary: false,
    isConnected: false,
    lastConnected: Date.now() - 2 * 24 * 60 * 60 * 1000,
    balance: '0.000000',
    chainId: 1,
    network: 'Ethereum Mainnet',
    tokenBalances: []
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    type: 'auction_bid',
    status: 'confirmed',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    from: '0x1234567890123456789012345678901234567890',
    to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
    value: '1000000000000000000',
    valueUSD: 2000,
    gasUsed: '21000',
    gasPrice: '20000000000',
    gasCost: 0.00042,
    blockNumber: 18500000,
    confirmations: 12,
    description: 'Bid placed on Luxury Manhattan Apartment',
    tokenSymbol: 'ETH',
    auction: {
      auctionId: 'auction_1',
      assetTitle: 'Luxury Manhattan Apartment',
      assetImage: '/assets/apartment.jpg',
      bidAmount: '1.0',
      isWinning: true
    }
  },
  {
    id: 'tx_2',
    hash: '0x2345678901bcdef1234567890bcdef1234567890bcdef1234567890bcdef123',
    type: 'receive',
    status: 'confirmed',
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    from: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
    to: '0x1234567890123456789012345678901234567890',
    value: '500000000000000000',
    valueUSD: 1000,
    gasUsed: '21000',
    gasPrice: '20000000000',
    gasCost: 0.00042,
    blockNumber: 18499950,
    confirmations: 62,
    description: 'Received ETH from external wallet',
    tokenSymbol: 'ETH'
  },
  {
    id: 'tx_3',
    hash: '0x3456789012cdef1234567890cdef1234567890cdef1234567890cdef123456',
    type: 'auction_win',
    status: 'confirmed',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    from: '0x1234567890123456789012345678901234567890',
    to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
    value: '2500000000000000000',
    valueUSD: 5000,
    gasUsed: '45000',
    gasPrice: '25000000000',
    gasCost: 0.001125,
    blockNumber: 18497500,
    confirmations: 2500,
    description: 'Won auction for Contemporary Art Piece',
    tokenSymbol: 'ETH',
    auction: {
      auctionId: 'auction_2',
      assetTitle: 'Contemporary Art Piece',
      assetImage: '/assets/art.jpg',
      bidAmount: '2.5',
      isWinning: true
    }
  }
];

// Main hook for user profile management
export function useUserProfile() {
  const { address } = useAccount();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);

  // Load user profile data
  const loadProfile = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfile(MOCK_USER_PROFILE);
      setConnectedWallets(MOCK_CONNECTED_WALLETS);
      setTransactions(MOCK_TRANSACTIONS);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;

    setIsUpdating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedProfile = {
        ...profile,
        ...updates,
        lastUpdated: Date.now()
      };

      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  // Update preferences
  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!profile) return;

    return updateProfile({
      preferences: {
        ...profile.preferences,
        ...preferences
      }
    });
  };

  // Update privacy settings
  const updatePrivacySettings = async (privacy: Partial<PrivacySettings>) => {
    if (!profile) return;

    return updateProfile({
      privacy: {
        ...profile.privacy,
        ...privacy
      }
    });
  };

  // Update notification settings
  const updateNotificationSettings = async (notifications: Partial<NotificationSettings>) => {
    if (!profile) return;

    return updateProfile({
      notifications: {
        ...profile.notifications,
        ...notifications
      }
    });
  };

  // Upload avatar
  const uploadAvatar = async (file: File) => {
    if (!profile) return;

    setIsUploadingAvatar(true);
    setAvatarUploadProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setAvatarUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const avatarUrl = URL.createObjectURL(file);

      await updateProfile({
        avatar: avatarUrl
      });

      return avatarUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    } finally {
      setIsUploadingAvatar(false);
      setAvatarUploadProgress(0);
    }
  };

  // Connect wallet
  const connectWallet = async (walletType: ConnectedWallet['type']) => {
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newWallet: ConnectedWallet = {
        id: `wallet_${Date.now()}`,
        address: '0x' + Math.random().toString(16).substr(2, 40),
        name: walletType.charAt(0).toUpperCase() + walletType.slice(1),
        type: walletType,
        isPrimary: false,
        isConnected: true,
        lastConnected: Date.now(),
        balance: '0.000000',
        chainId: 1,
        network: 'Ethereum Mainnet',
        tokenBalances: []
      };

      setConnectedWallets(prev => [...prev, newWallet]);
      return newWallet;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  // Disconnect wallet
  const disconnectWallet = async (walletId: string) => {
    try {
      setConnectedWallets(prev => 
        prev.map(wallet => 
          wallet.id === walletId 
            ? { ...wallet, isConnected: false }
            : wallet
        )
      );
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  };

  // Set primary wallet
  const setPrimaryWallet = async (walletId: string) => {
    try {
      setConnectedWallets(prev => 
        prev.map(wallet => ({
          ...wallet,
          isPrimary: wallet.id === walletId
        }))
      );
    } catch (error) {
      console.error('Error setting primary wallet:', error);
      throw error;
    }
  };

  // Get transaction history
  const getTransactionHistory = (limit?: number, offset?: number) => {
    let filtered = [...transactions].sort((a, b) => b.timestamp - a.timestamp);
    
    if (offset) {
      filtered = filtered.slice(offset);
    }
    
    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  };

  // Get transactions by type
  const getTransactionsByType = (type: Transaction['type']) => {
    return transactions.filter(tx => tx.type === type);
  };

  // Get wallet balance
  const getWalletBalance = (walletId: string) => {
    const wallet = connectedWallets.find(w => w.id === walletId);
    return wallet ? parseFloat(wallet.balance) : 0;
  };

  // Get total portfolio value
  const getTotalPortfolioValue = useMemo(() => {
    return connectedWallets.reduce((total, wallet) => {
      return total + wallet.tokenBalances.reduce((walletTotal, token) => {
        return walletTotal + token.valueUSD;
      }, 0);
    }, 0);
  }, [connectedWallets]);

  // Utility functions
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    if (address) {
      loadProfile();
    }
  }, [address]);

  return {
    // Data
    profile,
    connectedWallets,
    transactions,
    isLoading,
    isUpdating,
    isUploadingAvatar,
    avatarUploadProgress,
    totalPortfolioValue: getTotalPortfolioValue,

    // Actions
    loadProfile,
    updateProfile,
    updatePreferences,
    updatePrivacySettings,
    updateNotificationSettings,
    uploadAvatar,
    connectWallet,
    disconnectWallet,
    setPrimaryWallet,
    getTransactionHistory,
    getTransactionsByType,
    getWalletBalance,

    // Utilities
    formatAddress,
    formatCurrency,
    formatDate,
    formatDateTime,
    formatFileSize
  };
}
