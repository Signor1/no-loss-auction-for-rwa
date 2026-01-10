'use client';

import { AssetFormState, PricingStrategy } from '@/lib/asset-management';

interface PricingFormProps {
  formState: AssetFormState;
  updateFormState: (updates: Partial<AssetFormState>) => void;
  validationErrors: Record<string, string[]>;
}

export function PricingForm({ formState, updateFormState, validationErrors }: PricingFormProps) {
  const handleInputChange = (field: keyof AssetFormState, value: any) => {
    updateFormState({ [field]: value });
  };

  const handleNestedChange = (parentField: keyof AssetFormState, childField: string, value: any) => {
    const parent = formState[parentField] as any;
    updateFormState({
      [parentField]: {
        ...parent,
        [childField]: value
      }
    });
  };

  const calculateSuggestedReservePrice = () => {
    const estimatedValue = formState.valuation?.estimatedValue || 0;
    const minValue = formState.valuation?.minValue || 0;
    const maxValue = formState.valuation?.maxValue || 0;
    
    // Use the minimum of estimated value or range minimum as base
    const baseValue = Math.min(estimatedValue || minValue, minValue || estimatedValue);
    
    // Suggest 60-80% of base value as reserve price
    const suggestedMin = baseValue * 0.6;
    const suggestedMax = baseValue * 0.8;
    
    return { suggestedMin, suggestedMax };
  };

  const { suggestedMin, suggestedMax } = calculateSuggestedReservePrice();

  return (
    <div className="space-y-6">
      {/* Pricing Strategy */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Strategy</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="pricingStrategy" className="block text-sm font-medium text-gray-700 mb-2">
              Pricing Strategy *
            </label>
            <select
              id="pricingStrategy"
              value={formState.pricing?.pricingStrategy || ''}
              onChange={(e) => handleNestedChange('pricing', 'pricingStrategy', e.target.value as PricingStrategy)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select pricing strategy</option>
              <option value="reserve-price">Reserve Price Auction</option>
              <option value="no-reserve">No Reserve Auction</option>
              <option value="buy-it-now">Buy It Now</option>
              <option value="reserve-plus-bin">Reserve Price + Buy It Now</option>
            </select>
            {validationErrors['pricing.pricingStrategy'] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors['pricing.pricingStrategy'][0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency *
            </label>
            <select
              id="currency"
              value={formState.pricing?.currency || 'USD'}
              onChange={(e) => handleNestedChange('pricing', 'currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="ETH">ETH - Ethereum</option>
              <option value="USDC">USDC - USD Coin</option>
              <option value="USDT">USDT - Tether</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reserve Price */}
      {(formState.pricing?.pricingStrategy === 'reserve-price' || formState.pricing?.pricingStrategy === 'reserve-plus-bin') && (
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reserve Price Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="reservePrice" className="block text-sm font-medium text-gray-700 mb-2">
                Reserve Price *
              </label>
              <input
                type="number"
                id="reservePrice"
                value={formState.pricing?.reservePrice || ''}
                onChange={(e) => handleNestedChange('pricing', 'reservePrice', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {validationErrors['pricing.reservePrice'] && (
                <p className="mt-1 text-sm text-red-600">{validationErrors['pricing.reservePrice'][0]}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Minimum price you're willing to accept
              </p>
            </div>

            <div>
              <label htmlFor="showReservePrice" className="block text-sm font-medium text-gray-700 mb-2">
                Reserve Price Visibility
              </label>
              <select
                id="showReservePrice"
                value={formState.pricing?.showReservePrice ? 'true' : 'false'}
                onChange={(e) => handleNestedChange('pricing', 'showReservePrice', e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="false">Hidden (Recommended)</option>
                <option value="true">Visible to Bidders</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Hidden reserves typically attract more bids
              </p>
            </div>
          </div>

          {/* Suggested Reserve Price */}
          {suggestedMin > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Suggested Reserve Price:</strong> ${suggestedMin.toFixed(2)} - ${suggestedMax.toFixed(2)}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Based on 60-80% of your estimated asset value
              </p>
            </div>
          )}
        </div>
      )}

      {/* Buy It Now Price */}
      {(formState.pricing?.pricingStrategy === 'buy-it-now' || formState.pricing?.pricingStrategy === 'reserve-plus-bin') && (
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Buy It Now Settings</h3>
          
          <div>
            <label htmlFor="buyItNowPrice" className="block text-sm font-medium text-gray-700 mb-2">
              Buy It Now Price *
            </label>
            <input
              type="number"
              id="buyItNowPrice"
              value={formState.pricing?.buyItNowPrice || ''}
              onChange={(e) => handleNestedChange('pricing', 'buyItNowPrice', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            {validationErrors['pricing.buyItNowPrice'] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors['pricing.buyItNowPrice'][0]}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Price for immediate purchase (typically 10-20% above estimated value)
            </p>
          </div>

          {formState.pricing?.pricingStrategy === 'reserve-plus-bin' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Buy It Now will be disabled once the reserve price is met
              </p>
            </div>
          )}
        </div>
      )}

      {/* Starting Bid */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Starting Bid</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startingBid" className="block text-sm font-medium text-gray-700 mb-2">
              Starting Bid *
            </label>
            <input
              type="number"
              id="startingBid"
              value={formState.pricing?.startingBid || ''}
              onChange={(e) => handleNestedChange('pricing', 'startingBid', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            {validationErrors['pricing.startingBid'] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors['pricing.startingBid'][0]}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              First bid amount to start the auction
            </p>
          </div>

          <div>
            <label htmlFor="minBidIncrement" className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Bid Increment *
            </label>
            <input
              type="number"
              id="minBidIncrement"
              value={formState.pricing?.minBidIncrement || ''}
              onChange={(e) => handleNestedChange('pricing', 'minBidIncrement', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            {validationErrors['pricing.minBidIncrement'] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors['pricing.minBidIncrement'][0]}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Minimum amount each new bid must exceed the previous bid
            </p>
          </div>
        </div>

        {/* Quick Increment Options */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Quick Set Increment:</p>
          <div className="flex flex-wrap gap-2">
            {['1%', '2%', '5%', '10%'].map((increment) => (
              <button
                key={increment}
                onClick={() => {
                  const startingBid = formState.pricing?.startingBid || 0;
                  const incrementValue = startingBid * (parseFloat(increment) / 100);
                  handleNestedChange('pricing', 'minBidIncrement', incrementValue);
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {increment}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Price History */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Price History (Optional)</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="previousSalePrice" className="block text-sm font-medium text-gray-700 mb-2">
              Previous Sale Price
            </label>
            <input
              type="number"
              id="previousSalePrice"
              value={formState.pricing?.previousSalePrice || ''}
              onChange={(e) => handleNestedChange('pricing', 'previousSalePrice', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label htmlFor="previousSaleDate" className="block text-sm font-medium text-gray-700 mb-2">
              Previous Sale Date
            </label>
            <input
              type="date"
              id="previousSaleDate"
              value={formState.pricing?.previousSaleDate || ''}
              onChange={(e) => handleNestedChange('pricing', 'previousSaleDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </div>

      {/* Pricing Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Pricing Strategy Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Reserve Price:</strong> Set at 60-80% of estimated value to attract bids</li>
          <li>• <strong>Starting Bid:</strong> Keep low (10-20% of reserve) to encourage participation</li>
          <li>• <strong>Bid Increment:</strong> 1-5% of starting bid works well for most assets</li>
          <li>• <strong>Buy It Now:</strong> Set 10-20% above estimated value for quick sales</li>
          <li>• <strong>Market Research:</strong> Check similar assets' final prices for reference</li>
        </ul>
      </div>
    </div>
  );
}
