'use client';

import { useState, useMemo } from 'react';

interface BidWithdrawalProps {
  auctionId: string;
  currentBid: string;
  isHighestBidder: boolean;
  withdrawalAllowed: boolean;
  withdrawalPenalty: number;
  onWithdrawBid: (auctionId: string) => Promise<{ success: boolean; error?: string }>;
  balance?: bigint;
}

export function BidWithdrawal({
  auctionId,
  currentBid,
  isHighestBidder,
  withdrawalAllowed,
  withdrawalPenalty,
  onWithdrawBid,
  balance,
}: BidWithdrawalProps) {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [withdrawalResult, setWithdrawalResult] = useState<{
    success: boolean;
    error?: string;
    transactionHash?: string;
  } | null>(null);

  const penaltyAmount = useMemo(() => {
    const bid = parseFloat(currentBid);
    return bid * (withdrawalPenalty / 100);
  }, [currentBid, withdrawalPenalty]);

  const netAmount = useMemo(() => {
    const bid = parseFloat(currentBid);
    return bid - penaltyAmount;
  }, [currentBid, penaltyAmount]);

  const canWithdraw = useMemo(() => {
    return withdrawalAllowed && isHighestBidder;
  }, [withdrawalAllowed, isHighestBidder]);

  const handleWithdrawBid = async () => {
    setIsWithdrawing(true);
    setWithdrawalResult(null);

    try {
      const result = await onWithdrawBid(auctionId);
      setWithdrawalResult(result);
      
      if (result.success) {
        setShowConfirmation(false);
      }
    } catch (error) {
      setWithdrawalResult({
        success: false,
        error: error instanceof Error ? error.message : 'Withdrawal failed',
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!canWithdraw) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bid Withdrawal</h3>
        
        <div className="text-center py-8">
          <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 8v4m0 4h.01M6 21a2 2 0 00-2-2v-4a2 2 0 00-2 2v4m0 4h.01M18 21a2 2 0 002-2v-4a2 2 0 00-2 2v4m0 4h.01" />
          </svg>
          
          <h4 className="text-lg font-medium text-gray-900 mb-2">Withdrawal Not Available</h4>
          
          <div className="text-sm text-gray-600 space-y-2">
            {!isHighestBidder && (
              <p>You are not the highest bidder. Only the highest bidder can withdraw their bid.</p>
            )}
            
            {!withdrawalAllowed && (
              <p>Bid withdrawal is not allowed for this auction.</p>
            )}
            
            {isHighestBidder && withdrawalAllowed && (
              <p>Your bid is currently the highest bid. You can withdraw it if needed.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bid Withdrawal</h3>
      
      {/* Current Bid Status */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-gray-600">Your Bid Amount:</span>
            <div className="font-semibold text-gray-900">{currentBid} ETH</div>
          </div>
          
          <div>
            <span className="text-sm text-gray-600">Withdrawal Penalty:</span>
            <div className="font-semibold text-red-600">{withdrawalPenalty}%</div>
          </div>
          
          <div>
            <span className="text-sm text-gray-600">Net Amount:</span>
            <div className="font-semibold text-green-600">{netAmount.toFixed(4)} ETH</div>
          </div>
        </div>
      </div>

      {/* Withdrawal Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Withdrawal Information</h4>
        
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex justify-between">
            <span>Original Bid Amount:</span>
            <span className="font-medium">{currentBid} ETH</span>
          </div>
          
          <div className="flex justify-between">
            <span>Penalty ({withdrawalPenalty}%):</span>
            <span className="font-medium text-red-600">-{penaltyAmount.toFixed(4)} ETH</span>
          </div>
          
          <div className="flex justify-between pt-2 border-t border-blue-200">
            <span className="font-medium text-blue-900">You will receive:</span>
            <span className="font-bold text-blue-900">{netAmount.toFixed(4)} ETH</span>
          </div>
        </div>
      </div>

      {/* Important Notices */}
      <div className="space-y-3 mb-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334 2.722 1.33 3.486 0l5.58-9.92c-.765-1.36-2.722-1.36-3.486 0z" clipRule="evenodd" />
            </svg>
            <div>
              <h5 className="text-sm font-medium text-yellow-900 mb-1">Important Notice</h5>
              <p className="text-sm text-yellow-800">
                Withdrawing your bid will remove you from the auction. 
                You will need to place a new bid if you want to participate again.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <svg className="h-5 w-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
            </svg>
            <div>
              <h5 className="text-sm font-medium text-red-900 mb-1">Penalty Information</h5>
              <p className="text-sm text-red-800">
                A {withdrawalPenalty}% penalty will be applied to discourage frivolous bidding. 
                This penalty is non-refundable.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Button */}
      <button
        onClick={() => setShowConfirmation(true)}
        className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium"
      >
        Withdraw Bid
      </button>

      {/* Withdrawal Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Bid Withdrawal</h3>
              <button
                onClick={() => setShowConfirmation(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-900 mb-2">Withdrawal Summary</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-700">Bid Amount:</span>
                    <span className="font-medium">{currentBid} ETH</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-red-700">Penalty ({withdrawalPenalty}%):</span>
                    <span className="font-medium text-red-600">-{penaltyAmount.toFixed(4)} ETH</span>
                  </div>
                  
                  <div className="flex justify-between pt-2 border-t border-red-200">
                    <span className="text-red-900 font-medium">Net Amount:</span>
                    <span className="font-bold text-red-900">{netAmount.toFixed(4)} ETH</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  <strong>Important:</strong> Once you withdraw your bid, you will no longer 
                  be the highest bidder. The auction will continue without your participation 
                  unless you place a new bid.
                </p>
              </div>

              {withdrawalResult && (
                <div className={`rounded-lg p-3 ${
                  withdrawalResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm ${
                    withdrawalResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {withdrawalResult.success 
                      ? '✓ Bid withdrawn successfully!' 
                      : `✗ ${withdrawalResult.error}`
                    }
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={isWithdrawing}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleWithdrawBid}
                  disabled={isWithdrawing}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                >
                  {isWithdrawing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Withdrawing...
                    </div>
                  ) : 'Confirm Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
