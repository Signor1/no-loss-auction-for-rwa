'use client';

import { useState, useMemo } from 'react';
import { formatEther } from 'viem';

interface BidCalculatorProps {
  currentBid: string;
  reservePrice: string;
  minIncrement: string;
  onAmountChange: (amount: string) => void;
  balance?: bigint;
}

export function BidCalculator({
  currentBid,
  reservePrice,
  minIncrement,
  onAmountChange,
  balance,
}: BidCalculatorProps) {
  const [customAmount, setCustomAmount] = useState('');
  const [calculationMode, setCalculationMode] = useState<'percentage' | 'fixed'>('percentage');
  const [percentage, setPercentage] = useState('10');
  const [fixedAmount, setFixedAmount] = useState('0.1');

  const minBid = useMemo(() => {
    const current = parseFloat(currentBid);
    const reserve = parseFloat(reservePrice);
    const increment = parseFloat(minIncrement);
    return Math.max(current + increment, reserve);
  }, [currentBid, reservePrice, minIncrement]);

  const calculatedAmount = useMemo(() => {
    if (calculationMode === 'percentage') {
      const percent = parseFloat(percentage) / 100;
      return (minBid * (1 + percent)).toFixed(4);
    } else {
      return (minBid + parseFloat(fixedAmount)).toFixed(4);
    }
  }, [calculationMode, percentage, fixedAmount, minBid]);

  const gasEstimate = useMemo(() => {
    const gasLimit = 21000;
    const gasPrice = 0.00000002; // 20 gwei
    return gasLimit * gasPrice;
  }, []);

  const totalCost = useMemo(() => {
    return parseFloat(calculatedAmount) + gasEstimate;
  }, [calculatedAmount, gasEstimate]);

  const canAfford = useMemo(() => {
    if (!balance) return false;
    return parseFloat(formatEther(balance)) >= totalCost;
  }, [balance, totalCost]);

  const applyCalculation = () => {
    onAmountChange(calculatedAmount);
    setCustomAmount(calculatedAmount);
  };

  const quickBidOptions = [
    { label: 'Min Bid', amount: minBid.toFixed(4) },
    { label: '+5%', amount: (minBid * 1.05).toFixed(4) },
    { label: '+10%', amount: (minBid * 1.10).toFixed(4) },
    { label: '+25%', amount: (minBid * 1.25).toFixed(4) },
    { label: '+50%', amount: (minBid * 1.50).toFixed(4) },
    { label: '2x Min', amount: (minBid * 2).toFixed(4) },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bid Calculator</h3>
      
      {/* Current Auction Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Current Bid:</span>
            <div className="font-semibold text-gray-900">{currentBid} ETH</div>
          </div>
          <div>
            <span className="text-gray-600">Reserve Price:</span>
            <div className="font-semibold text-gray-900">{reservePrice} ETH</div>
          </div>
          <div>
            <span className="text-gray-600">Min Increment:</span>
            <div className="font-semibold text-gray-900">{minIncrement} ETH</div>
          </div>
          <div>
            <span className="text-gray-600">Minimum Bid:</span>
            <div className="font-semibold text-blue-600">{minBid.toFixed(4)} ETH</div>
          </div>
        </div>
      </div>

      {/* Quick Bid Options */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Bids</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {quickBidOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => onAmountChange(option.amount)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <div className="font-semibold">{option.label}</div>
              <div className="text-xs text-gray-600">{option.amount} ETH</div>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Calculator */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Advanced Calculator</h4>
        
        {/* Calculation Mode */}
        <div className="flex space-x-2">
          <button
            onClick={() => setCalculationMode('percentage')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              calculationMode === 'percentage'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Percentage
          </button>
          <button
            onClick={() => setCalculationMode('fixed')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              calculationMode === 'fixed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Fixed Amount
          </button>
        </div>

        {/* Calculation Input */}
        {calculationMode === 'percentage' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Increase Percentage
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="flex items-center text-gray-600">%</span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Bid amount: {calculatedAmount} ETH
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fixed Increase Amount
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="0.0001"
                step="0.0001"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="flex items-center text-gray-600">ETH</span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Bid amount: {calculatedAmount} ETH
            </div>
          </div>
        )}

        {/* Apply Button */}
        <button
          onClick={applyCalculation}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Apply Calculation
        </button>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-3">Cost Breakdown</h4>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">Bid Amount:</span>
            <span className="font-medium text-blue-900">{calculatedAmount} ETH</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">Gas Estimate:</span>
            <span className="font-medium text-blue-900">{gasEstimate.toFixed(6)} ETH</span>
          </div>
          
          <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
            <span className="text-blue-900 font-medium">Total Cost:</span>
            <span className="font-bold text-blue-900">{totalCost.toFixed(6)} ETH</span>
          </div>
        </div>

        {/* Balance Check */}
        {balance && (
          <div className={`mt-3 p-2 rounded ${
            canAfford 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {canAfford ? '✓ Sufficient Balance' : '⚠ Insufficient Balance'}
              </span>
              <span>
                {formatEther(balance).slice(0, 8)} ETH available
              </span>
            </div>
            {!canAfford && (
              <div className="mt-1 text-xs">
                Need {(totalCost - parseFloat(formatEther(balance))).toFixed(6)} ETH more
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bid Strategy Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">Bid Strategy Tips</h4>
        <ul className="space-y-1 text-sm text-yellow-800">
          <li>• Place bids just above the minimum to save on gas</li>
          <li>• Consider using auto-bid for competitive auctions</li>
          <li>• Monitor gas prices for optimal timing</li>
          <li>• Set a maximum budget to avoid overbidding</li>
        </ul>
      </div>
    </div>
  );
}
