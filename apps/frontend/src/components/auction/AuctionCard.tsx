'use client';

import { useState } from 'react';
import { Auction } from '@/lib/auction-discovery';
import { formatEther } from 'viem';

interface AuctionCardProps {
  auction: Auction;
  isSaved: boolean;
  isWatched: boolean;
  viewMode: 'grid' | 'list';
  onSaveToggle?: (auctionId: string) => void;
  onWatchToggle?: (auctionId: string) => void;
}

export function AuctionCard({ auction, isSaved, isWatched, viewMode }: AuctionCardProps) {
  const [imageError, setImageError] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  // Calculate time left
  useState(() => {
    const updateTimeLeft = () => {
      const now = Date.now();
      const timeRemaining = auction.endTime - now;
      
      if (timeRemaining <= 0) {
        setTimeLeft('Ended');
        return;
      }
      
      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      
      let timeString = '';
      if (days > 0) timeString += `${days}d `;
      if (hours > 0) timeString += `${hours}h `;
      if (minutes > 0) timeString += `${minutes}m `;
      if (seconds > 0) timeString += `${seconds}s`;
      
      setTimeLeft(timeString.trim());
    };
    
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [auction.endTime]);

  const formatPrice = (price: string) => {
    const ethPrice = parseFloat(price);
    if (ethPrice < 0.01) return '< 0.01';
    return ethPrice.toFixed(4);
  };

  const getStatusColor = () => {
    switch (auction.status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'upcoming': return 'text-blue-600 bg-blue-50';
      case 'ended': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = () => {
    switch (auction.category) {
      case 'real-estate': return '🏠';
      case 'art': return '🎨';
      case 'commodities': return '📈';
      case 'intellectual-property': return '💡';
      case 'financial-instruments': return '💰';
      default: return '📦';
    }
  };

  const cardClasses = viewMode === 'grid' 
    ? 'bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200'
    : 'bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200';

  return (
    <div className={cardClasses}>
      {viewMode === 'grid' ? (
        /* Grid View */
        <div>
          {/* Image */}
          <div className="relative h-48 bg-gray-200">
            <img
              src={imageError ? '/api/placeholder/auction' : auction.image}
              alt={auction.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            
            {/* Status Badge */}
            <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor()}`}>
              {auction.status}
            </div>
            
            {/* Featured Badge */}
            {auction.featured && (
              <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-medium">
                ⭐ Featured
              </div>
            )}
            
            {/* No-Loss Guarantee Badge */}
            {auction.noLossGuarantee && (
              <div className="absolute bottom-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                🛡️ No-Loss
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="p-4">
            {/* Category */}
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{getCategoryIcon()}</span>
              <span className="text-xs text-gray-500 uppercase">{auction.category.replace('-', ' ')}</span>
            </div>
            
            {/* Title */}
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
              {auction.title}
            </h3>
            
            {/* Description */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {auction.description}
            </p>
            
            {/* Bidding Info */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current Bid</span>
                <span className="font-semibold text-lg">
                  {formatPrice(auction.currentBid)} ETH
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Reserve Price</span>
                <span className="text-sm">{formatPrice(auction.reservePrice)} ETH</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Time Left</span>
                <span className="text-sm font-medium text-red-600">{timeLeft}</span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex space-x-2 mt-4">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium">
                View Details
              </button>
              
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 004.243 4.243 4.5 4.5 0 00-4.243 4.243 4.5 4.5 0 00-4.243-4.243L4.318 6.318zm4.243 6.318L4.318 6.318z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="flex space-x-6">
          {/* Image */}
          <div className="w-32 h-32 bg-gray-200 flex-shrink-0">
            <img
              src={imageError ? '/api/placeholder/auction' : auction.image}
              alt={auction.title}
              className="w-full h-full object-cover rounded-lg"
              onError={() => setImageError(true)}
            />
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getCategoryIcon()}</span>
                    <span className="text-xs text-gray-500 uppercase">{auction.category.replace('-', ' ')}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor()}`}>
                      {auction.status}
                    </div>
                    
                    {auction.featured && (
                      <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-medium">
                        ⭐ Featured
                      </div>
                    )}
                    
                    {auction.noLossGuarantee && (
                      <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                        🛡️ No-Loss
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Title */}
                <h3 className="font-semibold text-gray-900 mb-2">{auction.title}</h3>
                
                {/* Description */}
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{auction.description}</p>
                
                {/* Bidding Info */}
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <span className="text-xs text-gray-500">Current Bid</span>
                    <div className="font-semibold text-lg">
                      {formatPrice(auction.currentBid)} ETH
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-xs text-gray-500">Reserve Price</span>
                    <div className="text-sm">{formatPrice(auction.reservePrice)} ETH</div>
                  </div>
                  
                  <div>
                    <span className="text-xs text-gray-500">Time Left</span>
                    <div className="text-sm font-medium text-red-600">{timeLeft}</div>
                  </div>
                </div>
                
                {/* Additional Info */}
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <span>🔥 {auction.bidCount} bids</span>
                  <span>👤 {auction.highestBidder ? 'Active' : 'No bids yet'}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg text-sm font-medium">
                  View Details
                </button>
                
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 004.243 4.243 4.5 4.5 0 00-4.243 4.243 4.5 4.5 0 00-4.243-4.243L4.318 6.318zm4.243 6.318L4.318 6.318z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
