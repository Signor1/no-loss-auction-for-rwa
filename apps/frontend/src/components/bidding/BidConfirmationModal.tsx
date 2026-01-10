'use client';

import { useState } from 'react';
import { BidRequest, BidValidation } from '@/lib/bidding-system';

interface BidConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bidRequest: BidRequest;
  validation: BidValidation;
  isPlacingBid: boolean;
}

export function BidConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  bidRequest,
  validation,
  isPlacingBid,
}: BidConfirmationModalProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (termsAccepted) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Confirm Your Bid</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Bid Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-lg font-medium text-blue-900 mb-3">Bid Summary</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Bid Amount:</span>
                <span className="text-xl font-bold text-blue-900">{bidRequest.amount} ETH</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Current Highest Bid:</span>
                <span className="font-medium text-blue-900">{validation.minBid} ETH</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Your Increment:</span>
                <span className="font-medium text-green-600">
                  +{(parseFloat(bidRequest.amount) - parseFloat(validation.minBid)).toFixed(4)} ETH
                </span>
              </div>
              
              <div className="border-t border-blue-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-900 font-medium">Total Cost:</span>
                  <span className="text-xl font-bold text-blue-900">
                    {validation.totalCost} ETH
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-medium text-gray-900">Transaction Details</h4>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Network:</span>
                <span className="font-medium">Base Mainnet</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Gas Limit:</span>
                <span className="font-medium">{validation.gasEstimate || '21,000'} units</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Gas Price:</span>
                <span className="font-medium">{validation.gasPrice || '20 Gwei'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Gas Cost:</span>
                <span className="font-medium">
                  {((parseFloat(validation.gasEstimate || '21000') * parseFloat(validation.gasPrice || '0.00000002'))).toFixed(6)} ETH
                </span>
              </div>
            </div>

            {showAdvanced && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Contract Address:</span>
                  <span className="font-mono text-xs">0x1234...5678</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Function:</span>
                  <span className="font-mono text-xs">placeBid(uint256)</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Auction ID:</span>
                  <span className="font-mono text-xs">{bidRequest.auctionId}</span>
                </div>
              </div>
            )}
          </div>

          {/* Important Notices */}
          <div className="space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334 2.722 1.33 3.486 0l5.58-9.92c-.765-1.36-2.722-1.36-3.486 0z" clipRule="evenodd" />
                </svg>
                <div>
                  <h5 className="text-sm font-medium text-yellow-900 mb-1">Important Notice</h5>
                  <p className="text-sm text-yellow-800">
                    Once confirmed, this bid cannot be cancelled or modified. 
                    Please review all details carefully before proceeding.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <svg className="h-5 w-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
                </svg>
                <div>
                  <h5 className="text-sm font-medium text-red-900 mb-1">No-Loss Guarantee</h5>
                  <p className="text-sm text-red-800">
                    This auction is protected by our no-loss guarantee. 
                    If you don't win, your bid amount will be fully refunded.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Terms and Conditions</p>
                <p className="text-gray-600">
                  I agree to the auction terms and conditions. I understand that:
                </p>
                <ul className="mt-2 ml-4 list-disc text-gray-600 space-y-1">
                  <li>This bid is binding and cannot be cancelled</li>
                  <li>Gas fees are non-refundable</li>
                  <li>I have sufficient funds to cover the bid and gas costs</li>
                  <li>I understand the no-loss guarantee terms</li>
                </ul>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isPlacingBid}
              className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800 px-4 py-3 rounded-lg font-medium"
            >
              Cancel
            </button>
            
            <button
              onClick={handleConfirm}
              disabled={!termsAccepted || isPlacingBid}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium"
            >
              {isPlacingBid ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Placing Bid...
                </div>
              ) : (
                'Confirm Bid'
              )}
            </button>
          </div>
          
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              By confirming, you authorize this transaction on the Base network
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
