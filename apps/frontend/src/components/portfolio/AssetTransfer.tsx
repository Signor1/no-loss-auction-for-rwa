'use client';

import { useState } from 'react';
import { AssetToken } from '@/lib/asset-portfolio';
import { useAccount } from 'wagmi';

interface AssetTransferProps {
  assetTokens: AssetToken[];
}

export function AssetTransfer({ assetTokens }: AssetTransferProps) {
  const { address } = useAccount();
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatTokenBalance = (balance: string, decimals: number) => {
    return parseFloat(balance) / Math.pow(10, decimals);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const selectedAssetData = assetTokens.find(asset => asset.assetId === selectedAsset);

  const validateTransfer = () => {
    if (!selectedAsset) return 'Please select an asset';
    if (!recipient) return 'Please enter recipient address';
    if (!address || recipient.toLowerCase() === address.toLowerCase()) return 'Invalid recipient address';
    if (!amount || parseFloat(amount) <= 0) return 'Please enter a valid amount';
    
    if (selectedAssetData) {
      const availableBalance = formatTokenBalance(selectedAssetData.balance, selectedAssetData.decimals);
      if (parseFloat(amount) > availableBalance) return 'Insufficient balance';
    }
    
    return null;
  };

  const handleTransfer = async () => {
    const error = validateTransfer();
    if (error) {
      alert(error);
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmTransfer = async () => {
    if (!selectedAssetData) return;

    setIsTransferring(true);
    setShowConfirmModal(false);

    try {
      // Simulate transfer process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add to transfer history
      const newTransfer = {
        id: `transfer_${Date.now()}`,
        assetId: selectedAsset,
        assetTitle: selectedAssetData.assetTitle,
        from: address,
        to: recipient,
        amount: (parseFloat(amount) * Math.pow(10, selectedAssetData.decimals)).toString(),
        valueUSD: parseFloat(amount) * (selectedAssetData.valueUSD / formatTokenBalance(selectedAssetData.balance, selectedAssetData.decimals)),
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).substr(2, 8)}...`,
        status: 'completed',
        gasUsed: '150000',
        gasCost: 0.015,
        type: 'transfer'
      };

      setTransferHistory(prev => [newTransfer, ...prev]);

      // Reset form
      setSelectedAsset('');
      setRecipient('');
      setAmount('');

      alert('Transfer completed successfully!');
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Transfer failed. Please try again.');
    } finally {
      setIsTransferring(false);
    }
  };

  const estimatedValue = selectedAssetData && amount 
    ? parseFloat(amount) * (selectedAssetData.valueUSD / formatTokenBalance(selectedAssetData.balance, selectedAssetData.decimals))
    : 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Asset Transfer</h2>
        <p className="text-gray-600">Transfer your tokenized assets to other addresses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfer Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Initiate Transfer</h3>
          
          <div className="space-y-4">
            {/* Asset Selection */}
            <div>
              <label htmlFor="asset" className="block text-sm font-medium text-gray-700 mb-2">
                Select Asset *
              </label>
              <select
                id="asset"
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose an asset to transfer</option>
                {assetTokens.map((asset) => (
                  <option key={asset.id} value={asset.assetId}>
                    {asset.assetTitle} - {formatTokenBalance(asset.balance, asset.decimals)} tokens
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Address */}
            <div>
              <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Address *
              </label>
              <input
                type="text"
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the Ethereum address of the recipient
              </p>
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.000001"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {selectedAssetData && (
                  <div className="absolute right-2 top-2 text-xs text-gray-500">
                    Available: {formatTokenBalance(selectedAssetData.balance, selectedAssetData.decimals)}
                  </div>
                )}
              </div>
              {selectedAssetData && (
                <div className="mt-2 flex justify-between text-xs text-gray-600">
                  <span>Token Value: {formatCurrency(selectedAssetData.valueUSD / formatTokenBalance(selectedAssetData.balance, selectedAssetData.decimals))}</span>
                  <span>Est. Value: {formatCurrency(estimatedValue)}</span>
                </div>
              )}
            </div>

            {/* Transfer Summary */}
            {selectedAssetData && amount && parseFloat(amount) > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Transfer Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Asset</span>
                    <span className="font-medium text-gray-900">{selectedAssetData.assetTitle}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-medium text-gray-900">{amount} tokens</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estimated Value</span>
                    <span className="font-medium text-gray-900">{formatCurrency(estimatedValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Recipient</span>
                    <span className="font-medium text-gray-900 font-mono text-xs">
                      {recipient.slice(0, 6)}...{recipient.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estimated Gas</span>
                    <span className="font-medium text-gray-900">~0.015 ETH</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleTransfer}
              disabled={isTransferring || !selectedAsset || !recipient || !amount}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isTransferring ? 'Transferring...' : 'Transfer Asset'}
            </button>
          </div>
        </div>

        {/* Transfer History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transfers</h3>
          
          {transferHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transfers yet</h3>
              <p className="text-gray-600">Your transfer history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transferHistory.map((transfer) => (
                <div key={transfer.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600">🔄</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transfer.assetTitle}</p>
                        <p className="text-xs text-gray-600">{formatDate(transfer.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {parseFloat(transfer.amount) / Math.pow(10, 18)} tokens
                      </p>
                      <p className="text-sm text-gray-600">{formatCurrency(transfer.valueUSD)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div>
                      From: {transfer.from?.slice(0, 6)}...{transfer.from?.slice(-4)} → 
                      To: {transfer.to.slice(0, 6)}...{transfer.to.slice(-4)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 font-medium rounded-full ${
                        transfer.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transfer.status}
                      </span>
                      <a 
                        href={`https://etherscan.io/tx/${transfer.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Tx
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transfer Guidelines */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Transfer Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">Before Transferring</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Double-check the recipient address</li>
              <li>• Ensure you have sufficient token balance</li>
              <li>• Review estimated gas costs</li>
              <li>• Consider tax implications</li>
              <li>• Verify asset ownership rights</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">Security Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Never share your private keys</li>
              <li>• Use official wallet interfaces</li>
              <li>• Verify addresses with recipients</li>
              <li>• Start with small test transfers</li>
              <li>• Keep transaction records</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Transfer</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Asset</span>
                <span className="font-medium text-gray-900">{selectedAssetData?.assetTitle}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium text-gray-900">{amount} tokens</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Value</span>
                <span className="font-medium text-gray-900">{formatCurrency(estimatedValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Recipient</span>
                <span className="font-medium text-gray-900 font-mono text-xs">
                  {recipient.slice(0, 6)}...{recipient.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Gas Cost</span>
                <span className="font-medium text-gray-900">~0.015 ETH</span>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Asset transfers are irreversible. Please verify all details before confirming.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmTransfer}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
