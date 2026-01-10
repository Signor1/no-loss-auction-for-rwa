'use client';

import { UserAuction } from '@/lib/auction-dashboard';

interface WonAuctionsProps {
  auctions: UserAuction[];
  onClaimToken: (claimId: string) => void;
  isClaimingToken: boolean;
  formatAddress: (address: string) => string;
  formatTimestamp: (timestamp: number) => string;
}

export function WonAuctions({ 
  auctions, 
  onClaimToken, 
  isClaimingToken,
  formatAddress,
  formatTimestamp 
}: WonAuctionsProps) {
  if (auctions.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Won Auctions Yet</h3>
        <p className="text-gray-600">Keep bidding to win auctions and claim your tokens!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Won Auctions</h3>
      
      {auctions.map((auction) => (
        <div key={auction.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Auction Header */}
              <div className="flex items-center space-x-3 mb-3">
                <h4 className="text-lg font-semibold text-gray-900">{auction.title}</h4>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                  Won
                </span>
                {auction.tokenClaimed ? (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    Token Claimed
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                    Token Available
                  </span>
                )}
              </div>
              
              {/* Auction Description */}
              <p className="text-gray-600 mb-4 line-clamp-2">{auction.description}</p>
              
              {/* Winning Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600">Winning Bid:</span>
                    <span className="font-semibold text-green-900">
                      {auction.userBid?.amount} ETH
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-green-600">Won On:</span>
                    <span className="font-medium text-green-900">
                      {formatTimestamp(auction.endTime)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-600">Token Amount:</span>
                    <span className="font-semibold text-blue-900">
                      {auction.assetAmount} tokens
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-blue-600">Token ID:</span>
                    <span className="font-medium text-blue-900">
                      #{auction.assetTokenId}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Token Information */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-800">
                    <span className="font-medium">Contract:</span>
                    <span className="ml-2 font-mono text-xs">
                      {formatAddress(auction.assetToken)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Category: {auction.category}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-3">
                {!auction.tokenClaimed ? (
                  <button
                    onClick={() => onClaimToken(auction.id)}
                    disabled={isClaimingToken}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium"
                  >
                    {isClaimingToken ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Claiming...
                      </div>
                    ) : 'Claim Token'}
                  </button>
                ) : (
                  <div className="flex-1 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg font-medium text-center">
                    Token Already Claimed
                  </div>
                )}
                
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                  View Token
                </button>
                
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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
