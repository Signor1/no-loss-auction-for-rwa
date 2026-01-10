'use client';

import { TokenClaim } from '@/lib/auction-dashboard';
import { useTokenClaims } from '@/lib/auction-dashboard';

interface TokenClaimInterfaceProps {
  claims: TokenClaim[];
  onClaimToken: (claimId: string) => void;
  isClaimingToken: boolean;
}

export function TokenClaimInterface({ 
  claims, 
  onClaimToken, 
  isClaimingToken 
}: TokenClaimInterfaceProps) {
  const { getClaimableTokens, getClaimedTokens } = useTokenClaims();
  
  const claimableTokens = getClaimableTokens();
  const claimedTokens = getClaimedTokens();

  if (claims.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Token Claims</h3>
        
        <div className="text-center py-8">
          <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m2 13a2 2 0 002-2v-7a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h4 className="text-sm font-medium text-gray-900 mb-2">No Tokens Available</h4>
          <p className="text-gray-600 text-sm">Win auctions to claim your tokens</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-50';
      case 'claimed': return 'text-blue-600 bg-blue-50';
      case 'processing': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return '🎁';
      case 'claimed': return '✅';
      case 'processing': return '⏳';
      default: return '○';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Token Claims</h3>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {claimableTokens.length} available
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-sm text-gray-600">
            {claimedTokens.length} claimed
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        {claims.map((claim) => (
          <div key={claim.id} className="border border-gray-200 rounded-lg p-4">
            {/* Token Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(claim.status)}`}>
                  {getStatusIcon(claim.status)} {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                </span>
                <span className="text-sm text-gray-600">Token #{claim.tokenId}</span>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-gray-900">{claim.amount} tokens</div>
                <div className="text-xs text-gray-500">
                  {new Date(claim.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {/* Token Details */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Contract:</span>
                  <span className="font-mono text-xs text-gray-900">
                    {claim.contractAddress.slice(0, 10)}...{claim.contractAddress.slice(-8)}
                  </span>
                </div>
                
                {claim.metadata && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="text-gray-900">{claim.metadata.name}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Symbol:</span>
                      <span className="text-gray-900">{claim.metadata.symbol}</span>
                    </div>
                    
                    {claim.metadata.description && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Description:</span>
                        <span className="text-gray-900 text-xs max-w-[200px] truncate">
                          {claim.metadata.description}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Claim Actions */}
            <div className="flex items-center space-x-3">
              {claim.status === 'available' && (
                <button
                  onClick={() => onClaimToken(claim.id)}
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
              )}
              
              {claim.status === 'processing' && (
                <div className="flex-1 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-medium text-center">
                  Processing Claim
                </div>
              )}
              
              {claim.status === 'claimed' && (
                <div className="flex-1 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium text-center">
                  Token Claimed
                </div>
              )}
              
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
            
            {/* Transaction Hash */}
            {claim.transactionHash && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Transaction:</span>
                  <span className="font-mono text-xs text-blue-600">
                    {claim.transactionHash.slice(0, 10)}...{claim.transactionHash.slice(-8)}
                  </span>
                </div>
              </div>
            )}
            
            {/* Status Message */}
            <div className={`mt-3 p-2 rounded text-xs ${
              claim.status === 'available' ? 'bg-green-50 text-green-800' :
              claim.status === 'claimed' ? 'bg-blue-50 text-blue-800' :
              claim.status === 'processing' ? 'bg-yellow-50 text-yellow-800' :
              'bg-gray-50 text-gray-800'
            }`}>
              {claim.status === 'available' && '🎁 Your tokens are ready to be claimed! Click the button above to claim them.'}
              {claim.status === 'claimed' && '✅ Tokens have been successfully claimed and transferred to your wallet.'}
              {claim.status === 'processing' && '⏳ Your token claim is being processed. This usually takes a few minutes.'}
            </div>
          </div>
        ))}
      </div>
      
      {/* Claim Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{claimableTokens.length}</div>
            <div className="text-gray-600">Available</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{claimedTokens.length}</div>
            <div className="text-gray-600">Claimed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
