import { formatEther, parseEther } from 'viem';
import { Auction, AuctionStatus } from '@no-loss-auction/types';

/**
 * Format wei to ether with specified decimal places
 */
export function formatPrice(wei: bigint | string, decimals: number = 4): string {
  try {
    const formatted = formatEther(BigInt(wei.toString()));
    const num = parseFloat(formatted);
    return num.toFixed(decimals);
  } catch {
    return '0.0000';
  }
}

/**
 * Parse ether string to wei
 */
export function parsePrice(ether: string): bigint {
  try {
    return parseEther(ether);
  } catch {
    return 0n;
  }
}

/**
 * Format address to short format (0x1234...5678)
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address || address.length < chars * 2 + 2) {
    return address;
  }
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Check if auction is active
 */
export function isAuctionActive(auction: Auction): boolean {
  const now = Date.now();
  return (
    auction.status === AuctionStatus.ACTIVE &&
    now >= auction.startTime &&
    now < auction.endTime
  );
}

/**
 * Get time remaining in auction
 */
export function getTimeRemaining(endTime: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const now = Date.now();
  const total = Math.max(0, endTime - now);
  
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
}

/**
 * Format time remaining as string
 */
export function formatTimeRemaining(endTime: number): string {
  const { days, hours, minutes, seconds } = getTimeRemaining(endTime);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
