'use client';

import { UserAuction, RefundRequest } from '@/lib/auction-dashboard';

interface LostAuctionsProps {
  auctions: UserAuction[];
  refunds: RefundRequest[];
  onRefundRequest: (bidId: string) => void;
  formatAddress: (address: string) => string;
  formatTimestamp: (timestamp: number) => string;
}

export function LostAuctions({ 
  auctions, 
  refunds, 
  onRefundRequest,
  formatAddress,
  formatTimestamp 
}: LostAuctionsProps) {
  if (auctions.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 8v4m0 4h.01M6 21a2 2 0 00-2-2v-4a2 2 0 00-2 2v4m0 4h.01M18 21a2 2 0 002-2v-4a2 2 0 00-2 2v4m0 4h.01" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Lost Auctions</h3>
        <p className="text-gray-600">You haven't lost any auctions yet. Keep bidding!</p>
      </div>
    );
  }

  const getRefundStatus = (auctionId: string) => {
    const auction = auctions.find(a => a.id === auctionId);
    const refund = refunds.find(r => r.bidId === auction?.userBid?.id);
    return refund?.status || 'none';
  };

  const getRefundForAuction = (auctionId: string) => {
    const auction = auctions.find(a => a.id === auctionId);
    return refunds.find(r => r.bidId === auction?.userBid?.id);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Lost Auctions</h3>
      
      {auctions.map((auction) => {
        const refundStatus = getRefundStatus(auction.id);
        const refund = getRefundForAuction(auction.id);
        
        return (
          <div key={auction.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Auction Header */}
                <div className="flex items-center space-x-3 mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">{auction.title}</h4>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                    Lost
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    refundStatus === 'completed' ? 'bg-green-100 text-green-800' :
                    refundStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                    refundStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {refundStatus === 'none' ? 'No Refund' :
                     refundStatus === 'completed' ? 'Refunded' :
                     refundStatus === 'processing' ? 'Processing' :
                     refundStatus === 'pending' ? 'Pending' : refundStatus}
                  </span>
                </div>
                
                {/* Auction Description */}
                <p className="text-gray-600 mb-4 line-clamp-2">{auction.description}</p>
                
                {/* Bid Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-red-600">Your Bid:</span>
                      <span className="font-semibold text-red-900">
                        {auction.userBid?.amount} ETH
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-red-600">Final Bid:</span>
                      <span className="font-medium text-red-900">
                        {auction.currentBid} ETH
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ended:</span>
                      <span className="font-medium text-gray-900">
                        {formatTimestamp(auction.endTime)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-600">Winner:</span>
                      <span className="font-medium text-gray-900">
                        {auction.seller ? formatAddress(auction.seller) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Refund Information */}
                {refund && (
                  <div className={`rounded-lg p-3 mb-4 ${
                    refund.status === 'completed' ? 'bg-green-50 border border-green-200' :
                    refund.status === 'processing' ? 'bg-blue-50 border border-blue-200' :
                    refund.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium">
                        {refund.status === 'completed' ? '✓ Refund Completed' :
                         refund.status === 'processing' ? '⏳ Refund Processing' :
                         refund.status === 'pending' ? '⏱️ Refund Pending' : 'Refund Status'}
                      </h5>
                      <span className="text-sm font-mono">
                        {refund.netAmount || refund.amount} ETH
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="opacity-75">Original Amount:</span>
                        <span>{refund.amount} ETH</span>
                      </div>
                      
                      {refund.penalty && (
                        <div className="flex justify-between">
                          <span className="opacity-75">Penalty:</span>
                          <span className="text-red-600">-{refund.penalty} ETH</span>
                        </div>
                      )}
                      
                      {refund.netAmount && (
                        <div className="flex justify-between pt-1 border-t border-current border-opacity-20">
                          <span className="font-medium">Net Amount:</span>
                          <span className="font-bold">{refund.netAmount} ETH</span>
                        </div>
                      )}
                      
                      {refund.transactionHash && (
                        <div className="flex justify-between">
                          <span className="opacity-75">Transaction:</span>
                          <span className="font-mono text-xs">
                            {formatAddress(refund.transactionHash)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex items-center space-x-3">
                  {refundStatus === 'none' && (
                    <button
                      onClick={() => onRefundRequest(auction.userBid?.id || '')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Request Refund
                    </button>
                  )}
                  
                  {refundStatus === 'pending' && (
                    <div className="flex-1 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-medium text-center">
                      Refund Pending
                    </div>
                  )}
                  
                  {refundStatus === 'processing' && (
                    <div className="flex-1 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium text-center">
                      Processing Refund
                    </div>
                  )}
                  
                  {refundStatus === 'completed' && (
                    <div className="flex-1 bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium text-center">
                      Refund Completed
                    </div>
                  )}
                  
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2z" />
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
        );
      })}
    </div>
  );
}
