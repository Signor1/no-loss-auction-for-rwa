'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useBalance, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, formatUnits } from 'viem';

// Types for auction detail data
export interface AuctionDetail {
  id: string;
  title: string;
  description: string;
  longDescription: string;
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
  featured: boolean;
  images: string[];
  metadata: {
    assetType: string;
    location?: string;
    specifications?: Record<string, any>;
    documents?: Array<{
      name: string;
      url: string;
      type: string;
    }>;
    valuation?: {
      amount: string;
      currency: string;
      date: string;
      method: string;
    };
  };
  bidHistory: Array<{
    id: string;
    bidder: string;
    amount: string;
    timestamp: number;
    transactionHash: string;
    blockNumber: number;
  }>;
  highestBidder?: string;
  noLossGuarantee: boolean;
  auctionTerms: {
    settlementPeriod: number;
    withdrawalPenalty: number;
    autoSettle: boolean;
  };
}

export interface Bid {
  id: string;
  auctionId: string;
  bidder: string;
  amount: string;
  timestamp: number;
  transactionHash?: string;
  blockNumber?: number;
  status: 'pending' | 'confirmed' | 'failed';
}

// Mock detailed auction data
const MOCK_AUCTION_DETAIL: AuctionDetail = {
  id: '1',
  title: 'Luxury Manhattan Penthouse Apartment',
  description: 'Prime real estate in heart of Manhattan with stunning city views',
  longDescription: `This exceptional penthouse apartment represents one of Manhattan's most prestigious residential opportunities. Located in the coveted Upper East Side, this property offers unparalleled luxury living with breathtaking panoramic views of Central Park and the Manhattan skyline.

The apartment features:
- 3 bedrooms, 3.5 bathrooms
- 4,200 sq ft of living space
- Private elevator access
- 24/7 concierge service
- State-of-the-art smart home technology
- Private terrace with outdoor kitchen
- Wine cellar and tasting room

The building amenities include:
- Full-service doorman
- Fitness center with pool
- Rooftop terrace
- Private storage units
- On-site parking

This property represents a unique opportunity to own a piece of Manhattan's luxury real estate market, tokenized as an RWA asset for global accessibility and liquidity.`,
  assetToken: '0x1234567890abcdef1234567890abcdef12345678',
  assetTokenId: '1',
  assetAmount: 1,
  currentBid: '2.5',
  reservePrice: '5.0',
  endTime: Date.now() + 86400000, // 24 hours
  startTime: Date.now() - 3600000, // 1 hour ago
  seller: '0xabcdef1234567890abcdef1234567890abcdef12',
  status: 'active',
  category: 'real-estate',
  featured: true,
  images: [
    '/api/placeholder/auction/1-1',
    '/api/placeholder/auction/1-2',
    '/api/placeholder/auction/1-3',
    '/api/placeholder/auction/1-4',
    '/api/placeholder/auction/1-5',
  ],
  metadata: {
    assetType: 'Residential Property',
    location: 'Manhattan, Upper East Side, New York',
    specifications: {
      bedrooms: 3,
      bathrooms: 3.5,
      squareFootage: 4200,
      yearBuilt: 2019,
      parkingSpaces: 2,
      doorman: true,
      elevator: true,
      terrace: true,
      smartHome: true,
    },
    documents: [
      {
        name: 'Property Deed',
        url: '/api/documents/deed.pdf',
        type: 'PDF',
      },
      {
        name: 'Appraisal Report',
        url: '/api/documents/appraisal.pdf',
        type: 'PDF',
      },
      {
        name: 'Building Certificate',
        url: '/api/documents/certificate.pdf',
        type: 'PDF',
      },
    ],
    valuation: {
      amount: '5,250,000',
      currency: 'USD',
      date: '2024-01-15',
      method: 'Comparative Market Analysis',
    },
  },
  bidHistory: [
    {
      id: '1',
      auctionId: '1',
      bidder: '0x1234567890abcdef1234567890abcdef12345678',
      amount: '1.0',
      timestamp: Date.now() - 7200000, // 2 hours ago
      transactionHash: '0xabc123...',
      blockNumber: 18500000,
      status: 'confirmed',
    },
    {
      id: '2',
      auctionId: '1',
      bidder: '0x2345678901bcdef12345678901bcdef12345678901',
      amount: '1.5',
      timestamp: Date.now() - 3600000, // 1 hour ago
      transactionHash: '0xdef456...',
      blockNumber: 18500001,
      status: 'confirmed',
    },
    {
      id: '3',
      auctionId: '1',
      bidder: '0x34567890123456789012345678901234567890',
      amount: '2.0',
      timestamp: Date.now() - 1800000, // 30 minutes ago
      transactionHash: '0xghi789...',
      blockNumber: 18500002,
      status: 'confirmed',
    },
  ],
  highestBidder: '0x34567890123456789012345678901234567890',
  noLossGuarantee: true,
  auctionTerms: {
    settlementPeriod: 7, // 7 days
    withdrawalPenalty: 5, // 5%
    autoSettle: true,
  },
};

export function useAuctionDetail(auctionId: string) {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address: '0x4200000000000000000000000000000000000000420' });
  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Load auction details
  useEffect(() => {
    loadAuctionDetail();
  }, [auctionId]);

  const loadAuctionDetail = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setAuction(MOCK_AUCTION_DETAIL);
    } catch (err) {
      setError('Failed to load auction details');
      console.error('Error loading auction:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const placeBid = async () => {
    if (!address || !bidAmount || parseFloat(bidAmount) <= 0) {
      setError('Please enter a valid bid amount');
      return;
    }

    const currentBid = parseFloat(auction?.currentBid || '0');
    const bidValue = parseFloat(bidAmount);

    if (bidValue <= currentBid) {
      setError('Bid must be higher than current bid');
      return;
    }

    setIsPlacingBid(true);
    setError(null);

    try {
      // Simulate bid placement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update auction state
      if (auction) {
        setAuction({
          ...auction,
          currentBid: bidValue.toString(),
          bidHistory: [
            ...auction.bidHistory,
            {
              id: Date.now().toString(),
              auctionId: auction.id,
              bidder: address,
              amount: bidValue.toString(),
              timestamp: Date.now(),
              status: 'pending',
            },
          ],
        });
      }
      
      setBidAmount('');
      alert('Bid placed successfully!');
    } catch (err) {
      setError('Failed to place bid. Please try again.');
      console.error('Error placing bid:', err);
    } finally {
      setIsPlacingBid(false);
    }
  };

  const timeLeft = useMemo(() => {
    if (!auction) return '';
    
    const now = Date.now();
    const timeRemaining = auction.endTime - now;
    
    if (timeRemaining <= 0) return 'Ended';
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
    let timeString = '';
    if (days > 0) timeString += `${days}d `;
    if (hours > 0) timeString += `${hours}h `;
    if (minutes > 0) timeString += `${minutes}m `;
    if (seconds > 0) timeString += `${seconds}s`;
    
    return timeString.trim();
  }, [auction]);

  const minBid = useMemo(() => {
    if (!auction) return '0';
    const currentBid = parseFloat(auction.currentBid);
    const minIncrement = parseFloat(auction.reservePrice) * 0.01; // 1% minimum
    return Math.max(currentBid + minIncrement, parseFloat(auction.reservePrice)).toFixed(4);
  }, [auction]);

  const nextImage = () => {
    if (!auction) return;
    setActiveImageIndex((prev) => (prev + 1) % auction.images.length);
  };

  const prevImage = () => {
    if (!auction) return;
    setActiveImageIndex((prev) => (prev - 1 + auction.images.length) % auction.images.length);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isAuctionEnded = () => {
    if (!auction) return true;
    return Date.now() >= auction.endTime;
  };

  const isUserHighestBidder = () => {
    if (!auction || !address) return false;
    return auction.highestBidder?.toLowerCase() === address.toLowerCase();
  };

  return {
    auction,
    isLoading,
    error,
    isPlacingBid,
    bidAmount,
    setBidAmount,
    activeImageIndex,
    timeLeft,
    minBid,
    balance,
    placeBid,
    nextImage,
    prevImage,
    formatAddress,
    isAuctionEnded,
    isUserHighestBidder,
  };
}

export function useBidHistory(auctionId: string) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBidHistory();
  }, [auctionId]);

  const loadBidHistory = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      setBids(MOCK_AUCTION_DETAIL.bidHistory);
    } catch (error) {
      console.error('Failed to load bid history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    bids,
    isLoading,
    loadBidHistory,
  };
}
