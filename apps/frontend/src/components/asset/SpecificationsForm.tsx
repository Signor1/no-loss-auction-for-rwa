'use client';

import { useState } from 'react';
import { AssetFormState, AssetCondition, AssetAuthenticity, AssetLegalStatus } from '@/lib/asset-management';

interface SpecificationsFormProps {
  formState: AssetFormState;
  updateFormState: (updates: Partial<AssetFormState>) => void;
  validationErrors: Record<string, string[]>;
}

export function SpecificationsForm({ formState, updateFormState, validationErrors }: SpecificationsFormProps) {
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  const handleInputChange = (field: keyof AssetFormState, value: any) => {
    updateFormState({ [field]: value });
  };

  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      const updatedSpecs = {
        ...formState.specifications,
        [newSpecKey.trim()]: newSpecValue.trim()
      };
      updateFormState({ specifications: updatedSpecs });
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const removeSpecification = (key: string) => {
    const updatedSpecs = { ...formState.specifications };
    delete updatedSpecs[key];
    updateFormState({ specifications: updatedSpecs });
  };

  const getCommonSpecifications = () => {
    const category = formState.category;
    
    switch (category) {
      case 'real-estate':
        return [
          { key: 'Property Type', value: '' },
          { key: 'Square Footage', value: '' },
          { key: 'Bedrooms', value: '' },
          { key: 'Bathrooms', value: '' },
          { key: 'Year Built', value: '' },
          { key: 'Parking Spaces', value: '' }
        ];
      case 'art':
        return [
          { key: 'Artist', value: '' },
          { key: 'Medium', value: '' },
          { key: 'Dimensions', value: '' },
          { key: 'Year Created', value: '' },
          { key: 'Style/Movement', value: '' }
        ];
      case 'commodities':
        return [
          { key: 'Weight/Quantity', value: '' },
          { key: 'Purity/Grade', value: '' },
          { key: 'Storage Method', value: '' },
          { key: 'Certification', value: '' }
        ];
      case 'intellectual-property':
        return [
          { key: 'IP Type', value: '' },
          { key: 'Registration Number', value: '' },
          { key: 'Jurisdiction', value: '' },
          { key: 'Expiration Date', value: '' },
          { key: 'License Type', value: '' }
        ];
      case 'financial-instruments':
        return [
          { key: 'Instrument Type', value: '' },
          { key: 'Issuer', value: '' },
          { key: 'Maturity Date', value: '' },
          { key: 'Interest Rate', value: '' },
          { key: 'Credit Rating', value: '' }
        ];
      default:
        return [
          { key: 'Brand', value: '' },
          { key: 'Model', value: '' },
          { key: 'Condition Details', value: '' },
          { key: 'Year of Manufacture', value: '' }
        ];
    }
  };

  const addCommonSpecification = (key: string) => {
    if (key && !formState.specifications[key]) {
      const updatedSpecs = {
        ...formState.specifications,
        [key]: ''
      };
      updateFormState({ specifications: updatedSpecs });
    }
  };

  return (
    <div className="space-y-6">
      {/* Asset Status Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
            Condition *
          </label>
          <select
            id="condition"
            value={formState.condition}
            onChange={(e) => handleInputChange('condition', e.target.value as AssetCondition)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select condition</option>
            <option value="mint">Mint</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
          {validationErrors.condition && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.condition[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="authenticity" className="block text-sm font-medium text-gray-700 mb-2">
            Authenticity *
          </label>
          <select
            id="authenticity"
            value={formState.authenticity}
            onChange={(e) => handleInputChange('authenticity', e.target.value as AssetAuthenticity)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select authenticity</option>
            <option value="verified">Verified</option>
            <option value="authenticated">Authenticated</option>
            <option value="unverified">Unverified</option>
            <option value="replica">Replica</option>
          </select>
          {validationErrors.authenticity && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.authenticity[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="legalStatus" className="block text-sm font-medium text-gray-700 mb-2">
            Legal Status *
          </label>
          <select
            id="legalStatus"
            value={formState.legalStatus}
            onChange={(e) => handleInputChange('legalStatus', e.target.value as AssetLegalStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select legal status</option>
            <option value="clear">Clear Title</option>
            <option value="encumbered">Encumbered</option>
            <option value="disputed">Disputed</option>
            <option value="pending">Pending Review</option>
          </select>
          {validationErrors.legalStatus && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.legalStatus[0]}</p>
          )}
        </div>
      </div>

      {/* Custom Specifications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Asset Specifications</h3>
          <div className="flex items-center space-x-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addCommonSpecification(e.target.value);
                  e.target.value = '';
                }
              }}
              className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Add common spec...</option>
              {getCommonSpecifications().map((spec) => (
                <option key={spec.key} value={spec.key}>
                  {spec.key}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Existing Specifications */}
        <div className="space-y-2 mb-4">
          {Object.entries(formState.specifications).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <input
                type="text"
                value={key}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  const updatedSpecs = {
                    ...formState.specifications,
                    [key]: e.target.value
                  };
                  updateFormState({ specifications: updatedSpecs });
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Value"
              />
              <button
                onClick={() => removeSpecification(key)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Add New Specification */}
        <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
          <input
            type="text"
            value={newSpecKey}
            onChange={(e) => setNewSpecKey(e.target.value)}
            placeholder="Specification name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            value={newSpecValue}
            onChange={(e) => setNewSpecValue(e.target.value)}
            placeholder="Value"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={addSpecification}
            disabled={!newSpecKey.trim() || !newSpecValue.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Help Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">Why Specifications Matter</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Detailed specifications help buyers make informed decisions</li>
          <li>• Include all relevant technical details and measurements</li>
          <li>• Be accurate and honest about all specifications</li>
          <li>• Add certifications, serial numbers, and unique identifiers</li>
          <li>• Consider what questions potential buyers might ask</li>
        </ul>
      </div>
    </div>
  );
}
