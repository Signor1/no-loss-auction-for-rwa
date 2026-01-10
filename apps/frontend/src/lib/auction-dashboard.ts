'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { formatEther, formatUnits } from 'viem';

// Types for auction dashboard
export interface UserBid {
  id: string;
  auctionId: string;
  auctionTitle: string;
  amount: string;
  timestamp: number;
  status: 'active' | 'won' | 'lost' | 'withdrawn';
  transactionHash: string;
  blockNumber: number;
  isHighest: boolean;
  refundStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  refundAmount?: string;
  refundTransactionHash?: string;
}

export interface UserAuction {
  id: string;
  title: string;
  description: string;
  assetToken: string;
  assetTokenId: string;
  assetAmount: number;
  currentBid: string;
  reservePrice: string;
  endTime: number;
  startTime: number;
  seller: string;
  status: 'active' | 'upcoming' | 'ended';
  category: string;
  userBid?: UserBid;
  userWon: boolean;
  tokenClaimed: boolean;
  tokenClaimTx?: string;
  images: string[];
}

export interface RefundRequest {
  id: string;
  bidId: string;
  amount: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: number;
  transactionHash?: string;
  estimatedCompletion: number;
  penalty?: string;
  netAmount?: string;
}

export interface TokenClaim {
  id: string;
  auctionId: string;
  tokenId: string;
  amount: number;
  status: 'available' | 'claimed' | 'processing';
  timestamp: number;
  transactionHash?: string;
  contractAddress: string;
  metadata?: Record<string, any>;
}

export interface DashboardStats {
  totalBids: number;
  activeBids: number;
  wonAuctions: number;
  lostAuctions: number;
  totalSpent: string;
  totalWon: string;
  pendingRefunds: number;
  availableClaims: number;
  successRate: number;
}

// Mock data for development
const MOCK_USER_BIDS: UserBid[] = [
  {
    id: 'bid_1',
    auctionId: '1',
    auctionTitle: 'Luxury Manhattan Penthouse',
    amount: '2.5',
    timestamp: Date.now() - 3600000,
    status: 'active',
    transactionHash: '0xabc123...',
    blockNumber: 18500000,
    isHighest: true,
  },
  {
    id: 'bid_2',
    auctionId: '2',
    auctionTitle: 'Rare Digital Art Collection',
    amount: '1.2',
    timestamp: Date.now() - 7200000,
    status: 'lost',
    transactionHash: '0xdef456...',
    blockNumber: 18499950,
    isHighest: false,
    refundStatus: 'completed',
    refundAmount: '1.2',
    refundTransactionHash: '0x789abc...',
  },
  {
    id: 'bid_3',
    auctionId: '3',
    auctionTitle: 'Gold Bullion Certificate',
    amount: '15.0',
    timestamp: Date.now() - 86400000,
    status: 'won',
    transactionHash: '0xghi789...',
    blockNumber: 18499500,
    isHighest: true,
  },
];

const MOCK_USER_AUCTIONS: UserAuction[] = [
  {
    id: '1',
    title: 'Luxury Manhattan Penthouse',
    description: 'Prime real estate in heart of Manhattan',
    assetToken: '0x1234567890abcdef1234567890abcdef12345678',
    assetTokenId: '1',
    assetAmount: 1,
    currentBid: '2.5',
    reservePrice: '5.0',
    endTime: Date.now() + 86400000,
    startTime: Date.now() - 3600000,
    seller: '0xabcdef1234567890abcdef1234567890abcdef12',
    status: 'active',
    category: 'real-estate',
    userBid: MOCK_USER_BIDS[0],
    userWon: false,
    tokenClaimed: false,
    images: ['/api/placeholder/auction/1'],
  },
  {
    id: '2',
    title: 'Rare Digital Art Collection',
    description: 'Unique NFT collection from renowned artist',
    assetToken: '0x2345678901bcdef12345678901bcdef12345678901',
    assetTokenId: '42',
    assetAmount: 1,
    currentBid: '1.8',
    reservePrice: '1.0',
    endTime: Date.now() - 3600000,
    startTime: Date.now() - 7200000,
    seller: '0xbcdef12345678901bcdef12345678901bcdef12',
    status: 'ended',
    category: 'art',
    userBid: MOCK_USER_BIDS[1],
    userWon: false,
    tokenClaimed: false,
    images: ['/api/placeholder/auction/2'],
  },
  {
    id: '3',
    title: 'Gold Bullion Certificate',
    description: 'Physical gold backing with secure storage',
    assetToken: '0x3456789012345678901234567890123456789012',
    assetTokenId: '100',
    assetAmount: 10,
    currentBid: '15.0',
    reservePrice: '20.0',
    endTime: Date.now() - 172800000,
    startTime: Date.now() - 86400000,
    seller: '0xcdef12345678901234567890123456789012345678901',
    status: 'ended',
    category: 'commodities',
    userBid: MOCK_USER_BIDS[2],
    userWon: true,
    tokenClaimed: false,
    images: ['/api/placeholder/auction/3'],
  },
];

const MOCK_REFUNDS: RefundRequest[] = [
  {
    id: 'refund_1',
    bidId: 'bid_2',
    amount: '1.2',
    status: 'completed',
    timestamp: Date.now() - 3600000,
    transactionHash: '0x789abc...',
    estimatedCompletion: Date.now() - 1800000,
    netAmount: '1.14', // After 5% penalty
    penalty: '0.06',
  },
];

const MOCK_TOKEN_CLAIMS: TokenClaim[] = [
  {
    id: 'claim_1',
    auctionId: '3',
    tokenId: '100',
    amount: 10,
    status: 'available',
    timestamp: Date.now() - 86400000,
    contractAddress: '0x3456789012345678901234567890123456789012',
    metadata: {
      name: 'Gold Bullion Certificate',
      description: '10 units of gold-backed tokens',
      symbol: 'GOLD',
    },
  },
];

export function useAuctionDashboard() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [userBids, setUserBids] = useState<UserBid[]>([]);
  const [userAuctions, setUserAuctions] = useState<UserAuction[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [tokenClaims, setTokenClaims] = useState<TokenClaim[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'won' | 'lost' | 'history'>('active');
  const [isClaimingToken, setIsClaimingToken] = useState(false);

  // Load dashboard data
  useEffect(() => {
    if (address) {
      loadDashboardData();
    }
  }, [address]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUserBids(MOCK_USER_BIDS);
      setUserAuctions(MOCK_USER_AUCTIONS);
      setRefunds(MOCK_REFUNDS);
      setTokenClaims(MOCK_TOKEN_CLAIMS);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate dashboard statistics
  const stats = useMemo((): DashboardStats => {
    const totalBids = userBids.length;
    const activeBids = userBids.filter(bid => bid.status === 'active').length;
    const wonAuctions = userBids.filter(bid => bid.status === 'won').length;
    const lostAuctions = userBids.filter(bid => bid.status === 'lost').length;
    const totalSpent = userBids
      .filter(bid => bid.status !== 'withdrawn')
      .reduce((sum, bid) => sum + parseFloat(bid.amount), 0)
      .toFixed(4);
    const totalWon = userBids
      .filter(bid => bid.status === 'won')
      .reduce((sum, bid) => sum + parseFloat(bid.amount), 0)
      .toFixed(4);
    const pendingRefunds = refunds.filter(refund => refund.status === 'pending').length;
    const availableClaims = tokenClaims.filter(claim => claim.status === 'available').length;
    const successRate = totalBids > 0 ? ((wonAuctions / totalBids) * 100).toFixed(1) : '0';

    return {
      totalBids,
      activeBids,
      wonAuctions,
      lostAuctions,
      totalSpent,
      totalWon,
      pendingRefunds,
      availableClaims,
      successRate: parseFloat(successRate),
    };
  }, [userBids, refunds, tokenClaims]);

  // Filter auctions based on active tab
  const filteredAuctions = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return userAuctions.filter(auction => auction.userBid?.status === 'active');
      case 'won':
        return userAuctions.filter(auction => auction.userWon);
      case 'lost':
        return userAuctions.filter(auction => auction.userBid?.status === 'lost');
      case 'history':
        return userAuctions;
      default:
        return userAuctions;
    }
  }, [userAuctions, activeTab]);

  // Claim token
  const claimToken = async (claimId: string) => {
    setIsClaimingToken(true);
    try {
      // Simulate token claim
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTokenClaims(prev => 
        prev.map(claim => 
          claim.id === claimId 
            ? { ...claim, status: 'processing', transactionHash: `0x${Math.random().toString(16).substr(2, 64)}` }
            : claim
        )
      );
      
      // Simulate completion
      setTimeout(() => {
        setTokenClaims(prev => 
          prev.map(claim => 
            claim.id === claimId 
              ? { ...claim, status: 'claimed' }
              : claim
          )
        );
      }, 3000);
    } catch (error) {
      console.error('Failed to claim token:', error);
    } finally {
      setIsClaimingToken(false);
    }
  };

  // Request refund
  const requestRefund = async (bidId: string) => {
    try {
      // Simulate refund request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newRefund: RefundRequest = {
        id: `refund_${Date.now()}`,
        bidId,
        amount: userBids.find(bid => bid.id === bidId)?.amount || '0',
        status: 'pending',
        timestamp: Date.now(),
        estimatedCompletion: Date.now() + 3600000, // 1 hour
      };
      
      setRefunds(prev => [...prev, newRefund]);
    } catch (error) {
      console.error('Failed to request refund:', error);
    }
  };

  // Format address
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Calculate time remaining
  const getTimeRemaining = (endTime: number) => {
    const now = Date.now();
    const timeRemaining = endTime - now;
    
    if (timeRemaining <= 0) return 'Ended';
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeString = '';
    if (days > 0) timeString += `${days}d `;
    if (hours > 0) timeString += `${hours}h `;
    if (minutes > 0) timeString += `${minutes}m `;
    
    return timeString.trim() || 'Ending soon';
  };

  return {
    // Data
    userBids,
    userAuctions,
    refunds,
    tokenClaims,
    stats,
    filteredAuctions,
    
    // State
    isLoading,
    activeTab,
    setActiveTab,
    isClaimingToken,
    
    // Actions
    claimToken,
    requestRefund,
    loadDashboardData,
    
    // Utilities
    formatAddress,
    formatTimestamp,
    getTimeRemaining,
  };
}

export function useRefundTracking() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadRefunds = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      setRefunds(MOCK_REFUNDS);
    } catch (error) {
      console.error('Failed to load refunds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRefundStatus = (refundId: string) => {
    const refund = refunds.find(r => r.id === refundId);
    return refund?.status || 'pending';
  };

  const getRefundProgress = (refund: RefundRequest) => {
    const now = Date.now();
    const elapsed = now - refund.timestamp;
    const total = refund.estimatedCompletion - refund.timestamp;
    const progress = Math.min((elapsed / total) * 100, 100);
    
    return {
      progress,
      elapsed,
      total,
      status: refund.status,
    };
  };

  return {
    refunds,
    isLoading,
    loadRefunds,
    getRefundStatus,
    getRefundProgress,
  };
}

export function useTokenClaims() {
  const [claims, setClaims] = useState<TokenClaim[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadClaims = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      setClaims(MOCK_TOKEN_CLAIMS);
    } catch (error) {
      console.error('Failed to load token claims:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const claimToken = async (claimId: string) => {
    try {
      // Simulate token claim
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setClaims(prev => 
        prev.map(claim => 
          claim.id === claimId 
            ? { ...claim, status: 'processing', transactionHash: `0x${Math.random().toString(16).substr(2, 64)}` }
            : claim
        )
      );
      
      // Simulate completion
      setTimeout(() => {
        setClaims(prev => 
          prev.map(claim => 
            claim.id === claimId 
              ? { ...claim, status: 'claimed' }
              : claim
          )
        );
      }, 3000);
    } catch (error) {
      console.error('Failed to claim token:', error);
    }
  };

  const getClaimableTokens = () => {
    return claims.filter(claim => claim.status === 'available');
  };

  const getClaimedTokens = () => {
    return claims.filter(claim => claim.status === 'claimed');
  };

  return {
    claims,
    isLoading,
    loadClaims,
    claimToken,
    getClaimableTokens,
    getClaimedTokens,
  };
}
