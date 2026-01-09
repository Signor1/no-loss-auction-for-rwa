'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWaitForTransactionReceipt, useTransaction } from 'wagmi';
import { formatEther, formatUnits } from 'viem';
import { useBaseNetwork } from '@/lib/base-network';

interface Transaction {
  hash: string;
  from: string;
  to?: string;
  value?: bigint;
  data?: string;
  gasLimit?: bigint;
  gasPrice?: bigint;
  nonce?: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed' | 'replaced';
  blockNumber?: number;
  blockHash?: string;
  confirmations?: number;
}

interface TransactionTrackerProps {
  transactionHash?: string;
  onTransactionUpdate?: (transaction: Transaction) => void;
}

export function TransactionTracker({ transactionHash, onTransactionUpdate }: TransactionTrackerProps) {
  const { address } = useAccount();
  const { getExplorerUrl, currentNetwork } = useBaseNetwork();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  const { data: receipt, isLoading: isReceiptLoading } = useWaitForTransactionReceipt({
    hash: transactionHash as `0x${string}`,
  });

  const { data: transaction } = useTransaction({
    hash: transactionHash as `0x${string}`,
  });

  useEffect(() => {
    if (transactionHash) {
      setIsTracking(true);
      trackTransaction(transactionHash);
    }
  }, [transactionHash]);

  const trackTransaction = (hash: string) => {
    const txIndex = transactions.findIndex(tx => tx.hash === hash);
    
    if (txIndex === -1) {
      // New transaction
      const newTx: Transaction = {
        hash,
        from: address || '',
        timestamp: Date.now(),
        status: 'pending',
      };
      
      setTransactions(prev => [newTx, ...prev]);
    } else if (receipt) {
      // Update existing transaction
      const updatedTx: Transaction = {
        ...transactions[txIndex],
        status: receipt.status === 'success' ? 'confirmed' : 'failed',
        blockNumber: Number(receipt.blockNumber),
        blockHash: receipt.blockHash,
        confirmations: receipt.confirmations,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
      };
      
      setTransactions(prev => {
        const updated = [...prev];
        updated[txIndex] = updatedTx;
        return updated;
      });
      
      onTransactionUpdate?.(updatedTx);
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'replaced': return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
        );
      case 'confirmed':
        return (
          <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
          </svg>
        );
      case 'replaced':
        return (
          <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  const formatValue = (value?: bigint) => {
    if (!value) return '0 ETH';
    return `${formatEther(value)} ETH`;
  };

  const formatGasPrice = (gasPrice?: bigint) => {
    if (!gasPrice) return '0 Gwei';
    return `${formatUnits(gasPrice, 'gwei')} Gwei`;
  };

  const getConfirmationTime = (confirmations?: number) => {
    if (!confirmations) return 'Confirming...';
    if (confirmations >= 12) return 'Finalized';
    if (confirmations >= 6) return 'Highly Confirmed';
    if (confirmations >= 3) return 'Confirmed';
    return `${confirmations} Confirmations`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Status</h3>
      
      {transactionHash && (
        <div className="space-y-4">
          {/* Current Transaction */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(receipt ? (receipt.status === 'success' ? 'confirmed' : 'failed') : 'pending')}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  receipt ? (receipt.status === 'success' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50') : 'text-yellow-600 bg-yellow-50'
                }`}>
                  {receipt ? (receipt.status === 'success' ? 'Confirmed' : 'Failed') : 'Pending'}
                </span>
              </div>
              
              {currentNetwork && (
                <a
                  href={getExplorerUrl('tx', transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View on Explorer
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Transaction Hash:</span>
                <div className="font-mono text-gray-900">{formatHash(transactionHash)}</div>
              </div>
              
              <div>
                <span className="text-gray-600">Status:</span>
                <div className="font-medium">{getConfirmationTime(receipt?.confirmations)}</div>
              </div>

              {transaction && (
                <>
                  <div>
                    <span className="text-gray-600">From:</span>
                    <div className="font-mono text-gray-900">{formatHash(transaction.from)}</div>
                  </div>
                  
                  {transaction.to && (
                    <div>
                      <span className="text-gray-600">To:</span>
                      <div className="font-mono text-gray-900">{formatHash(transaction.to)}</div>
                    </div>
                  )}
                  
                  {transaction.value && (
                    <div>
                      <span className="text-gray-600">Value:</span>
                      <div className="font-medium">{formatValue(transaction.value)}</div>
                    </div>
                  )}
                  
                  {receipt && (
                    <div>
                      <span className="text-gray-600">Gas Used:</span>
                      <div className="font-medium">
                        {receipt.gasUsed?.toString()} / {transaction.gas?.toString()}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          {isReceiptLoading && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Waiting for confirmation...</span>
              </div>
              
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}

          {/* Confirmation Details */}
          {receipt && receipt.status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 mb-2">Transaction Confirmed</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700">Block Number:</span>
                  <div className="font-medium text-green-900">{receipt.blockNumber?.toString()}</div>
                </div>
                <div>
                  <span className="text-green-700">Confirmations:</span>
                  <div className="font-medium text-green-900">{receipt.confirmations}</div>
                </div>
                {receipt.effectiveGasPrice && (
                  <div>
                    <span className="text-green-700">Gas Price:</span>
                    <div className="font-medium text-green-900">{formatGasPrice(receipt.effectiveGasPrice)}</div>
                  </div>
                )}
                {receipt.gasUsed && (
                  <div>
                    <span className="text-green-700">Gas Used:</span>
                    <div className="font-medium text-green-900">{receipt.gasUsed.toString()}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {receipt && receipt.status === 'failure' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-900 mb-2">Transaction Failed</h4>
              <p className="text-sm text-red-700">
                The transaction was not successful. Please check the transaction details and try again.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Transaction History */}
      {transactions.length > 1 && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Recent Transactions</h4>
          <div className="space-y-2">
            {transactions.slice(1).map((tx) => (
              <div key={tx.hash} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(tx.status)}
                  <div>
                    <div className="text-sm font-mono">{formatHash(tx.hash)}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                  {currentNetwork && (
                    <a
                      href={getExplorerUrl('tx', tx.hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TransactionHistory() {
  const { address, currentNetwork, getExplorerUrl } = useBaseNetwork();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (address && currentNetwork) {
      loadTransactionHistory();
    }
  }, [address, currentNetwork]);

  const loadTransactionHistory = async () => {
    if (!address || !currentNetwork) return;

    setIsLoading(true);
    try {
      // This would integrate with BaseScan API or similar
      // For now, using placeholder data
      const mockTransactions: Transaction[] = [
        {
          hash: '0x1234567890abcdef1234567890abcdef12345678',
          from: address,
          to: '0xabcdef1234567890abcdef1234567890abcdef12',
          value: BigInt('1000000000000000000'), // 1 ETH
          timestamp: Date.now() - 3600000, // 1 hour ago
          status: 'confirmed',
          confirmations: 12,
        },
        {
          hash: '0x2345678901bcdef12345678901bcdef123456789',
          from: address,
          to: '0xbcdef12345678901bcdef12345678901bcdef12',
          value: BigInt('500000000000000000'), // 0.5 ETH
          timestamp: Date.now() - 7200000, // 2 hours ago
          status: 'confirmed',
          confirmations: 24,
        },
      ];

      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-center text-gray-500">Connect wallet to view transaction history</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        <button
          onClick={loadTransactionHistory}
          disabled={isLoading}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-4 text-gray-600">No transactions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.hash} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className={`w-2 h-2 rounded-full ${
                  tx.status === 'confirmed' ? 'bg-green-500' :
                  tx.status === 'pending' ? 'bg-yellow-500' :
                  tx.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
                
                <div>
                  <div className="font-mono text-sm">{tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-medium">{tx.value ? formatEther(tx.value) : '0'} ETH</div>
                  <div className="text-xs text-gray-500 capitalize">{tx.status}</div>
                </div>
                
                <a
                  href={getExplorerUrl('tx', tx.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
