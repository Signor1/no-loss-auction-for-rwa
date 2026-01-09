'use client';

import { useState, useEffect } from 'react';
import { Auction } from '@/lib/auction-discovery';
import { AuctionCard } from './AuctionCard';

interface FeaturedAuctionsProps {
  auctions: Auction[];
  isLoading: boolean;
}

export function FeaturedAuctions({ auctions, isLoading }: FeaturedAuctionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying || auctions.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % auctions.length);
    }, 5000); // Change every 5 seconds
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, auctions.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + auctions.length) % auctions.length);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % auctions.length);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading featured auctions...</p>
        </div>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.221.582-.421.666-.421a1.05 1.05 0 00-.639.423l-2.447 2.447c-.195.195-.512.195-.707 0l-2.447-2.447a.999.999 0 00-.707 0l-2.447 2.447c-.195.195-.195.512 0-.707.018-.418.366-.421.666-.421zm-3.475 6.096l3.426 3.426a1 1 0 001.414-1.414l-3.426-3.426a1 1 0 00-1.414 1.414z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Featured Auctions</h3>
          <p className="text-gray-600">
            Check back later for featured RWA auctions
          </p>
        </div>
      </div>
    );
  }

  const currentAuction = auctions[currentIndex];

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <span>⭐</span>
              <span>Featured Auctions</span>
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Premium RWA tokenization opportunities
            </p>
          </div>
          
          {/* Auto-play Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAutoPlay}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30"
              title={isAutoPlaying ? 'Pause' : 'Play'}
            >
              {isAutoPlaying ? (
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197 2.132a1 1 0 00.555-.168V9.87a1 1 0 00-.555.168l-3.197-2.132a1 1 0 00-1.414 1.414l3.197 2.132a1 1 0 001.414-1.414z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Main Featured Auction */}
        <div className="p-6">
          {currentAuction && (
            <AuctionCard
              auction={currentAuction}
              isSaved={false}
              isWatched={false}
              viewMode="grid"
            />
          )}
        </div>

        {/* Navigation Arrows */}
        {auctions.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg"
            >
              <svg className="h-6 w-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg"
            >
              <svg className="h-6 w-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7-7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {auctions.length > 1 && (
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex space-x-2 overflow-x-auto">
            {auctions.map((auction, index) => (
              <button
                key={auction.id}
                onClick={() => goToSlide(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-blue-500 bg-white'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <img
                  src={auction.image || '/api/placeholder/auction'}
                  alt={auction.title}
                  className="w-full h-full object-cover"
                />
                {index === currentIndex && (
                  <div className="absolute bottom-0 left-0 right-0 bg-blue-500 h-1"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Featured Indicators */}
      {auctions.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {auctions.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
