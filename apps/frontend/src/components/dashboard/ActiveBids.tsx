'use client';

import { UserAuction } from '@/lib/auction-dashboard';

interface ActiveBidsProps {
  auctions: UserAuction[];
  onWithdrawBid: (bidId: string) => void;
  getTimeRemaining: (endTime: number) => string;
  formatAddress: (address: string) => string;
}

export function ActiveBids({ 
  auctions, 
  onWithdrawBid, 
  getTimeRemaining, 
  formatAddress 
}: ActiveBidsProps) {
  if (auctions.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Bids</h3>
        <p className="text-gray-600">You don't have any active bids at the moment.</p>
        <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
          Browse Auctions
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Active Bids</h3>
      
      {auctions.map((auction) => (
        <div key={auction.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Auction Header */}
              <div className="flex items-center space-x-3 mb-3">
                <h4 className="text-lg font-semibold text-gray-900">{auction.title}</h4>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  Active
                </span>
                {auction.userBid?.isHighest && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    Highest Bid
                  </span>
                )}
              </div>
              
              {/* Auction Description */}
              <p className="text-gray-600 mb-4 line-clamp-2">{auction.description}</p>
              
              {/* Bid Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Your Bid:</span>
                    <span className="font-semibold text-blue-600">
                      {auction.userBid?.amount} ETH
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-600">Current Bid:</span>
                    <span className="font-medium">{auction.currentBid} ETH</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Time Left:</span>
                    <span className="font-medium text-red-600">
                      {getTimeRemaining(auction.endTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-600">Reserve:</span>
                    <span className="font-medium">{auction.reservePrice} ETH</span>
                  </div>
                </div>
              </div>
              
              {/* Transaction Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">Transaction:</span>
                    <span className="ml-2 font-mono text-xs">
                      {formatAddress(auction.userBid?.transactionHash || '')}
                    </span>
                  </div>
                  <div className="text-xs text-blue-600">
                    Block #{auction.userBid?.blockNumber}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-3">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                  View Auction
                </button>
                
                {auction.userBid?.isHighest && (
                  <button
                    onClick={() => onWithdrawBid(auction.userBid.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                  >
                    Withdraw Bid
                  </button>
                )}
                
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Auction Image */}
            <div className="ml-4 flex-shrink-0">
              <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={auction.images[0] || '/api/placeholder/auction'}
                  alt={auction.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
