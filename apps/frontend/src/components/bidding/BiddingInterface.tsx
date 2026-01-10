'use client';

import { useState } from 'react';
import { useBiddingSystem, useBidNotifications } from '@/lib/bidding-system';

export function BiddingInterface({ auctionId }: { auctionId: string }) {
  const {
    isPlacingBid,
    bidAmount,
    setBidAmount,
    bidResult,
    bidValidation,
    autoBidConfig,
    activeBids,
    showConfirmation,
    setShowConfirmation,
    pendingBid,
    setPendingBid,
    auction,
    minBidIncrement,
    balance,
    placeBid,
    withdrawBid,
    enableAutoBid,
    disableAutoBid,
    formatBidAmount,
    calculateGasCost,
    canWithdrawBid,
    isConnected,
  } = useBiddingSystem(auctionId);

  const { addNotification } = useBidNotifications();

  const handleBidSubmit = async () => {
    if (!bidValidation?.isValid) return;

    const request = {
      auctionId,
      amount: bidAmount,
      maxGas: '0.01',
    };

    setPendingBid(request);
    setShowConfirmation(true);
  };

  const handleConfirmBid = async () => {
    if (!pendingBid) return;

    try {
      const result = await placeBid(pendingBid);
      
      if (result.success) {
        addNotification('success', 'Bid Placed Successfully!', 
          `Your bid of ${pendingBid.amount} ETH has been submitted.`);
        setBidAmount('');
        setShowConfirmation(false);
        setPendingBid(null);
      } else {
        addNotification('error', 'Bid Failed', result.error || 'Transaction failed');
      }
    } catch (error) {
      addNotification('error', 'Bid Failed', 'An unexpected error occurred');
    }
  };

  const handleWithdrawBid = async () => {
    try {
      const result = await withdrawBid(auctionId);
      
      if (result.success) {
        addNotification('success', 'Bid Withdrawn', 
          'Your bid has been withdrawn successfully.');
      } else {
        addNotification('error', 'Withdrawal Failed', result.error || 'Transaction failed');
      }
    } catch (error) {
      addNotification('error', 'Withdrawal Failed', 'An unexpected error occurred');
    }
  };

  const handleAutoBidToggle = () => {
    if (autoBidConfig.active) {
      disableAutoBid();
      addNotification('info', 'Auto-bid Disabled', 
        'Auto-bidding has been disabled for this auction.');
    } else {
      enableAutoBid({
        enabled: true,
        maxAmount: (parseFloat(minBidIncrement.toString()) * 2).toFixed(4),
        increment: '0.1',
        maxGas: '0.01',
        active: true,
      });
      addNotification('info', 'Auto-bid Enabled', 
        'Auto-bidding has been enabled for this auction.');
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Wallet to Bid</h3>
          <p className="text-gray-600">Connect your wallet to participate in this auction</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Bid Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Bid Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{auction.currentBid} ETH</div>
            <div className="text-sm text-gray-600">Current Bid</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{minBidIncrement.toFixed(4)} ETH</div>
            <div className="text-sm text-gray-600">Minimum Bid</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {balance ? formatEther(balance.value).slice(0, 6) : '0.000'} ETH
            </div>
            <div className="text-sm text-gray-600">Your Balance</div>
          </div>
        </div>

        {/* Highest Bidder */}
        {auction.highestBidder && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Highest Bidder</span>
              <span className="text-sm font-mono text-gray-900">
                {auction.highestBidder.slice(0, 6)}...{auction.highestBidder.slice(-4)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bidding Interface */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Place Your Bid</h3>
        
        <div className="space-y-4">
          {/* Bid Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bid Amount (ETH)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.0001"
                min={minBidIncrement.toString()}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="0.0000"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  bidValidation?.isValid === false 
                    ? 'border-red-300 focus:ring-red-500' 
                    : bidValidation?.isValid === true
                    ? 'border-green-300 focus:ring-green-500'
                    : 'border-gray-300'
                }`}
                disabled={isPlacingBid}
              />
              {bidValidation && (
                <div className={`absolute right-3 top-2.5 text-sm ${
                  bidValidation.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {bidValidation.isValid ? '✓' : '✗'}
                </div>
              )}
            </div>
            
            {/* Validation Messages */}
            {bidValidation && (
              <div className={`mt-1 text-sm ${
                bidValidation.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {bidValidation.error || `Valid bid. Total cost: ${bidValidation.totalCost} ETH`}
              </div>
            )}
            
            {/* Quick Bid Buttons */}
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => setBidAmount(minBidIncrement.toString())}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700"
              >
                Min Bid
              </button>
              <button
                onClick={() => setBidAmount((minBidIncrement * 1.1).toFixed(4))}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700"
              >
                +10%
              </button>
              <button
                onClick={() => setBidAmount((minBidIncrement * 1.25).toFixed(4))}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700"
              >
                +25%
              </button>
            </div>
          </div>

          {/* Gas Estimation */}
          {bidValidation?.isValid && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Transaction Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Bid Amount:</span>
                  <span className="font-medium">{bidAmount} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Estimated Gas:</span>
                  <span className="font-medium">{bidValidation.gasEstimate} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Gas Price:</span>
                  <span className="font-medium">{bidValidation.gasPrice} ETH</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-200">
                  <span className="text-blue-900 font-medium">Total Cost:</span>
                  <span className="font-bold text-blue-900">{bidValidation.totalCost} ETH</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleBidSubmit}
              disabled={!bidValidation?.isValid || isPlacingBid}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium"
            >
              {isPlacingBid ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Placing Bid...
                </div>
              ) : 'Place Bid'}
            </button>
            
            {canWithdrawBid() && (
              <button
                onClick={handleWithdrawBid}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                Withdraw
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auto-Bid Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Auto-Bid Settings</h3>
          <button
            onClick={handleAutoBidToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
              autoBidConfig.active ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              autoBidConfig.active ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {autoBidConfig.active && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Auto-Bid Amount (ETH)
              </label>
              <input
                type="number"
                step="0.0001"
                value={autoBidConfig.maxAmount}
                onChange={(e) => setAutoBidConfig(prev => ({ ...prev, maxAmount: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bid Increment (ETH)
              </label>
              <input
                type="number"
                step="0.0001"
                value={autoBidConfig.increment}
                onChange={(e) => setAutoBidConfig(prev => ({ ...prev, increment: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Auto-bid is active</strong>. The system will automatically place bids on your behalf 
                up to your maximum amount when you are outbid.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Active Transactions */}
      {activeBids.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Transactions</h3>
          
          <div className="space-y-3">
            {activeBids.map((bid) => (
              <div key={bid.hash} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{bid.amount} ETH</div>
                    <div className="text-sm text-gray-600">
                      Hash: {bid.hash.slice(0, 10)}...{bid.hash.slice(-8)}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      bid.status === 'confirmed' ? 'text-green-600' :
                      bid.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {bid.status === 'confirmed' ? '✓ Confirmed' :
                       bid.status === 'failed' ? '✗ Failed' : '⏳ Pending'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Gas: {bid.gasUsed} units
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bid Confirmation Modal */}
      {showConfirmation && pendingBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Your Bid</h3>
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
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Bid Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Bid Amount:</span>
                    <span className="font-medium">{pendingBid.amount} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Estimated Gas:</span>
                    <span className="font-medium">~0.00042 ETH</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-900">Total:</span>
                    <span className="font-bold text-gray-900">
                      {calculateGasCost(pendingBid.amount)} ETH
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Placing a bid requires transaction signing. 
                  This action cannot be undone once confirmed.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmBid}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Confirm Bid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
