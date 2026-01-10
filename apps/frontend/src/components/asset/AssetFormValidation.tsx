'use client';

import { AssetFormState, validateAssetForm } from '@/lib/asset-management';

interface AssetFormValidationProps {
  formState: AssetFormState;
  validationErrors: Record<string, string[]>;
}

export function AssetFormValidation({ formState, validationErrors }: AssetFormValidationProps) {
  const hasErrors = Object.keys(validationErrors).length > 0;
  const errorCount = Object.values(validationErrors).reduce((count, errors) => count + errors.length, 0);

  const getStepErrors = (step: number): string[] => {
    const stepFields: Record<number, string[]> = {
      1: ['title', 'description', 'longDescription', 'category', 'assetType'],
      2: ['condition', 'authenticity', 'legalStatus'],
      3: ['images'],
      4: ['valuation.estimatedValue', 'valuation.valuationMethod', 'valuation.valuationDate'],
      5: ['pricing.pricingStrategy', 'pricing.startingBid', 'pricing.minBidIncrement'],
      6: ['auctionParameters.startTime', 'auctionParameters.endTime']
    };

    const fields = stepFields[step] || [];
    const errors: string[] = [];

    fields.forEach(field => {
      if (validationErrors[field]) {
        errors.push(...validationErrors[field]);
      }
    });

    return errors;
  };

  const steps = [
    { id: 1, title: 'Basic Information' },
    { id: 2, title: 'Specifications' },
    { id: 3, title: 'Media Upload' },
    { id: 4, title: 'Valuation' },
    { id: 5, title: 'Pricing' },
    { id: 6, title: 'Auction Parameters' }
  ];

  const getStepStatus = (step: number) => {
    const errors = getStepErrors(step);
    if (errors.length === 0) return 'complete';
    return 'error';
  };

  const getCompletionPercentage = () => {
    const completedSteps = steps.filter(step => getStepStatus(step.id) === 'complete').length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Overall Status */}
      <div className={`rounded-lg p-4 mb-6 ${
        hasErrors 
          ? 'bg-red-50 border border-red-200' 
          : 'bg-green-50 border border-green-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-medium ${
              hasErrors ? 'text-red-900' : 'text-green-900'
            }`}>
              {hasErrors ? 'Validation Issues Found' : 'All Requirements Met'}
            </h3>
            <p className={`text-sm mt-1 ${
              hasErrors ? 'text-red-700' : 'text-green-700'
            }`}>
              {hasErrors 
                ? `${errorCount} error${errorCount > 1 ? 's' : ''} need${errorCount === 1 ? 's' : ''} to be resolved`
                : 'Your asset listing is ready to publish'
              }
            </p>
          </div>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            hasErrors ? 'bg-red-100' : 'bg-green-100'
          }`}>
            {hasErrors ? (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Completion Progress</span>
          <span className="text-sm text-gray-600">{getCompletionPercentage()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              hasErrors ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${getCompletionPercentage()}%` }}
          />
        </div>
      </div>

      {/* Step-by-Step Validation */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Step Validation</h3>
        
        {steps.map((step) => {
          const errors = getStepErrors(step.id);
          const status = getStepStatus(step.id);
          
          return (
            <div key={step.id} className={`border rounded-lg p-4 ${
              status === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    status === 'error' ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {status === 'error' ? (
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className={`font-medium ${
                      status === 'error' ? 'text-red-900' : 'text-green-900'
                    }`}>
                      Step {step.id}: {step.title}
                    </h4>
                    <p className={`text-sm ${
                      status === 'error' ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {status === 'error' 
                        ? `${errors.length} error${errors.length > 1 ? 's' : ''} found`
                        : 'All requirements met'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              {errors.length > 0 && (
                <div className="mt-3 space-y-1">
                  {errors.map((error, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Missing Required Fields Summary */}
      {hasErrors && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">Required Fields Missing</h4>
          <div className="text-sm text-yellow-800">
            <p className="mb-2">Please complete the following required fields:</p>
            <ul className="space-y-1 ml-4">
              {!formState.title && <li>• Asset title</li>}
              {!formState.description && <li>• Short description</li>}
              {!formState.longDescription && <li>• Detailed description</li>}
              {!formState.category && <li>• Asset category</li>}
              {!formState.assetType && <li>• Asset type</li>}
              {!formState.condition && <li>• Asset condition</li>}
              {!formState.authenticity && <li>• Authenticity status</li>}
              {!formState.legalStatus && <li>• Legal status</li>}
              {formState.images.length === 0 && <li>• At least one asset image</li>}
              {!formState.valuation?.estimatedValue && <li>• Estimated value</li>}
              {!formState.valuation?.valuationMethod && <li>• Valuation method</li>}
              {!formState.valuation?.valuationDate && <li>• Valuation date</li>}
              {!formState.pricing?.pricingStrategy && <li>• Pricing strategy</li>}
              {!formState.pricing?.startingBid && <li>• Starting bid</li>}
              {!formState.pricing?.minBidIncrement && <li>• Minimum bid increment</li>}
              {!formState.auctionParameters?.startTime && <li>• Auction start time</li>}
              {!formState.auctionParameters?.endTime && <li>• Auction end time</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Recommendations</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {formState.images.length < 3 && (
            <li>• Add more images to showcase your asset from different angles</li>
          )}
          {formState.documents.length === 0 && (
            <li>• Upload supporting documents to increase buyer confidence</li>
          )}
          {!formState.valuation?.valuationReports?.length && (
            <li>• Add professional valuation reports for higher-value assets</li>
          )}
          {formState.pricing?.showReservePrice && (
            <li>• Consider hiding the reserve price to encourage more bidding activity</li>
          )}
          {!formState.auctionParameters?.autoSettleEnabled && (
            <li>• Enable auto-settlement for smoother transaction processing</li>
          )}
          {Object.keys(formState.specifications).length < 3 && (
            <li>• Add more detailed specifications to help buyers make informed decisions</li>
          )}
        </ul>
      </div>
    </div>
  );
}
