'use client';

import { useState } from 'react';
import { useAuctionDetail, useBidHistory } from '@/lib/auction-detail';
import { AuctionDetail } from '@/lib/auction-detail';

export function AuctionDetail({ auctionId }: { auctionId: string }) {
  const {
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
  } = useAuctionDetail(auctionId);

  const { bids, isLoading: bidsLoading } = useBidHistory(auctionId);
  const [activeTab, setActiveTab] = useState<'details' | 'bids' | 'documents' | 'analytics'>('details');
  const [showBidModal, setShowBidModal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading auction details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 8v4m0 4h.01M6 21a2 2 0 00-2-2v-4a2 2 0 00-2 2v4m0 4h.01M18 21a2 2 0 00-2-2v-4a2 2 0 00-2 2v4m0 4h.01" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Auction</h3>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 002-2m0 4a2 2 0 012 2h2a2 2 0 012 2v4a2 2 0 012-2-2V9a2 2 0 00-2-2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Auction Not Found</h3>
          <p className="text-gray-600">The auction you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7-7-7" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Auction #{auction.id}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  auction.status === 'active' ? 'bg-green-100 text-green-800' :
                  auction.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {auction.status}
                </span>
                {auction.featured && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                    ⭐ Featured
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowBidModal(true)}
                disabled={isAuctionEnded()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium"
              >
                {isAuctionEnded() ? 'Auction Ended' : 'Place Bid'}
              </button>
              
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M7 7h10l5 5-5-5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Main Image */}
              <div className="relative h-80 bg-gray-200">
                <img
                  src={auction.images[activeImageIndex] || '/api/placeholder/auction'}
                  alt={auction.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Image Navigation */}
                {auction.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg"
                    >
                      <svg className="h-4 w-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7-7-7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg"
                    >
                      <svg className="h-4 w-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7-7" />
                      </svg>
                    </button>
                  </>
                )}
                
                {/* Image Counter */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  {activeImageIndex + 1} / {auction.images.length}
                </div>
              </div>
              
              {/* Thumbnail Strip */}
              {auction.images.length > 1 && (
                <div className="flex space-x-1 p-2 bg-gray-50 overflow-x-auto">
                  {auction.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 ${
                        index === activeImageIndex ? 'border-blue-500' : 'border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${auction.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Middle Column - Auction Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  {[
                    { id: 'details', label: 'Details' },
                    { id: 'bids', label: 'Bid History' },
                    { id: 'documents', label: 'Documents' },
                    { id: 'analytics', label: 'Analytics' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {activeTab === 'details' && <DetailsTab auction={auction} timeLeft={timeLeft} />}
                {activeTab === 'bids' && <BidsTab bids={bids} isLoading={bidsLoading} />}
                {activeTab === 'documents' && <DocumentsTab auction={auction} />}
                {activeTab === 'analytics' && <AnalyticsTab auction={auction} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <BidModal
          auction={auction}
          onClose={() => setShowBidModal(false)}
          onBidPlaced={() => {
            setShowBidModal(false);
            // Refresh auction data
          }}
        />
      )}
    </div>
  );
}

// Details Tab Component
function DetailsTab({ auction, timeLeft }: { auction: AuctionDetail; timeLeft: string }) {
  return (
    <div className="space-y-6">
      {/* Title and Status */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{auction.title}</h1>
        <div className="flex items-center space-x-3 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            auction.status === 'active' ? 'bg-green-100 text-green-800' :
            auction.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {auction.status}
          </span>
          {auction.noLossGuarantee && (
            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              🛡️ No-Loss Guarantee
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
        <p className="text-gray-600 leading-relaxed">{auction.description}</p>
      </div>

      {/* Long Description */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Full Details</h2>
        <div className="prose prose prose-sm text-gray-600">
          {auction.longDescription.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-3">{paragraph}</p>
          ))}
        </div>
      </div>

      {/* Auction Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Auction Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Current Bid</span>
              <span className="text-lg font-bold text-blue-600">{auction.currentBid} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Reserve Price</span>
              <span className="text-lg font-semibold">{auction.reservePrice} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Time Left</span>
              <span className="text-lg font-bold text-red-600">{timeLeft}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Bids</span>
              <span className="text-lg font-semibold">{auction.bidHistory.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Asset Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Asset Type</span>
              <span className="text-sm font-medium">{auction.metadata.assetType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Token ID</span>
              <span className="text-sm font-mono">{auction.assetTokenId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Amount</span>
              <span className="text-sm font-medium">{auction.assetAmount}</span>
            </div>
            {auction.metadata.location && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Location</span>
                <span className="text-sm font-medium">{auction.metadata.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auction Terms */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Auction Terms</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-blue-700">Settlement Period</span>
            <span className="text-sm font-medium">{auction.auctionTerms.settlementPeriod} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-blue-700">Withdrawal Penalty</span>
            <span className="text-sm font-medium">{auction.auctionTerms.withdrawalPenalty}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-blue-700">Auto-Settle</span>
            <span className="text-sm font-medium">{auction.auctionTerms.autoSettle ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Bids Tab Component
function BidsTab({ bids, isLoading }: { bids: any[]; isLoading: boolean }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bid History</h3>
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bid history...</p>
        </div>
      ) : bids.length === 0 ? (
        <div className="text-center py-8">
          <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 002-2m0 4a2 2 0 012 2h2a2 2 0 012 2v4a2 2 0 012-2-2V9a2 2 0 00-2-2z" />
          </svg>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Bids Yet</h4>
          <p className="text-gray-600">Be the first to place a bid on this auction!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bids.map((bid, index) => (
            <div key={bid.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{bid.amount} ETH</div>
                    <div className="text-sm text-gray-600">
                      {formatAddress(bid.bidder)} • {new Date(bid.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {bid.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Documents Tab Component
function DocumentsTab({ auction }: { auction: AuctionDetail }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Documents</h3>
      
      {auction.metadata.documents && auction.metadata.documents.length > 0 ? (
        <div className="space-y-3">
          {auction.metadata.documents.map((doc, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2v-4a2 2 0 00-2 2v4m0 4h.01M18 21a2 2 0 002-2v-4a2 2 0 00-2 2v4m0 4h.01" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{doc.name}</div>
                    <div className="text-sm text-gray-500">{doc.type.toUpperCase()}</div>
                  </div>
                </div>
                <button
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  View Document
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 002-2m0 4a2 2 0 012 2h2a2 2 0 012 2v4a2 2 0 012-2-2V9a2 2 0 00-2-2z" />
          </svg>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Documents Available</h4>
          <p className="text-gray-600">No documents have been uploaded for this asset yet.</p>
        </div>
      )}
    </div>
  );
}

// Analytics Tab Component
function AnalyticsTab({ auction }: { auction: AuctionDetail }) {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Auction Analytics</h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Total Views</h4>
          <div className="text-2xl font-bold text-blue-600">1,234</div>
          <div className="text-sm text-gray-500">+12% from last {timeRange}</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Unique Bidders</h4>
          <div className="text-2xl font-bold text-green-600">{auction.bidHistory.length}</div>
          <div className="text-sm text-gray-500">3 new this {timeRange}</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Watchlist Adds</h4>
          <div className="text-2xl font-bold text-purple-600">89</div>
          <div className="text-sm text-gray-500">+5% from last {timeRange}</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Engagement Rate</h4>
          <div className="text-2xl font-bold text-orange-600">67%</div>
          <div className="text-sm text-gray-500">Above average</div>
        </div>
      </div>
    </div>
  );
}

// Bid Modal Component
function BidModal({ auction, onClose, onBidPlaced }: { 
  auction: AuctionDetail; 
  onClose: () => void; 
  onBidPlaced: () => void 
}) {
  const [bidAmount, setBidAmount] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);

  const handlePlaceBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) return;
    
    setIsPlacing(true);
    try {
      // Simulate bid placement
      await new Promise(resolve => setTimeout(resolve, 2000));
      onBidPlaced();
      onClose();
    } catch (error) {
      console.error('Bid placement failed:', error);
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Place Bid</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bid Amount (ETH)</label>
            <input
              type="number"
              step="0.01"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <div className="mt-1 text-sm text-gray-500">
              Minimum bid: {auction.currentBid} ETH
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Bid Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Your Bid:</span>
                <span className="font-medium">{bidAmount || '0.00'} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Gas Fee:</span>
                <span className="font-medium">~0.002 ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Total:</span>
                <span className="font-medium">
                  {(parseFloat(bidAmount || '0') + 0.002).toFixed(3)} ETH
                </span>
              </div>
            </div>
          </div>
          </div>

          <button
            onClick={handlePlaceBid}
            disabled={isPlacing || !bidAmount || parseFloat(bidAmount) <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium"
          >
            {isPlacing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Placing Bid...
              </div>
            ) : 'Place Bid'}
          </button>
        </div>
      </div>
    </div>
  );
}
