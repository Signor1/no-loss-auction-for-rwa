// Auction types
export interface Auction {
  id: string;
  assetId: string;
  assetName: string;
  assetDescription: string;
  startingPrice: string;
  currentPrice: string;
  reservePrice: string;
  endTime: number;
  startTime: number;
  status: AuctionStatus;
  highestBidder?: string;
  totalBids: number;
  imageUrl?: string;
}

export enum AuctionStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

// Bid types
export interface Bid {
  id: string;
  auctionId: string;
  bidder: string;
  amount: string;
  timestamp: number;
  txHash?: string;
}

// Asset types
export interface RWA {
  id: string;
  name: string;
  description: string;
  tokenAddress?: string;
  tokenId?: string;
  owner: string;
  valuation: string;
  documents: string[];
  imageUrl?: string;
  metadata: Record<string, unknown>;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
