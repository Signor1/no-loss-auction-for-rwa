'use client';

import { AssetFormState, AssetCategory, AssetType, ASSET_CATEGORIES, ASSET_TYPES } from '@/lib/asset-management';

interface BasicInfoFormProps {
  formState: AssetFormState;
  updateFormState: (updates: Partial<AssetFormState>) => void;
  validationErrors: Record<string, string[]>;
}

export function BasicInfoForm({ formState, updateFormState, validationErrors }: BasicInfoFormProps) {
  const handleInputChange = (field: keyof AssetFormState, value: any) => {
    updateFormState({ [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Asset Title *
        </label>
        <input
          type="text"
          id="title"
          value={formState.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter a descriptive title for your asset"
        />
        {validationErrors.title && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.title[0]}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Short Description *
        </label>
        <textarea
          id="description"
          value={formState.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Brief description (max 500 characters)"
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">Provide a concise overview of your asset</span>
          <span className={`text-xs ${formState.description.length > 500 ? 'text-red-600' : 'text-gray-500'}`}>
            {formState.description.length}/500
          </span>
        </div>
        {validationErrors.description && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.description[0]}</p>
        )}
      </div>

      {/* Long Description */}
      <div>
        <label htmlFor="longDescription" className="block text-sm font-medium text-gray-700 mb-2">
          Detailed Description *
        </label>
        <textarea
          id="longDescription"
          value={formState.longDescription}
          onChange={(e) => handleInputChange('longDescription', e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Provide comprehensive details about your asset, including history, features, condition, and any other relevant information"
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">Include all relevant details that potential buyers should know</span>
          <span className={`text-xs ${formState.longDescription.length > 5000 ? 'text-red-600' : 'text-gray-500'}`}>
            {formState.longDescription.length}/5000
          </span>
        </div>
        {validationErrors.longDescription && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.longDescription[0]}</p>
        )}
      </div>

      {/* Category and Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            id="category"
            value={formState.category}
            onChange={(e) => handleInputChange('category', e.target.value as AssetCategory)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a category</option>
            {ASSET_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          {validationErrors.category && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.category[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="assetType" className="block text-sm font-medium text-gray-700 mb-2">
            Asset Type *
          </label>
          <select
            id="assetType"
            value={formState.assetType}
            onChange={(e) => handleInputChange('assetType', e.target.value as AssetType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select an asset type</option>
            {ASSET_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {validationErrors.assetType && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.assetType[0]}</p>
          )}
        </div>
      </div>

      {/* Subcategory */}
      <div>
        <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-2">
          Subcategory
        </label>
        <input
          type="text"
          id="subcategory"
          value={formState.subcategory}
          onChange={(e) => handleInputChange('subcategory', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Residential, Contemporary Art, Gold Bullion"
        />
        <p className="mt-1 text-xs text-gray-500">Helps users find your asset more easily</p>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          type="text"
          id="location"
          value={formState.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., New York, NY, USA or Digital Asset"
        />
        <p className="mt-1 text-xs text-gray-500">Physical location or specify if digital</p>
      </div>

      {/* Additional Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for a Great Listing</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use a clear, descriptive title that includes key features</li>
          <li>• Be honest and detailed about the asset's condition and history</li>
          <li>• Include unique selling points and what makes your asset special</li>
          <li>• Mention any certifications, appraisals, or documentation available</li>
          <li>• Provide accurate location information for physical assets</li>
        </ul>
      </div>
    </div>
  );
}
