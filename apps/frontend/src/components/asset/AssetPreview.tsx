'use client';

import { AssetFormState, AssetCategory, AssetType, AssetCondition, AssetAuthenticity, AssetLegalStatus, PricingStrategy } from '@/lib/asset-management';

interface AssetPreviewProps {
  formState: AssetFormState;
  onPublish: () => void;
  onSaveDraft: () => void;
  isPublishing?: boolean;
  isSaving?: boolean;
}

export function AssetPreview({ formState, onPublish, onSaveDraft, isPublishing, isSaving }: AssetPreviewProps) {
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'ETH' ? 'ETH' : currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount).replace('ETH', '') + ' ' + currency;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCategoryLabel = (category: AssetCategory) => {
    const categories = [
      { value: 'real-estate', label: 'Real Estate' },
      { value: 'art', label: 'Art & Collectibles' },
      { value: 'commodities', label: 'Commodities' },
      { value: 'intellectual-property', label: 'Intellectual Property' },
      { value: 'financial-instruments', label: 'Financial Instruments' }
    ];
    return categories.find(c => c.value === category)?.label || category;
  };

  const getAssetTypeLabel = (type: AssetType) => {
    const types = [
      { value: 'physical', label: 'Physical Asset' },
      { value: 'digital', label: 'Digital Asset' },
      { value: 'real-estate', label: 'Real Estate' },
      { value: 'vehicle', label: 'Vehicle' },
      { value: 'artwork', label: 'Artwork' },
      { value: 'jewelry', label: 'Jewelry' },
      { value: 'collectible', label: 'Collectible' },
      { value: 'intellectual-property', label: 'Intellectual Property' },
      { value: 'financial-instrument', label: 'Financial Instrument' },
      { value: 'commodity', label: 'Commodity' }
    ];
    return types.find(t => t.value === type)?.label || type;
  };

  const getConditionLabel = (condition: AssetCondition) => {
    const conditions = {
      'mint': 'Mint',
      'excellent': 'Excellent',
      'good': 'Good',
      'fair': 'Fair',
      'poor': 'Poor'
    };
    return conditions[condition] || condition;
  };

  const getAuthenticityLabel = (authenticity: AssetAuthenticity) => {
    const authenticities = {
      'verified': 'Verified',
      'authenticated': 'Authenticated',
      'unverified': 'Unverified',
      'replica': 'Replica'
    };
    return authenticities[authenticity] || authenticity;
  };

  const getLegalStatusLabel = (status: AssetLegalStatus) => {
    const statuses = {
      'clear': 'Clear Title',
      'encumbered': 'Encumbered',
      'disputed': 'Disputed',
      'pending': 'Pending Review'
    };
    return statuses[status] || status;
  };

  const getPricingStrategyLabel = (strategy: PricingStrategy) => {
    const strategies = {
      'reserve-price': 'Reserve Price Auction',
      'no-reserve': 'No Reserve Auction',
      'buy-it-now': 'Buy It Now',
      'reserve-plus-bin': 'Reserve Price + Buy It Now'
    };
    return strategies[strategy] || strategy;
  };

  const primaryImage = formState.images.find(img => img.isPrimary) || formState.images[0];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <h2 className="text-2xl font-bold mb-2">Asset Listing Preview</h2>
          <p className="text-blue-100">Review your asset listing before publishing</p>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Asset Title and Basic Info */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">{formState.title || 'Untitled Asset'}</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <span className="text-sm text-gray-500">Category</span>
                <p className="font-medium">{getCategoryLabel(formState.category)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Asset Type</span>
                <p className="font-medium">{getAssetTypeLabel(formState.assetType)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Condition</span>
                <p className="font-medium">{getConditionLabel(formState.condition)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Authenticity</span>
                <p className="font-medium">{getAuthenticityLabel(formState.authenticity)}</p>
              </div>
            </div>

            {formState.location && (
              <div className="mb-4">
                <span className="text-sm text-gray-500">Location</span>
                <p className="font-medium">{formState.location}</p>
              </div>
            )}

            <div className="mb-6">
              <span className="text-sm text-gray-500">Description</span>
              <p className="text-gray-700 mt-1">{formState.description || 'No description provided'}</p>
            </div>

            {formState.longDescription && (
              <div>
                <span className="text-sm text-gray-500">Detailed Description</span>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap">{formState.longDescription}</p>
              </div>
            )}
          </div>

          {/* Images */}
          {formState.images.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Images ({formState.images.length})</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formState.images.map((image) => (
                  <div key={image.id} className="relative">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={image.url}
                        alt={image.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {image.isPrimary && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specifications */}
          {Object.keys(formState.specifications).length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(formState.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">{key}:</span>
                      <span className="text-sm text-gray-600">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          {formState.documents.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Supporting Documents ({formState.documents.length})</h4>
              <div className="space-y-2">
                {formState.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{doc.filename}</p>
                      <p className="text-xs text-gray-500">{doc.documentType} • {(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Valuation */}
          {formState.valuation && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Valuation</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Estimated Value</span>
                    <p className="font-medium">{formatCurrency(formState.valuation.estimatedValue)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Valuation Method</span>
                    <p className="font-medium">{formState.valuation.valuationMethod}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Valuation Date</span>
                    <p className="font-medium">{formatDate(formState.valuation.valuationDate)}</p>
                  </div>
                  {formState.valuation.valuator && (
                    <div>
                      <span className="text-sm text-gray-500">Valuator</span>
                      <p className="font-medium">{formState.valuation.valuator}</p>
                    </div>
                  )}
                </div>
                {formState.valuation.notes && (
                  <div className="mt-4">
                    <span className="text-sm text-gray-500">Valuation Notes</span>
                    <p className="text-sm text-gray-700 mt-1">{formState.valuation.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pricing */}
          {formState.pricing && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Strategy</span>
                    <p className="font-medium">{getPricingStrategyLabel(formState.pricing.pricingStrategy)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Starting Bid</span>
                    <p className="font-medium">{formatCurrency(formState.pricing.startingBid, formState.pricing.currency)}</p>
                  </div>
                  {formState.pricing.reservePrice && (
                    <div>
                      <span className="text-sm text-gray-500">Reserve Price</span>
                      <p className="font-medium">
                        {formState.pricing.showReservePrice 
                          ? formatCurrency(formState.pricing.reservePrice, formState.pricing.currency)
                          : 'Hidden'
                        }
                      </p>
                    </div>
                  )}
                  {formState.pricing.buyItNowPrice && (
                    <div>
                      <span className="text-sm text-gray-500">Buy It Now Price</span>
                      <p className="font-medium">{formatCurrency(formState.pricing.buyItNowPrice, formState.pricing.currency)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Auction Parameters */}
          {formState.auctionParameters && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Auction Parameters</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Start Time</span>
                    <p className="font-medium">{formatDate(formState.auctionParameters.startTime)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">End Time</span>
                    <p className="font-medium">{formatDate(formState.auctionParameters.endTime)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Duration</span>
                    <p className="font-medium">{formState.auctionParameters.duration} days</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Bid Expiration</span>
                    <p className="font-medium">{formState.auctionParameters.bidExpirationPeriod} hours</p>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {formState.auctionParameters.autoSettleEnabled && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Auto-Settlement</span>
                  )}
                  {formState.auctionParameters.secureEscrowEnabled && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Secure Escrow</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              onClick={onSaveDraft}
              disabled={isSaving}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save as Draft'}
            </button>
            
            <button
              onClick={onPublish}
              disabled={isPublishing}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isPublishing ? 'Publishing...' : 'Publish Asset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
