'use client';

import { useState } from 'react';
import { useAuctionDashboard } from '@/lib/auction-dashboard';
import { DashboardStats } from './DashboardStats';
import { ActiveBids } from './ActiveBids';
import { WonAuctions } from './WonAuctions';
import { LostAuctions } from './LostAuctions';
import { RefundTracking } from './RefundTracking';
import { TokenClaimInterface } from './TokenClaimInterface';

export function AuctionDashboard() {
  const {
    userBids,
    userAuctions,
    refunds,
    tokenClaims,
    stats,
    filteredAuctions,
    isLoading,
    activeTab,
    setActiveTab,
    isClaimingToken,
    claimToken,
    requestRefund,
    formatAddress,
    formatTimestamp,
    getTimeRemaining,
  } = useAuctionDashboard();

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your auction dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Auction Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your bids, winnings, and token claims</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                View All Auctions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardStats stats={stats} />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'active', label: 'Active Bids', count: stats.activeBids },
                    { id: 'won', label: 'Won Auctions', count: stats.wonAuctions },
                    { id: 'lost', label: 'Lost Auctions', count: stats.lostAuctions },
                    { id: 'history', label: 'History', count: stats.totalBids },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'active' && (
                  <ActiveBids 
                    auctions={filteredAuctions}
                    onWithdrawBid={(bidId) => {
                      setSelectedBidId(bidId);
                      setShowRefundModal(true);
                    }}
                    getTimeRemaining={getTimeRemaining}
                    formatAddress={formatAddress}
                  />
                )}
                
                {activeTab === 'won' && (
                  <WonAuctions 
                    auctions={filteredAuctions}
                    onClaimToken={claimToken}
                    isClaimingToken={isClaimingToken}
                    formatAddress={formatAddress}
                    formatTimestamp={formatTimestamp}
                  />
                )}
                
                {activeTab === 'lost' && (
                  <LostAuctions 
                    auctions={filteredAuctions}
                    refunds={refunds}
                    onRefundRequest={requestRefund}
                    formatAddress={formatAddress}
                    formatTimestamp={formatTimestamp}
                  />
                )}
                
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Auction History</h3>
                    <div className="space-y-3">
                      {userAuctions.map((auction) => (
                        <div key={auction.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{auction.title}</h4>
                              <p className="text-sm text-gray-600">
                                {auction.userBid ? `Bid: ${auction.userBid.amount} ETH` : 'No bid placed'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatTimestamp(auction.endTime)}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                auction.userWon 
                                  ? 'bg-green-100 text-green-800'
                                  : auction.userBid?.status === 'active'
                                  ? 'bg-blue-100 text-blue-800'
                                  : auction.userBid?.status === 'lost'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {auction.userWon ? 'Won' : 
                                 auction.userBid?.status === 'active' ? 'Active' :
                                 auction.userBid?.status === 'lost' ? 'Lost' : 'No Bid'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                  Browse Active Auctions
                </button>
                <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
                  Claim Available Tokens
                </button>
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium">
                  View Refund Status
                </button>
              </div>
            </div>

            {/* Token Claims */}
            <TokenClaimInterface 
              claims={tokenClaims}
              onClaimToken={claimToken}
              isClaimingToken={isClaimingToken}
            />

            {/* Refund Tracking */}
            <RefundTracking refunds={refunds} />
          </div>
        </div>
      </div>

      {/* Withdraw Bid Modal */}
      {showRefundModal && selectedBidId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Withdraw Bid</h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> Withdrawing your bid will remove you from the auction. 
                  A 5% penalty will be applied to your bid amount.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    requestRefund(selectedBidId);
                    setShowRefundModal(false);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Withdraw Bid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
