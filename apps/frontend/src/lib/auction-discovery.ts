'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';

// Types for auction data
export interface Auction {
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
  featured: boolean;
  image?: string;
  bidCount: number;
  highestBidder?: string;
  noLossGuarantee: boolean;
}

export interface AuctionFilters {
  status: 'all' | 'active' | 'upcoming' | 'ended';
  category: 'all' | 'real-estate' | 'art' | 'commodities' | 'intellectual-property' | 'financial-instruments';
  priceRange: 'all' | '0-1' | '1-10' | '10-100' | '100+';
  sortBy: 'ending-soon' | 'highest-bid' | 'newest' | 'lowest-reserve';
  search: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Mock data for development
const MOCK_AUCTIONS: Auction[] = [
  {
    id: '1',
    title: 'Luxury Manhattan Apartment',
    description: 'Prime real estate in heart of Manhattan with stunning city views',
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
    image: '/api/placeholder/auction/1',
    bidCount: 12,
    highestBidder: '0x1234567890abcdef1234567890abcdef12345678',
    noLossGuarantee: true,
  },
  {
    id: '2',
    title: 'Rare Digital Art Collection',
    description: 'Unique NFT collection from renowned digital artist',
    assetToken: '0x2345678901bcdef12345678901bcdef12345678901',
    assetTokenId: '42',
    assetAmount: 1,
    currentBid: '0.8',
    reservePrice: '1.0',
    endTime: Date.now() + 43200000, // 12 hours
    startTime: Date.now() - 7200000, // 2 hours ago
    seller: '0xbcdef12345678901bcdef12345678901bcdef12',
    status: 'active',
    category: 'art',
    featured: false,
    image: '/api/placeholder/auction/2',
    bidCount: 8,
    highestBidder: '0x2345678901bcdef12345678901bcdef12345678901',
    noLossGuarantee: true,
  },
  {
    id: '3',
    title: 'Gold Bullion Certificate',
    description: 'Physical gold backing with secure storage certificate',
    assetToken: '0x3456789012345678901234567890123456789012',
    assetTokenId: '100',
    assetAmount: 10,
    currentBid: '15.2',
    reservePrice: '20.0',
    endTime: Date.now() + 172800000, // 48 hours
    startTime: Date.now() - 10800000, // 3 hours ago
    seller: '0xcdef12345678901234567890123456789012345678901',
    status: 'active',
    category: 'commodities',
    featured: true,
    image: '/api/placeholder/auction/3',
    bidCount: 25,
    highestBidder: '0x34567890123456789012345678901234567890123',
    noLossGuarantee: true,
  },
  {
    id: '4',
    title: 'Patent Portfolio - Tech IP',
    description: 'Valuable intellectual property portfolio with multiple patents',
    assetToken: '0x456789012345678901234567890123456789012',
    assetTokenId: '777',
    assetAmount: 1,
    currentBid: '0',
    reservePrice: '50.0',
    endTime: Date.now() + 259200000, // 72 hours
    startTime: Date.now() + 3600000, // 1 hour from now
    seller: '0xdef12345678901234567890123456789012345678901',
    status: 'upcoming',
    category: 'intellectual-property',
    featured: false,
    image: '/api/placeholder/auction/4',
    bidCount: 0,
    noLossGuarantee: true,
  },
];

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'art', label: 'Art & Collectibles' },
  { value: 'commodities', label: 'Commodities' },
  { value: 'intellectual-property', label: 'Intellectual Property' },
  { value: 'financial-instruments', label: 'Financial Instruments' },
];

const SORT_OPTIONS = [
  { value: 'ending-soon', label: 'Ending Soon' },
  { value: 'highest-bid', label: 'Highest Bid' },
  { value: 'newest', label: 'Newest' },
  { value: 'lowest-reserve', label: 'Lowest Reserve' },
];

const PRICE_RANGES = [
  { value: 'all', label: 'Any Price' },
  { value: '0-1', label: '0 - 1 ETH' },
  { value: '1-10', label: '1 - 10 ETH' },
  { value: '10-100', label: '10 - 100 ETH' },
  { value: '100+', label: '100+ ETH' },
];

export function useAuctionDiscovery() {
  const { address } = useAccount();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [savedAuctions, setSavedAuctions] = useState<Set<string>>(new Set());
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<AuctionFilters>({
    status: 'active',
    category: 'all',
    priceRange: 'all',
    sortBy: 'ending-soon',
    search: '',
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12,
  });

  // Load auctions
  useEffect(() => {
    loadAuctions();
  }, [filters, pagination.currentPage]);

  const loadAuctions = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredAuctions = [...MOCK_AUCTIONS];
      
      // Apply filters
      if (filters.status !== 'all') {
        filteredAuctions = filteredAuctions.filter(auction => auction.status === filters.status);
      }
      
      if (filters.category !== 'all') {
        filteredAuctions = filteredAuctions.filter(auction => auction.category === filters.category);
      }
      
      if (filters.priceRange !== 'all') {
        const currentBid = parseFloat(auction.currentBid);
        switch (filters.priceRange) {
          case '0-1':
            filteredAuctions = filteredAuctions.filter(auction => currentBid <= 1);
            break;
          case '1-10':
            filteredAuctions = filteredAuctions.filter(auction => currentBid > 1 && currentBid <= 10);
            break;
          case '10-100':
            filteredAuctions = filteredAuctions.filter(auction => currentBid > 10 && currentBid <= 100);
            break;
          case '100+':
            filteredAuctions = filteredAuctions.filter(auction => currentBid > 100);
            break;
        }
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredAuctions = filteredAuctions.filter(auction =>
          auction.title.toLowerCase().includes(searchTerm) ||
          auction.description.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply sorting
      switch (filters.sortBy) {
        case 'ending-soon':
          filteredAuctions.sort((a, b) => a.endTime - b.endTime);
          break;
        case 'highest-bid':
          filteredAuctions.sort((a, b) => parseFloat(b.currentBid) - parseFloat(a.currentBid));
          break;
        case 'newest':
          filteredAuctions.sort((a, b) => b.startTime - a.startTime);
          break;
        case 'lowest-reserve':
          filteredAuctions.sort((a, b) => parseFloat(a.reservePrice) - parseFloat(b.reservePrice));
          break;
      }
      
      // Apply pagination
      const totalItems = filteredAuctions.length;
      const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
      const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const paginatedAuctions = filteredAuctions.slice(startIndex, startIndex + pagination.itemsPerPage);
      
      setAuctions(paginatedAuctions);
      setPagination(prev => ({
        ...prev,
        totalItems,
        totalPages,
      }));
    } catch (error) {
      console.error('Failed to load auctions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSaveAuction = (auctionId: string) => {
    setSavedAuctions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(auctionId)) {
        newSet.delete(auctionId);
      } else {
        newSet.add(auctionId);
      }
      return newSet;
    });
  };

  const toggleWatchlist = (auctionId: string) => {
    setWatchlist(prev => {
      const newSet = new Set(prev);
      if (newSet.has(auctionId)) {
        newSet.delete(auctionId);
      } else {
        newSet.add(auctionId);
      }
      return newSet;
    });
  };

  const updateFilters = (newFilters: Partial<AuctionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const changePage = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  return {
    auctions,
    savedAuctions,
    watchlist,
    isLoading,
    filters,
    pagination,
    loadAuctions,
    toggleSaveAuction,
    toggleWatchlist,
    updateFilters,
    changePage,
  };
}

export function useFeaturedAuctions() {
  const [featuredAuctions, setFeaturedAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadFeaturedAuctions = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        setFeaturedAuctions(MOCK_AUCTIONS.filter(auction => auction.featured));
      } catch (error) {
        console.error('Failed to load featured auctions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedAuctions();
  }, []);

  return { featuredAuctions, isLoading };
}
