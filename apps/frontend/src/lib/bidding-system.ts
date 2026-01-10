'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount, useBalance, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { formatEther, formatUnits, parseEther } from 'viem';
import { useBaseNetwork } from '@/lib/base-network';

// Types for bidding system
export interface BidRequest {
  auctionId: string;
  amount: string;
  maxGas?: string;
  autoBid?: boolean;
  maxAutoBidAmount?: string;
}

export interface BidResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  bidId?: string;
  gasUsed?: string;
  gasPrice?: string;
  timestamp: number;
}

export interface BidValidation {
  isValid: boolean;
  error?: string;
  minBid: string;
  maxBid?: string;
  gasEstimate?: string;
  gasPrice?: string;
  totalCost?: string;
}

export interface AutoBidConfig {
  enabled: boolean;
  maxAmount: string;
  increment: string;
  maxGas: string;
  active: boolean;
}

export interface BidTransaction {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  amount: string;
  gasUsed: string;
  gasPrice: string;
  blockNumber?: number;
  timestamp: number;
  error?: string;
}

// Mock auction contract ABI (simplified)
const AUCTION_CONTRACT_ABI = [
  {
    name: 'placeBid',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'auctionId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'withdrawBid',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'auctionId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'getMinimumBid',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'auctionId', type: 'uint256' },
    ],
    outputs: [
      { name: 'minBid', type: 'uint256' },
    ],
  },
] as const;

export function useBiddingSystem(auctionId: string) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { writeContract } = useWriteContract();
  const { currentNetwork } = useBaseNetwork();
  
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidResult, setBidResult] = useState<BidResult | null>(null);
  const [bidValidation, setBidValidation] = useState<BidValidation | null>(null);
  const [autoBidConfig, setAutoBidConfig] = useState<AutoBidConfig>({
    enabled: false,
    maxAmount: '0',
    increment: '0.1',
    maxGas: '0.01',
    active: false,
  });
  const [activeBids, setActiveBids] = useState<BidTransaction[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingBid, setPendingBid] = useState<BidRequest | null>(null);

  // Mock auction data
  const mockAuction = {
    id: auctionId,
    currentBid: '2.5',
    reservePrice: '5.0',
    minBidIncrement: '0.05',
    endTime: Date.now() + 86400000,
    status: 'active' as const,
    seller: '0xabcdef1234567890abcdef1234567890abcdef12',
    highestBidder: '0x1234567890abcdef1234567890abcdef12345678',
    withdrawalAllowed: true,
    withdrawalPenalty: 5, // 5%
  };

  // Validate bid amount
  const validateBid = useCallback((amount: string): BidValidation => {
    const bidAmount = parseFloat(amount);
    const currentBid = parseFloat(mockAuction.currentBid);
    const minIncrement = parseFloat(mockAuction.minBidIncrement);
    const minBid = Math.max(currentBid + minIncrement, parseFloat(mockAuction.reservePrice));
    
    // Check if amount is valid
    if (isNaN(bidAmount) || bidAmount <= 0) {
      return {
        isValid: false,
        error: 'Please enter a valid bid amount',
        minBid: minBid.toString(),
      };
    }

    // Check if bid meets minimum
    if (bidAmount < minBid) {
      return {
        isValid: false,
        error: `Minimum bid is ${minBid.toFixed(4)} ETH`,
        minBid: minBid.toString(),
      };
    }

    // Check user balance
    if (balance && bidAmount > parseFloat(formatEther(balance.value))) {
      return {
        isValid: false,
        error: 'Insufficient balance',
        minBid: minBid.toString(),
      };
    }

    // Estimate gas
    const gasEstimate = '21000';
    const gasPrice = '0.00000002'; // 20 gwei
    const gasCost = parseFloat(gasEstimate) * parseFloat(gasPrice);
    const totalCost = bidAmount + gasCost;

    return {
      isValid: true,
      minBid: minBid.toString(),
      gasEstimate,
      gasPrice,
      totalCost: totalCost.toString(),
    };
  }, [balance, mockAuction]);

  // Real-time validation
  useEffect(() => {
    if (bidAmount) {
      const validation = validateBid(bidAmount);
      setBidValidation(validation);
    } else {
      setBidValidation(null);
    }
  }, [bidAmount, validateBid]);

  // Place bid
  const placeBid = useCallback(async (request: BidRequest): Promise<BidResult> => {
    if (!isConnected || !address) {
      return {
        success: false,
        error: 'Please connect your wallet',
        timestamp: Date.now(),
      };
    }

    setIsPlacingBid(true);
    setBidResult(null);

    try {
      // Validate bid
      const validation = validateBid(request.amount);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          timestamp: Date.now(),
        };
      }

      // Simulate contract interaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock transaction hash
      const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      // Add to active bids
      const newBid: BidTransaction = {
        hash: transactionHash,
        status: 'pending',
        amount: request.amount,
        gasUsed: '21000',
        gasPrice: '0.00000002',
        timestamp: Date.now(),
      };

      setActiveBids(prev => [...prev, newBid]);

      const result: BidResult = {
        success: true,
        transactionHash,
        bidId: `bid_${Date.now()}`,
        gasUsed: '21000',
        gasPrice: '0.00000002',
        timestamp: Date.now(),
      };

      setBidResult(result);
      
      // Update auction state (mock)
      mockAuction.currentBid = request.amount;
      mockAuction.highestBidder = address;

      return result;
    } catch (error) {
      const result: BidResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
        timestamp: Date.now(),
      };
      
      setBidResult(result);
      return result;
    } finally {
      setIsPlacingBid(false);
    }
  }, [isConnected, address, validateBid]);

  // Withdraw bid
  const withdrawBid = useCallback(async (auctionId: string): Promise<BidResult> => {
    if (!isConnected || !address) {
      return {
        success: false,
        error: 'Please connect your wallet',
        timestamp: Date.now(),
      };
    }

    try {
      // Simulate contract interaction
      await new Promise(resolve => setTimeout(resolve, 1500));

      const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      return {
        success: true,
        transactionHash,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Withdrawal failed',
        timestamp: Date.now(),
      };
    }
  }, [isConnected, address]);

  // Auto-bid functionality
  const enableAutoBid = useCallback((config: AutoBidConfig) => {
    setAutoBidConfig(prev => ({ ...prev, ...config, active: true }));
  }, []);

  const disableAutoBid = useCallback(() => {
    setAutoBidConfig(prev => ({ ...prev, active: false }));
  }, []);

  // Monitor transaction status
  const monitorTransaction = useCallback((hash: string) => {
    // In real implementation, this would use useWaitForTransactionReceipt
    const interval = setInterval(() => {
      setActiveBids(prev => 
        prev.map(bid => 
          bid.hash === hash 
            ? { ...bid, status: Math.random() > 0.1 ? 'confirmed' : 'failed' }
            : bid
        )
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calculate minimum bid increment
  const minBidIncrement = useMemo(() => {
    const currentBid = parseFloat(mockAuction.currentBid);
    const minIncrement = parseFloat(mockAuction.minBidIncrement);
    return Math.max(currentBid + minIncrement, parseFloat(mockAuction.reservePrice));
  }, [mockAuction]);

  // Format bid amount
  const formatBidAmount = useCallback((amount: string) => {
    const value = parseFloat(amount);
    if (isNaN(value)) return '0.0000';
    return value.toFixed(4);
  }, []);

  // Calculate gas cost
  const calculateGasCost = useCallback((amount: string) => {
    const gasEstimate = 21000;
    const gasPrice = 0.00000002; // 20 gwei
    const gasCost = gasEstimate * gasPrice;
    const totalCost = parseFloat(amount) + gasCost;
    return totalCost.toFixed(4);
  }, []);

  // Check if user can withdraw bid
  const canWithdrawBid = useCallback(() => {
    return mockAuction.withdrawalAllowed && 
           mockAuction.highestBidder?.toLowerCase() === address?.toLowerCase();
  }, [mockAuction, address]);

  return {
    // State
    isPlacingBid,
    bidAmount,
    setBidAmount,
    bidResult,
    bidValidation,
    autoBidConfig,
    activeBids,
    showConfirmation,
    setShowConfirmation,
    pendingBid,
    setPendingBid,
    
    // Data
    auction: mockAuction,
    minBidIncrement,
    balance,
    
    // Actions
    placeBid,
    withdrawBid,
    enableAutoBid,
    disableAutoBid,
    monitorTransaction,
    
    // Utilities
    validateBid,
    formatBidAmount,
    calculateGasCost,
    canWithdrawBid,
    isConnected,
  };
}

export function useBidNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
  }>>([]);

  const addNotification = useCallback((
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string
  ) => {
    const notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: Date.now(),
      read: false,
    };
    
    setNotifications(prev => [notification, ...prev]);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 10000);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    markAsRead,
    clearAll,
  };
}
